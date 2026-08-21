import { ChangeDetectionStrategy, Component, computed, inject, resource, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ShiftsFormComponent } from './shifts-form.component';
import { ShiftUpsertPayload } from './shifts.model';
import { ShiftsService } from './shifts.service';

@Component({
  selector: 'app-shifts-form-page',
  imports: [ShiftsFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shifts-form-page.component.html',
})
export class ShiftsFormPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly shiftsService = inject(ShiftsService);

  private readonly shiftId = this.route.snapshot.paramMap.get('id');
  protected readonly isEditMode = this.shiftId !== null;
  protected readonly formError = signal<string | null>(null);

  protected readonly shiftResource = resource({
    loader: async () => {
      if (!this.shiftId) {
        return null;
      }

      return firstValueFrom(this.shiftsService.get(this.shiftId));
    },
  });

  protected readonly initialValue = computed<ShiftUpsertPayload>(() => {
    const shift = this.shiftResource.value();

    if (!shift) {
      return {
        name: '',
        start_time: '',
        end_time: '',
        color: '#0f172a',
      };
    }

    return {
      name: shift.name,
      start_time: shift.start_time,
      end_time: shift.end_time,
      color: shift.color,
    };
  });

  protected async saveShift(payload: ShiftUpsertPayload): Promise<void> {
    this.formError.set(null);

    try {
      if (this.shiftId) {
        await firstValueFrom(this.shiftsService.update(this.shiftId, payload));
      } else {
        await firstValueFrom(this.shiftsService.create(payload));
      }

      await this.router.navigate(['/settings/shifts']);
    } catch {
      this.formError.set('We could not save this shift. Please review the form and try again.');
    }
  }

  protected async goBack(): Promise<void> {
    await this.router.navigate(['/settings/shifts']);
  }
}
