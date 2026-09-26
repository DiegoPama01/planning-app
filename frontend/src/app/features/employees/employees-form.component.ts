import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmCheckboxImports } from '@spartan-ng/helm/checkbox';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmSwitchImports } from '@spartan-ng/helm/switch';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { InstallationOption } from '../../core/company/installation.model';
import { randomFormColor } from '../../shared/color-utils';
import { Position } from '../positions/positions.model';
import { Shift } from '../shifts/shifts.model';
import { Zone } from '../zones/zones.model';
import { EmployeeUpsertPayload } from './employees.model';

@Component({
  selector: 'app-employees-form',
  imports: [
    FormRoot,
    FormField,
    HlmButtonImports,
    HlmCardImports,
    HlmCheckboxImports,
    HlmFieldImports,
    HlmInputImports,
    HlmSelectImports,
    HlmSwitchImports,
    HlmTableImports,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './employees-form.component.html',
})
export class EmployeesFormComponent {
  private readonly router = inject(Router);

  readonly initialValue = input.required<EmployeeUpsertPayload>();
  readonly positions = input<Position[]>([]);
  readonly zones = input<Zone[]>([]);
  readonly shifts = input<Shift[]>([]);
  readonly installations = input<InstallationOption[]>([]);
  readonly submitLabel = input('Save employee');
  readonly formError = input<string | null>(null);
  readonly submitForm = input.required<(value: EmployeeUpsertPayload) => Promise<void>>();
  readonly cancelLink = input.required<string>();

  protected async cancel(): Promise<void> {
    await this.router.navigateByUrl(this.cancelLink());
  }

  protected readonly model = signal<EmployeeUpsertPayload>({
    employee_code: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    hire_date: '',
    termination_date: '',
    color: randomFormColor(),
    notes: '',
    active: true,
    position: '',
    allowed_zones: [],
    allowed_shifts: [],
  });

  protected readonly filteredPositions = computed(() => this.filterByInstallation(this.positions()));
  protected readonly filteredZones = computed(() => this.filterByInstallation(this.zones()));
  protected readonly filteredShifts = computed(() => this.filterByInstallation(this.shifts()));

  constructor() {
    effect(() => {
      this.model.set(this.initialValue());
    });
  }

  protected readonly employeeForm = form(
    this.model,
    (schema) => {
      required(schema.first_name, { message: 'First name is required.' });
      required(schema.last_name, { message: 'Last name is required.' });
      required(schema.position, { message: 'Position is required.' });
    },
    {
      submission: {
        action: async () => {
          await this.submitForm()({ ...this.model() });
        },
      },
    },
  );

  protected readonly positionToLabel = (value: string | null | undefined) => {
    if (!value) {
      return '';
    }

    return this.positions().find((position) => position.id === value)?.name ?? '';
  };

  protected readonly installationToLabel = (value: string | null | undefined) => {
    if (!value) {
      return '';
    }

    return this.installations().find((installation) => installation.id === value)?.name ?? value;
  };

  protected areAllZonesSelected(): boolean {
    const zones = this.filteredZones();

    return zones.length > 0 && zones.every((zone) => this.model().allowed_zones.includes(zone.id));
  }

  protected areAllShiftsSelected(): boolean {
    const shifts = this.filteredShifts();

    return shifts.length > 0 && shifts.every((shift) => this.model().allowed_shifts.includes(shift.id));
  }

  protected updatePosition(positionId: string): void {
    this.model.update((value) => ({
      ...value,
      position: positionId,
    }));
  }

  protected updateInstallation(installationId: string): void {
    this.model.update((value) => ({
      ...value,
      installation: installationId || undefined,
      position: this.isSameInstallation(value.position, installationId) ? value.position : '',
      allowed_zones: value.allowed_zones.filter((zoneId) => this.isSameInstallation(zoneId, installationId)),
      allowed_shifts: value.allowed_shifts.filter((shiftId) => this.isSameInstallation(shiftId, installationId)),
    }));
  }

  protected updateActive(active: boolean): void {
    this.model.update((value) => ({
      ...value,
      active,
    }));
  }

  protected toggleZone(zoneId: string, checked: boolean): void {
    this.model.update((value) => ({
      ...value,
      allowed_zones: checked
        ? [...value.allowed_zones, zoneId]
        : value.allowed_zones.filter((item) => item !== zoneId),
    }));
  }

  protected toggleAllZones(checked: boolean): void {
    this.model.update((value) => ({
      ...value,
      allowed_zones: checked ? this.filteredZones().map((zone) => zone.id) : [],
    }));
  }

  protected toggleShift(shiftId: string, checked: boolean): void {
    this.model.update((value) => ({
      ...value,
      allowed_shifts: checked
        ? [...value.allowed_shifts, shiftId]
        : value.allowed_shifts.filter((item) => item !== shiftId),
    }));
  }

  protected toggleAllShifts(checked: boolean): void {
    this.model.update((value) => ({
      ...value,
      allowed_shifts: checked ? this.filteredShifts().map((shift) => shift.id) : [],
    }));
  }

  private filterByInstallation<T extends { installation?: string | null }>(items: T[]): T[] {
    const installationId = this.model().installation;

    if (!installationId) {
      return items;
    }

    return items.filter((item) => item.installation === installationId);
  }

  private isSameInstallation(resourceId: string | null | undefined, installationId = this.model().installation): boolean {
    if (!installationId || !resourceId) {
      return true;
    }

    const resource = [...this.positions(), ...this.zones(), ...this.shifts()].find((item) => item.id === resourceId);

    return resource?.installation === installationId;
  }
}
