import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, resource, signal } from '@angular/core';
import { CdkDropList, CdkDropListGroup } from '@angular/cdk/drag-drop';
import { firstValueFrom, forkJoin } from 'rxjs';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronLeft, lucideChevronRight, lucideClock3, lucideDownload, lucideListFilter, lucideRefreshCw, lucideUserRound } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmDatePickerImports } from '@spartan-ng/helm/date-picker';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { toast } from 'ngx-sonner';
import { EmployeesService } from '../employees/employees.service';
import { PositionsService } from '../positions/positions.service';
import { ShiftsService } from '../shifts/shifts.service';
import { ZonesService } from '../zones/zones.service';
import { Employee } from '../employees/employees.model';
import { Position } from '../positions/positions.model';
import { Shift } from '../shifts/shifts.model';
import { Zone } from '../zones/zones.model';
import { PlanningWeekResponse, PlanningWeekWritePayload, ZoneShiftPreset } from './planning.model';
import { PlanningService } from './planning.service';
import { buildPlanningCsv, type PlanningExportRow } from './planning-export';
import { PlanningEmployeeCardComponent } from './planning-employee-card.component';
import { PlanningDropEvent, PlanningDropZoneComponent } from './planning-drop-zone.component';
import { buildPlanningRows, type PlanningRow } from './planning-rows';

