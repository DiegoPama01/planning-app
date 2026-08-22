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
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { EmployeesService } from '../employees/employees.service';
import { PositionsService } from '../positions/positions.service';
import { ShiftsService } from '../shifts/shifts.service';
import { ZonesService } from '../zones/zones.service';
import {
  PlanningWeekResponse,
  PlanningWeekWritePayload,
} from './planning.model';
import { PlanningService } from './planning.service';

interface PlanningDayColumn {
  key: string;
  label: string;
  dateLabel: string;
  isoDate: string;
}

interface PlanningEmployeeRow {
  id: string;
  fullName: string;
  positionName: string;
  zones: Array<{ id: string; name: string; color: string }>;
  shifts: Array<{ id: string; name: string; startTime: string; endTime: string; color: string }>;
}

interface AssignmentCellState {
  assignmentId: string | null;
  zoneId: string | null;
  shiftId: string | null;
}

@Component({
  selector: 'app-planning',
  imports: [HlmButtonImports, HlmCardImports, HlmInputImports, HlmSelectImports, HlmTableImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './planning.component.html',
})
export class PlanningComponent {
  private readonly employeesService = inject(EmployeesService);
  private readonly positionsService = inject(PositionsService);
  private readonly zonesService = inject(ZonesService);
  private readonly shiftsService = inject(ShiftsService);
  private readonly planningService = inject(PlanningService);
  protected readonly selectedDate = signal(this.formatDateForInput(new Date()));
  protected readonly assignments = signal<Record<string, AssignmentCellState>>({});
  protected readonly saveError = signal<string | null>(null);
  protected readonly saveSuccess = signal<string | null>(null);
  protected readonly isSaving = signal(false);

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

  protected readonly visibleEmployees = computed(() => this.planningRows());

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

  protected async saveWeek(): Promise<void> {
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
    } catch {
      this.saveError.set('We could not save planning changes. Please review the assignments and try again.');
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

  private assignmentKey(employeeId: string, isoDate: string): string {
    return `${employeeId}:${isoDate}`;
  }

  private syncAssignments(week: PlanningWeekResponse, force = false): void {
    const nextAssignments: Record<string, AssignmentCellState> = {};

    for (const assignment of week.assignments) {
      nextAssignments[this.assignmentKey(assignment.employee, assignment.work_date)] = {
        assignmentId: assignment.id,
        zoneId: assignment.zone,
        shiftId: assignment.shift,
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
        };
      });
  }
}
