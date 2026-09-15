import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  resource,
  signal,
} from '@angular/core';
import { firstValueFrom, forkJoin } from 'rxjs';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChevronLeft,
  lucideChevronRight,
  lucideDownload,
  lucideFilter,
  lucideRefreshCw,
} from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmButtonGroupImports } from '@spartan-ng/helm/button-group';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmDatePickerImports } from '@spartan-ng/helm/date-picker';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmPopoverImports } from '@spartan-ng/helm/popover';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { toast } from 'ngx-sonner';
import { EmployeesService } from '../employees/employees.service';
import { PositionsService } from '../positions/positions.service';
import { ShiftsService } from '../shifts/shifts.service';
import { ZonesService } from '../zones/zones.service';
import {
  PlanningWeekResponse,
  PlanningWeekWritePayload,
} from './planning.model';
import { PlanningService } from './planning.service';
import { buildPlanningCsv, type PlanningExportRow } from './planning-export';

interface PlanningDayColumn {
  key: string;
  label: string;
  dateLabel: string;
  isoDate: string;
}

interface PlanningEmployeeRow {
  id: string;
  fullName: string;
  positionId: string;
  positionName: string;
  zones: Array<{ id: string; name: string; color: string }>;
  shifts: Array<{ id: string; name: string; startTime: string; endTime: string; color: string }>;
}

interface PlanningFilterOption {
  id: string;
  label: string;
}

type PlanningColorMode = 'zone' | 'shift';

interface AssignmentCellState {
  assignmentId: string | null;
  zoneId: string | null;
  shiftId: string | null;
  note: string;
}

interface CellEditorState {
  employeeId: string;
  isoDate: string;
  zoneId: string | null;
  shiftId: string | null;
  note: string;
}