interface Day { label: string; dateLabel: string; isoDate: string; }
interface Assignment { zoneId: string; shiftId: string; note: string; }
@Component({
  selector: 'app-planning',
  imports: [NgIcon, CdkDropList, CdkDropListGroup, HlmButtonImports, HlmCardImports, HlmBadgeImports, HlmDatePickerImports, HlmTableImports, HlmInputImports, HlmDropdownMenuImports, PlanningEmployeeCardComponent, PlanningDropZoneComponent],
  providers: [provideIcons({ lucideChevronLeft, lucideChevronRight, lucideClock3, lucideDownload, lucideListFilter, lucideRefreshCw, lucideUserRound })],
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

  protected readonly selectedDate = signal(this.formatDate(new Date()));
  protected readonly assignments = signal<Record<string, Assignment>>({});
  protected readonly employeeSearch = signal('');
  protected readonly zoneFilter = signal('all');
  protected readonly positionFilter = signal('all');
  protected readonly isSaving = signal(false);
  protected readonly hasPendingChanges = signal(false);
  protected readonly saveError = signal<string | null>(null);
  protected readonly isExporting = signal(false);
  private readonly autoSaveDelayMs = 2000;
  private autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
  private autoSaveQueued = false;
  private assignmentRevision = 0;
  protected readonly planningResource = resource({
    loader: async () => firstValueFrom(forkJoin({ employees: this.employeesService.list(), positions: this.positionsService.list(), zones: this.zonesService.list(), shifts: this.shiftsService.list() })),
  });
  protected readonly planningWeekResource = resource({
    params: () => ({ weekStart: this.weekStartIso() }),
    loader: async ({ params }) => firstValueFrom(this.planningService.getWeek(params.weekStart)),
  });

  protected readonly weekStart = computed(() => this.startOfWeek(new Date(this.selectedDate())));
  protected readonly weekStartIso = computed(() => this.formatDate(this.weekStart()));
  protected readonly weekRangeLabel = computed(() => {
    const start = this.weekStart(); const end = new Date(start); end.setDate(start.getDate() + 6);
    return `${this.formatDay(start)} - ${this.formatDay(end)}`;
  });
  protected readonly days = computed<Day[]>(() => Array.from({ length: 7 }, (_, index) => {
    const date = new Date(this.weekStart()); date.setDate(date.getDate() + index);
    return { label: date.toLocaleDateString('en-GB', { weekday: 'short' }), dateLabel: this.formatDay(date), isoDate: this.formatDate(date) };
  }));
  protected readonly data = computed(() => this.planningResource.value());
  protected readonly week = computed(() => this.planningWeekResource.value());
  protected readonly presets = computed(() => this.week()?.zone_shift_presets ?? []);
  protected readonly rows = computed<PlanningRow[]>(() => {
    const data = this.data();
    if (!data) return [];
    return buildPlanningRows(data.positions, data.zones, this.presets(), this.week()?.requirements ?? [], { zone: this.zoneFilter(), shift: 'all', position: this.positionFilter() });
  });
  protected readonly visibleEmployees = computed(() => {
    const query = this.employeeSearch().trim().toLocaleLowerCase();
    return (this.data()?.employees ?? []).filter((employee) => employee.active && `${employee.first_name} ${employee.last_name}`.toLocaleLowerCase().includes(query));
  });
  protected readonly visibleStaffCount = computed(() => this.visibleEmployees().length);
  protected readonly employeeById = computed(() => new Map((this.data()?.employees ?? []).map((employee) => [employee.id, employee])));
  protected readonly zoneById = computed(() => new Map((this.data()?.zones ?? []).map((zone) => [zone.id, zone])));
  protected readonly shiftById = computed(() => new Map((this.data()?.shifts ?? []).map((shift) => [shift.id, shift])));

  constructor() { effect(() => { const week = this.week(); if (week) this.syncAssignments(week); }); }

  protected reload(): void { void this.planningResource.reload(); void this.planningWeekResource.reload(); }
  protected previousWeek(): void { this.moveWeek(-7); }
  protected nextWeek(): void { this.moveWeek(7); }
  protected updateDate(date: Date | null | undefined): void { if (date) this.selectedDate.set(this.formatDate(date)); }
  protected moveWeek(days: number): void { const date = new Date(this.weekStart()); date.setDate(date.getDate() + days); this.selectedDate.set(this.formatDate(date)); }
  protected employeeName(id: string): string { const employee = this.employeeById().get(id); return employee ? `${employee.first_name} ${employee.last_name}`.trim() : 'Unknown employee'; }
  protected positionName(id: string): string { return this.data()?.positions.find((position) => position.id === id)?.name ?? 'Unknown position'; }
  protected zoneName(id: string): string { return this.zoneById().get(id)?.name ?? 'Zone'; }
  protected zoneColor(id: string): string { return this.zoneById().get(id)?.color ?? 'currentColor'; }
  protected shiftName(id: string): string { return this.shiftById().get(id)?.name ?? 'Shift'; }
  protected shiftLabel(id: string): string { const shift = this.shiftById().get(id); return shift ? `${shift.name} ${shift.start_time.slice(0, 5)}-${shift.end_time.slice(0, 5)}` : 'Shift'; }
  protected assignmentsFor(row: PlanningRow, date: string): Employee[] { return (this.data()?.employees ?? []).filter((employee) => { const assignment = this.assignments()[this.key(employee.id, date)]; return employee.position === row.position.id && assignment?.zoneId === row.preset.zone && assignment.shiftId === row.preset.shift; }); }
  protected coverage(row: PlanningRow, date: string): number { return this.assignmentsFor(row, date).length; }
  protected moveEmployee(event: PlanningDropEvent, date: string, preset: ZoneShiftPreset): void {
    const employeeId = event.employee.id;
    const employee = this.employeeById().get(employeeId);
    if (!employee || !employee.allowed_zones.includes(preset.zone) || !employee.allowed_shifts.includes(preset.shift)) { toast.error('This employee cannot work this zone and shift.'); return; }
    if (event.source?.date === date && event.source.preset.zone === preset.zone && event.source.preset.shift === preset.shift) {
      this.assignments.update((state) => ({ ...state }));
      return;
    }
    this.assignments.update((state) => {
      const next = { ...state };
      delete next[this.key(employeeId, date)];
      if (event.source) delete next[this.key(employeeId, event.source.date)];
      next[this.key(employeeId, date)] = { zoneId: preset.zone, shiftId: preset.shift, note: '' };
      return next;
    });
    this.assignmentRevision += 1;
    this.hasPendingChanges.set(true);
    this.saveError.set(null);
    this.scheduleAutoSave();
  }
  protected remove(employeeId: string, date: string): void {
    this.assignments.update((state) => { const next = { ...state }; delete next[this.key(employeeId, date)]; return next; });
    this.assignmentRevision += 1;
    this.hasPendingChanges.set(true);
    this.scheduleAutoSave();
  }
  protected exportPlanning(): void { const data = this.data(); if (!data || this.isExporting()) return; this.isExporting.set(true); try { const rows: PlanningExportRow[] = data.employees.filter((employee) => employee.active).map((employee) => ({ employee: this.employeeName(employee.id), position: this.positionName(employee.position), cells: this.days().map((day) => { const assignment = this.assignments()[this.key(employee.id, day.isoDate)]; const shift = assignment ? this.shiftById().get(assignment.shiftId) : undefined; return { date: day.isoDate, day: day.label, zone: assignment ? this.zoneName(assignment.zoneId) : '', shift: shift?.name ?? '', startTime: shift?.start_time ?? '', endTime: shift?.end_time ?? '', note: assignment?.note ?? '' }; }) })); const blob = new Blob([`\ufeff${buildPlanningCsv(rows)}`], { type: 'text/csv;charset=utf-8' }); const url = URL.createObjectURL(blob); const link = this.document.createElement('a'); link.href = url; link.download = `planning-${this.weekStartIso()}.csv`; link.click(); URL.revokeObjectURL(url); } finally { this.isExporting.set(false); } }
  private syncAssignments(week: PlanningWeekResponse): void { const next: Record<string, Assignment> = {}; for (const assignment of week.assignments) next[this.key(assignment.employee, assignment.work_date)] = { zoneId: assignment.zone, shiftId: assignment.shift, note: assignment.note }; this.assignments.set(next); this.hasPendingChanges.set(false); }
  private writePayload(): PlanningWeekWritePayload['assignments'] { return Object.entries(this.assignments()).map(([key, assignment]) => { const [employee, work_date] = key.split(':'); return { employee: employee ?? '', work_date: work_date ?? '', zone: assignment.zoneId, shift: assignment.shiftId, note: assignment.note }; }); }
  private scheduleAutoSave(): void {
    this.autoSaveQueued = true;
    if (this.autoSaveTimer) clearTimeout(this.autoSaveTimer);
    this.autoSaveTimer = setTimeout(() => {
      this.autoSaveTimer = null;
      void this.flushAutoSave();
    }, this.autoSaveDelayMs);
  }
  private async flushAutoSave(): Promise<void> {
    if (this.isSaving()) return;
    this.autoSaveQueued = false;
    const revision = this.assignmentRevision;
    const payload = { assignments: this.writePayload() };
    this.isSaving.set(true);
    this.saveError.set(null);
    try {
      const response = await firstValueFrom(this.planningService.saveWeek(this.weekStartIso(), payload));
      if (revision === this.assignmentRevision) this.syncAssignments(response);
    } catch {
      this.saveError.set('Could not save planning automatically. Review the assignments and try again.');
      toast.error('Could not save planning automatically.');
    } finally {
      this.isSaving.set(false);
      if (this.autoSaveQueued) this.scheduleAutoSave();
    }
  }
  private key(employee: string, date: string): string { return `${employee}:${date.slice(0, 10)}`; }
  private startOfWeek(date: Date): Date { const result = new Date(date); const day = result.getDay(); result.setDate(result.getDate() + (day === 0 ? -6 : 1 - day)); result.setHours(0, 0, 0, 0); return result; }
  private formatDate(date: Date): string { return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}-${`${date.getDate()}`.padStart(2, '0')}`; }
  private formatDay(date: Date): string { return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
}
