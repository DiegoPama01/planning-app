import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSwitchImports } from '@spartan-ng/helm/switch';
import { HlmTextareaImports } from '@spartan-ng/helm/textarea';
import { Position, PositionUpsertPayload } from '../positions/positions.model';
import { ZoneShiftPositionRequirement, ZoneUpsertPayload } from './zones.model';
import { Shift, ShiftUpsertPayload } from '../shifts/shifts.model';
import { SelectionTableComponent } from '../../shared/selection-table/selection-table.component';
import { SelectionTableItem } from '../../shared/selection-table/selection-table.model';
import { randomFormColor } from '../../shared/color-utils';

@Component({
  selector: 'app-zones-form',
  imports: [FormRoot, FormField, HlmButtonImports, HlmCardImports, HlmDialogImports, HlmFieldImports, HlmInputImports, HlmSwitchImports, HlmTextareaImports, SelectionTableComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './zones-form.component.html',
})
export class ZonesFormComponent {
  private readonly router = inject(Router);
  readonly initialValue = input.required<ZoneUpsertPayload>();
  readonly submitLabel = input('Save zone');
  readonly formError = input<string | null>(null);
  readonly submitForm = input.required<(value: ZoneUpsertPayload) => Promise<void>>();
  readonly cancelLink = input.required<string>();

  protected async cancel(): Promise<void> {
    await this.router.navigateByUrl(this.cancelLink());
  }
  readonly shifts = input<Shift[]>([]);
  readonly positions = input<Position[]>([]);
  readonly createShift = input.required<(value: ShiftUpsertPayload) => Promise<Shift>>();
  readonly createPosition = input.required<(value: PositionUpsertPayload) => Promise<Position>>();

  protected readonly model = signal<ZoneUpsertPayload>({
    name: '',
    code: '',
    description: '',
    color: randomFormColor(),
    sort_order: 0,
    active: true,
    shift_presets: [],
  });
  protected readonly localShifts = signal<Shift[]>([]);
  protected readonly localPositions = signal<Position[]>([]);
  protected readonly activeShiftId = signal<string | null>(null);
  protected readonly newShift = signal<ShiftUpsertPayload>({ name: '', code: '', start_time: '', end_time: '', break_minutes: 0, color: randomFormColor(), sort_order: 0, active: true });
  protected readonly newPosition = signal<PositionUpsertPayload>({ name: '', code: '', description: '', color: randomFormColor(), sort_order: 0, active: true });
  protected readonly createError = signal<string | null>(null);
  protected readonly shiftOptions = computed<SelectionTableItem[]>(() => this.localShifts().map((shift) => ({
    id: shift.id,
    label: shift.name,
    detail: `${shift.start_time.slice(0, 5)}-${shift.end_time.slice(0, 5)}`,
  })));
  protected readonly selectedShiftIds = computed(() => this.model().shift_presets.map((preset) => preset.shift));
  protected readonly positionOptions = computed<SelectionTableItem[]>(() => this.localPositions().map((position) => ({
    id: position.id,
    label: position.name,
  })));
  protected readonly selectedPositionIds = computed(() => this.activeRequirements().map((item) => item.position));
  protected readonly positionQuantities = computed<Record<string, number>>(() =>
    Object.fromEntries(this.activeRequirements().map((item) => [item.position, item.required_count])),
  );

  protected toggleShift(shiftId: string, checked: boolean): void {
    this.model.update((value) => {
      const current = value.shift_presets.filter((preset) => preset.shift !== shiftId);
      return {
        ...value,
        shift_presets: checked ? [...current, { shift: shiftId, positions: [] }] : current,
      };
    });
    if (checked) this.activeShiftId.set(shiftId);
    if (!checked && this.activeShiftId() === shiftId) {
      this.activeShiftId.set(this.model().shift_presets[0]?.shift ?? null);
    }
  }

  protected isShiftSelected(shiftId: string): boolean {
    return this.model().shift_presets.some((preset) => preset.shift === shiftId);
  }

  protected selectShift(shiftId: string): void {
    this.activeShiftId.set(shiftId);
  }

  protected addExistingShift(item: SelectionTableItem): void {
    this.toggleShift(item.id, true);
  }

  protected removeSelectedShift(item: SelectionTableItem): void {
    this.toggleShift(item.id, false);
  }

  protected activeShift(): Shift | undefined {
    return this.localShifts().find((shift) => shift.id === this.activeShiftId());
  }

  protected activeRequirements(): ZoneShiftPositionRequirement[] {
    const shiftId = this.activeShiftId();
    return this.model().shift_presets.find((preset) => preset.shift === shiftId)?.positions ?? [];
  }

  protected isPositionSelected(positionId: string): boolean {
    return this.activeRequirements().some((item) => item.position === positionId);
  }

  protected positionName(positionId: string): string {
    return this.localPositions().find((position) => position.id === positionId)?.name ?? 'Position';
  }

  protected updateNewShiftName(event: Event): void { this.newShift.update((value) => ({ ...value, name: this.inputValue(event) })); }
  protected updateNewShiftStart(event: Event): void { this.newShift.update((value) => ({ ...value, start_time: this.inputValue(event) })); }
  protected updateNewShiftEnd(event: Event): void { this.newShift.update((value) => ({ ...value, end_time: this.inputValue(event) })); }
  protected updateNewShiftBreakMinutes(event: Event): void { this.newShift.update((value) => ({ ...value, break_minutes: Number(this.inputValue(event)) || 0 })); }
  protected updateNewShiftColor(event: Event): void { this.newShift.update((value) => ({ ...value, color: this.inputValue(event) })); }
  protected updateNewPositionName(event: Event): void { this.newPosition.update((value) => ({ ...value, name: this.inputValue(event) })); }
  protected updateNewPositionColor(event: Event): void { this.newPosition.update((value) => ({ ...value, color: this.inputValue(event) })); }

  private inputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected addPosition(positionId: string): void {
    const shiftId = this.activeShiftId();
    if (!shiftId || this.isPositionSelected(positionId)) return;
    this.model.update((value) => ({
      ...value,
      shift_presets: value.shift_presets.map((preset) => preset.shift === shiftId
        ? { ...preset, positions: [...preset.positions, { position: positionId, required_count: 1 }] }
        : preset),
    }));
  }

  protected removePosition(positionId: string): void {
    const shiftId = this.activeShiftId();
    this.model.update((value) => ({
      ...value,
      shift_presets: value.shift_presets.map((preset) => preset.shift === shiftId
        ? { ...preset, positions: preset.positions.filter((item) => item.position !== positionId) }
        : preset),
    }));
  }

  protected updatePositionCount(positionId: string, count: number): void {
    const shiftId = this.activeShiftId();
    this.model.update((value) => ({
      ...value,
      shift_presets: value.shift_presets.map((preset) => preset.shift === shiftId
        ? {
            ...preset,
            positions: preset.positions.map((item) => item.position === positionId
              ? { ...item, required_count: Math.max(1, count || 1) }
              : item),
          }
        : preset),
    }));
  }

  protected updatePositionQuantity(change: { item: SelectionTableItem; quantity: number }): void {
    this.updatePositionCount(change.item.id, change.quantity);
  }

  protected async saveNewShift(): Promise<void> {
    this.createError.set(null);
    try {
      const shift = await this.createShift()({ ...this.newShift(), installation: this.model().installation });
      this.localShifts.update((items) => [...items, shift]);
      this.toggleShift(shift.id, true);
      this.activeShiftId.set(shift.id);
      this.newShift.set({ name: '', code: '', start_time: '', end_time: '', break_minutes: 0, color: randomFormColor(), sort_order: 0, active: true });
    } catch {
      this.createError.set('We could not create this shift.');
    }
  }

  protected async saveNewPosition(): Promise<void> {
    this.createError.set(null);
    try {
      const position = await this.createPosition()({ ...this.newPosition(), installation: this.model().installation });
      this.localPositions.update((items) => [...items, position]);
      this.addPosition(position.id);
      this.newPosition.set({ name: '', code: '', description: '', color: randomFormColor(), sort_order: 0, active: true });
    } catch {
      this.createError.set('We could not create this position.');
    }
  }

  constructor() {
    effect(() => {
      this.model.set(this.initialValue());
      this.localShifts.set(this.shifts());
      this.localPositions.set(this.positions());
      this.activeShiftId.set(this.initialValue().shift_presets[0]?.shift ?? null);
    });
  }

  protected readonly zoneForm = form(
    this.model,
    (schema) => {
      required(schema.name, { message: 'Name is required.' });
      required(schema.color, { message: 'Color is required.' });
    },
    {
      submission: {
        action: async () => {
          await this.submitForm()({ ...this.model() });
        },
      },
    },
  );

  protected updateActive(active: boolean): void {
    this.model.update((value) => ({ ...value, active }));
  }
}