@Component({
  selector: 'app-planning',
  imports: [NgIcon, HlmButtonImports, HlmButtonGroupImports, HlmCardImports, HlmDatePickerImports, HlmDropdownMenuImports, HlmInputImports, HlmPopoverImports, HlmSelectImports, HlmTableImports],
  providers: [provideIcons({ lucideChevronLeft, lucideChevronRight, lucideDownload, lucideFilter, lucideRefreshCw })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './planning.component.html',
})
export class PlanningComponent {
  private readonly employeesService = inject(EmployeesService);
  private readonly positionsService = inject(PositionsService);
  private readonly zonesService = inject(ZonesService);
  private readonly shiftsService = inject(ShiftsService);
  private readonly planningService = inject(PlanningService);
  private readonly document = inject(DOCUMENT);
  protected readonly selectedDate = signal(this.formatDateForInput(new Date()));
  protected readonly assignments = signal<Record<string, AssignmentCellState>>({});
  protected readonly openPopoverKey = signal<string | null>(null);
  protected readonly cellEditor = signal<CellEditorState | null>(null);
  protected readonly saveError = signal<string | null>(null);
  protected readonly saveSuccess = signal<string | null>(null);
  protected readonly isSaving = signal(false);
  protected readonly isExporting = signal(false);
  protected readonly exportError = signal<string | null>(null);
  protected readonly exportSuccess = signal<string | null>(null);
  protected readonly colorMode = signal<PlanningColorMode>('zone');
  protected readonly selectedPositionId = signal<string | null>(null);
  protected readonly selectedZoneId = signal<string | null>(null);
  protected readonly selectedShiftId = signal<string | null>(null);

  constructor() {
    effect(() => {
      const week = this.planningWeekResource.value();

      if (week) {
        this.syncAssignments(week, true);
      }
    });
  }

  protected readonly planningResource = resource({
    loader: async () =>
      firstValueFrom(
        forkJoin({
          employees: this.employeesService.list(),
          positions: this.positionsService.list(),
          zones: this.zonesService.list(),
          shifts: this.shiftsService.list(),
        }),
      ),
  });

  protected readonly planningRows = computed<PlanningEmployeeRow[]>(() => {
    const data = this.planningResource.value();

    if (!data) {
      return [];
    }

    const positionsById = new Map(data.positions.map((position) => [position.id, position]));
    const zonesById = new Map(data.zones.map((zone) => [zone.id, zone]));
    const shiftsById = new Map(data.shifts.map((shift) => [shift.id, shift]));

    return data.employees
      .filter((employee) => employee.active)
      .map((employee) => ({
        id: employee.id,
        fullName: `${employee.first_name} ${employee.last_name}`.trim() || employee.first_name,
        positionId: employee.position,
        positionName: positionsById.get(employee.position)?.name ?? 'Unknown position',
        zones: employee.allowed_zones
          .map((zoneId) => zonesById.get(zoneId))
          .filter((zone) => zone !== undefined)
          .map((zone) => ({ id: zone.id, name: zone.name, color: zone.color })),
        shifts: employee.allowed_shifts
          .map((shiftId) => shiftsById.get(shiftId))
          .filter((shift) => shift !== undefined)
          .map((shift) => ({
            id: shift.id,
            name: shift.name,
            startTime: shift.start_time,
            endTime: shift.end_time,
            color: shift.color,
          })),
      }));
  });

  protected readonly planningWeekResource = resource({
    params: () => ({
      weekStart: this.weekStartIso(),
    }),
    loader: async ({ params }) => firstValueFrom(this.planningService.getWeek(params.weekStart)),
  });

  protected readonly planningError = computed(() => {
    const error = this.planningResource.error() ?? this.planningWeekResource.error();

    if (!error) {
      return null;
    }

    return error instanceof Error
      ? error.message
      : 'We could not load planning data right now. Please try again.';
  });

  protected readonly weekStart = computed(() => this.startOfWeek(this.parseDate(this.selectedDate())));
  protected readonly selectedPlanningDate = computed(() => this.parseDate(this.selectedDate()));
  protected readonly weekStartIso = computed(() => this.formatDateForInput(this.weekStart()));
  protected readonly weekRangeLabel = computed(() => this.formatWeekRange(this.weekStart()));
  protected readonly planningDays = computed<PlanningDayColumn[]>(() => {
    const weekStart = this.weekStart();
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    return dayKeys.map((key, index) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + index);

      return {
        key,
        label: dayLabels[index] ?? key,
        dateLabel: this.formatDayDate(date),
        isoDate: this.formatDateForInput(date),
      };
    });
  });

  protected reload(): void {
    void this.planningResource.reload();
    void this.planningWeekResource.reload();
  }

  protected updateSelectedDate(value: string): void {
    this.selectedDate.set(value || this.formatDateForInput(new Date()));
    this.saveError.set(null);
    this.saveSuccess.set(null);
  }

  protected updateSelectedDateFromPicker(value: Date | null | undefined): void {
    this.updateSelectedDate(value ? this.formatDateForInput(value) : this.formatDateForInput(new Date()));
  }

  protected goToPreviousWeek(): void {
    const date = new Date(this.weekStart());
    date.setDate(date.getDate() - 7);
    this.selectedDate.set(this.formatDateForInput(date));
    this.saveError.set(null);
    this.saveSuccess.set(null);
  }

  protected goToNextWeek(): void {
    const date = new Date(this.weekStart());
    date.setDate(date.getDate() + 7);
    this.selectedDate.set(this.formatDateForInput(date));
    this.saveError.set(null);
    this.saveSuccess.set(null);
  }

  protected readonly positionOptions = computed<PlanningFilterOption[]>(() => {
    const options = new Map<string, string>();

    for (const employee of this.planningRows()) {
      options.set(employee.positionId, employee.positionName);
    }

    return Array.from(options.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((left, right) => left.label.localeCompare(right.label));
  });
  protected readonly zoneFilterOptions = computed<PlanningFilterOption[]>(() => {
    const options = new Map<string, string>();

    for (const employee of this.planningRows()) {
      for (const zone of employee.zones) {
        options.set(zone.id, zone.name);
      }
    }

    return Array.from(options.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((left, right) => left.label.localeCompare(right.label));
  });
  protected readonly shiftFilterOptions = computed<PlanningFilterOption[]>(() => {
    const options = new Map<string, string>();

    for (const employee of this.planningRows()) {
      for (const shift of employee.shifts) {
        options.set(shift.id, shift.name);
      }
    }

    return Array.from(options.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((left, right) => left.label.localeCompare(right.label));
  });

  protected readonly visibleEmployees = computed(() => {
    const positionId = this.selectedPositionId();
    const zoneId = this.selectedZoneId();
    const shiftId = this.selectedShiftId();

    return this.planningRows().filter((employee) => {
      if (positionId && employee.positionId !== positionId) {
        return false;
      }

      if (zoneId && !employee.zones.some((zone) => zone.id === zoneId)) {
        return false;
      }

      if (shiftId && !employee.shifts.some((shift) => shift.id === shiftId)) {
        return false;
      }

      return true;
    });
  });
  protected readonly hasActiveFilters = computed(() => Boolean(
    this.selectedPositionId() || this.selectedZoneId() || this.selectedShiftId(),
  ));

  protected updateColorMode(mode: string | null | undefined): void {
    this.colorMode.set(mode === 'shift' ? 'shift' : 'zone');
  }

  protected updatePositionFilter(positionId: string | null): void {
    this.selectedPositionId.set(positionId);
  }

  protected updateZoneFilter(zoneId: string | null): void {
    this.selectedZoneId.set(zoneId);
  }

  protected updateShiftFilter(shiftId: string | null): void {
    this.selectedShiftId.set(shiftId);
  }

  protected clearFilters(): void {
    this.selectedPositionId.set(null);
    this.selectedZoneId.set(null);
    this.selectedShiftId.set(null);
  }

  protected readonly colorModeToLabel = (value: string | null | undefined) => {
    if (value === 'shift') {
      return 'Shift color';
    }

    return 'Zone color';
  };

  protected readonly filterOptionToLabel = (options: () => PlanningFilterOption[]) => (value: string | null | undefined) => {
    if (!value) {
      return '';
    }

    return options().find((option) => option.id === value)?.label ?? '';
  };

  protected readonly zoneToLabel = (employee: PlanningEmployeeRow) => (value: string | null | undefined) => {
    if (!value) {
      return '';
    }

    return employee.zones.find((zone) => zone.id === value)?.name ?? '';
  };

  protected readonly shiftToLabel = (employee: PlanningEmployeeRow) => (value: string | null | undefined) => {
    if (!value) {
      return '';
    }

    return employee.shifts.find((shift) => shift.id === value)?.name ?? '';
  };

  protected getAssignment(employeeId: string, isoDate: string): AssignmentCellState {
    return this.assignments()[this.assignmentKey(employeeId, isoDate)] ?? {
      assignmentId: null,
      zoneId: null,
      shiftId: null,
      note: '',
    };
  }

  protected updateZone(employeeId: string, isoDate: string, zoneId: string | null): void {
    this.assignments.update((state) => ({
      ...state,
        [this.assignmentKey(employeeId, isoDate)]: {
          ...this.getAssignment(employeeId, isoDate),
          zoneId,
        },
    }));
    this.saveSuccess.set(null);
  }

  protected updateShift(employeeId: string, isoDate: string, shiftId: string | null): void {
    this.assignments.update((state) => ({
      ...state,
        [this.assignmentKey(employeeId, isoDate)]: {
          ...this.getAssignment(employeeId, isoDate),
          shiftId,
        },
    }));
    this.saveSuccess.set(null);
  }

  protected openCellEditor(employeeId: string, isoDate: string): void {
    const assignment = this.getAssignment(employeeId, isoDate);

    this.cellEditor.set({
      employeeId,
      isoDate,
      zoneId: assignment.zoneId,
      shiftId: assignment.shiftId,
      note: assignment.note,
    });
    this.openPopoverKey.set(this.assignmentKey(employeeId, isoDate));
    this.saveError.set(null);
  }

  protected handlePopoverStateChange(cellKey: string, state: string, employeeId: string, isoDate: string): void {
    if (state === 'open') {
      this.openCellEditor(employeeId, isoDate);
      return;
    }

    if (this.openPopoverKey() === cellKey) {
      this.openPopoverKey.set(null);
      this.cellEditor.set(null);
    }
  }

  protected updateEditorZone(zoneId: string | null): void {
    this.cellEditor.update((state) => (state ? { ...state, zoneId } : state));
  }

  protected updateEditorShift(shiftId: string | null): void {
    this.cellEditor.update((state) => (state ? { ...state, shiftId } : state));
  }

  protected updateEditorNote(note: string): void {
    this.cellEditor.update((state) => (state ? { ...state, note } : state));
  }

  protected async saveCellAssignment(): Promise<void> {
    const editor = this.cellEditor();

    if (!editor) {
      return;
    }

    this.assignments.update((state) => ({
      ...state,
        [this.assignmentKey(editor.employeeId, editor.isoDate)]: {
          ...this.getAssignment(editor.employeeId, editor.isoDate),
          zoneId: editor.zoneId,
          shiftId: editor.shiftId,
          note: editor.note.trim(),
        },
    }));

    await this.persistCurrentWeek();
  }

  protected async clearCellAssignment(): Promise<void> {
    const editor = this.cellEditor();

    if (!editor) {
      return;
    }

    this.assignments.update((state) => {
      const next = { ...state };
      delete next[this.assignmentKey(editor.employeeId, editor.isoDate)];
      return next;
    });

    await this.persistCurrentWeek();
  }

  protected getCellSummary(employee: PlanningEmployeeRow, isoDate: string): { zone: string; shift: string; empty: boolean } {
    const assignment = this.getAssignment(employee.id, isoDate);
    const zone = employee.zones.find((item) => item.id === assignment.zoneId)?.name ?? '';
    const shift = employee.shifts.find((item) => item.id === assignment.shiftId)?.name ?? '';

    return {
      zone,
      shift,
      empty: !zone && !shift,
    };
  }

  protected getCellBackgroundColor(employee: PlanningEmployeeRow, isoDate: string): string | null {
    const assignment = this.getAssignment(employee.id, isoDate);

    if (this.colorMode() === 'shift') {
      return employee.shifts.find((item) => item.id === assignment.shiftId)?.color ?? null;
    }

    return employee.zones.find((item) => item.id === assignment.zoneId)?.color ?? null;
  }

  protected getCellSurfaceStyle(employee: PlanningEmployeeRow, isoDate: string): string | null {
    const color = this.getCellBackgroundColor(employee, isoDate);

    if (!color) {
      return null;
    }

    return `background-color: ${this.toTransparentColor(color, 0.18)}; color: #111827;`;
  }

  protected getCellButtonClass(employee: PlanningEmployeeRow, isoDate: string): string {
    const baseClass = 'h-full min-h-12 w-full cursor-pointer items-start justify-start rounded-none border-0 px-3 py-2 text-left shadow-none transition-colors duration-150';

    return this.getCellBackgroundColor(employee, isoDate)
      ? `${baseClass} hover:brightness-75 focus-visible:brightness-75`
      : `${baseClass} hover:bg-muted/90 focus-visible:bg-muted/90`;
  }

  protected getCellSecondaryTextClass(employee: PlanningEmployeeRow, isoDate: string): string {
    return this.getCellBackgroundColor(employee, isoDate) ? 'text-black/70' : 'text-muted-foreground';
  }

  protected async saveWeek(): Promise<void> {
    await this.persistCurrentWeek();
  }

  protected exportPlanning(): void {
    if (this.planningRows().length === 0 || this.isExporting()) {
      return;
    }

    this.isExporting.set(true);
    this.exportError.set(null);
    this.exportSuccess.set(null);

    try {
      const rows: PlanningExportRow[] = this.planningRows().map((employee) => ({
        employee: employee.fullName,
        position: employee.positionName,
        cells: this.planningDays().map((day) => {
          const assignment = this.getAssignment(employee.id, day.isoDate);
          const zone = employee.zones.find((item) => item.id === assignment.zoneId);
          const shift = employee.shifts.find((item) => item.id === assignment.shiftId);

          return {
            date: day.isoDate,
            day: day.label,
            zone: zone?.name ?? '',
            shift: shift?.name ?? '',
            startTime: shift?.startTime ?? '',
            endTime: shift?.endTime ?? '',
            note: assignment.note,
          };
        }),
      }));

      const blob = new Blob([`\ufeff${buildPlanningCsv(rows)}`], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = this.document.createElement('a');
      link.href = url;
      link.download = `planning-${this.weekStartIso()}.csv`;
      this.document.body?.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      this.exportSuccess.set(`Planning exported for ${this.weekRangeLabel()}.`);
      toast.success('Planning exported successfully.');
    } catch {
      this.exportError.set('We could not export planning right now. Please try again.');
      toast.error('We could not export planning.');
    } finally {
      this.isExporting.set(false);
    }
  }

  private async persistCurrentWeek(): Promise<void> {
    const payloadAssignments = this.buildWritePayload();

    this.isSaving.set(true);
    this.saveError.set(null);
    this.saveSuccess.set(null);

    try {
      const response = await firstValueFrom(
        this.planningService.saveWeek(this.weekStartIso(), {
          assignments: payloadAssignments,
        }),
      );

      this.syncAssignments(response, true);
      this.saveSuccess.set('Planning saved for the selected week.');
      toast.success('Planning saved for the selected week.');
      this.openPopoverKey.set(null);
      this.cellEditor.set(null);
    } catch {
      this.saveError.set('We could not save planning changes. Please review the assignments and try again.');
      toast.error('We could not save planning changes.');
    } finally {
      this.isSaving.set(false);
    }
  }

  private parseDate(value: string): Date {
    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
      return new Date();
    }

    return parsed;
  }

  private startOfWeek(date: Date): Date {
    const start = new Date(date);
    const day = start.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() + diff);
    return start;
  }

  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatDayDate(date: Date): string {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
    }).format(date);
  }

  private formatWeekRange(startDate: Date): string {
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    const formatter = new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    return `${formatter.format(startDate)} - ${formatter.format(endDate)}`;
  }

  private toTransparentColor(color: string, alpha: number): string {
    const normalized = color.trim();

    if (/^#([\da-f]{3}|[\da-f]{6})$/i.test(normalized)) {
      let hex = normalized.slice(1);

      if (hex.length === 3) {
        hex = hex
          .split('')
          .map((char) => char + char)
          .join('');
      }

      const red = Number.parseInt(hex.slice(0, 2), 16);
      const green = Number.parseInt(hex.slice(2, 4), 16);
      const blue = Number.parseInt(hex.slice(4, 6), 16);

      return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
    }

    const rgbMatch = normalized.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/i);

    if (rgbMatch) {
      const [, red, green, blue] = rgbMatch;
      return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
    }

    const rgbaMatch = normalized.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/i);

    if (rgbaMatch) {
      const [, red, green, blue] = rgbaMatch;
      return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
    }

    return color;
  }

  protected assignmentKey(employeeId: string, isoDate: string): string {
    return `${employeeId}:${isoDate}`;
  }

  private syncAssignments(week: PlanningWeekResponse, force = false): void {
    const nextAssignments: Record<string, AssignmentCellState> = {};

    for (const assignment of week.assignments) {
      nextAssignments[this.assignmentKey(assignment.employee, assignment.work_date)] = {
        assignmentId: assignment.id,
        zoneId: assignment.zone,
        shiftId: assignment.shift,
        note: assignment.note,
      };
    }

    if (force || Object.keys(this.assignments()).length === 0) {
      this.assignments.set(nextAssignments);
    }
  }

  private buildWritePayload(): PlanningWeekWritePayload['assignments'] {
    const visibleDates = new Set(this.planningDays().map((day) => day.isoDate));

    return Object.entries(this.assignments())
      .filter(([key, value]) => {
        const [, isoDate] = key.split(':');
        return visibleDates.has(isoDate ?? '') && value.zoneId && value.shiftId;
      })
      .map(([key, value]) => {
        const [employeeId, isoDate] = key.split(':');

        return {
          employee: employeeId ?? '',
          work_date: isoDate ?? '',
          zone: value.zoneId ?? '',
          shift: value.shiftId ?? '',
          note: value.note.trim(),
        };
      });
  }
}
