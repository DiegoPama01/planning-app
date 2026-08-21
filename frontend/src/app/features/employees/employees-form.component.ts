import { ChangeDetectionStrategy, Component, effect, input, signal } from '@angular/core';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmCheckboxImports } from '@spartan-ng/helm/checkbox';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmSwitchImports } from '@spartan-ng/helm/switch';
import { HlmTableImports } from '@spartan-ng/helm/table';
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
  readonly initialValue = input.required<EmployeeUpsertPayload>();
  readonly positions = input<Position[]>([]);
  readonly zones = input<Zone[]>([]);
  readonly shifts = input<Shift[]>([]);
  readonly submitLabel = input('Save employee');
  readonly formError = input<string | null>(null);
  readonly submitForm = input.required<(value: EmployeeUpsertPayload) => Promise<void>>();
  readonly cancel = input.required<() => void>();

  protected readonly model = signal<EmployeeUpsertPayload>({
    first_name: '',
    last_name: '',
    active: true,
    position: '',
    allowed_zones: [],
    allowed_shifts: [],
  });

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

  protected areAllZonesSelected(): boolean {
    const zones = this.zones();

    return zones.length > 0 && zones.every((zone) => this.model().allowed_zones.includes(zone.id));
  }

  protected areAllShiftsSelected(): boolean {
    const shifts = this.shifts();

    return shifts.length > 0 && shifts.every((shift) => this.model().allowed_shifts.includes(shift.id));
  }

  protected updatePosition(positionId: string): void {
    this.model.update((value) => ({
      ...value,
      position: positionId,
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
      allowed_zones: checked ? this.zones().map((zone) => zone.id) : [],
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
      allowed_shifts: checked ? this.shifts().map((shift) => shift.id) : [],
    }));
  }
}
