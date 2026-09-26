import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmSwitchImports } from '@spartan-ng/helm/switch';
import { InstallationOption } from '../../core/company/installation.model';
import { randomFormColor } from '../../shared/color-utils';
import { ShiftUpsertPayload } from './shifts.model';

@Component({
  selector: 'app-shifts-form',
  imports: [
    FormRoot,
    FormField,
    HlmButtonImports,
    HlmCardImports,
    HlmFieldImports,
    HlmInputImports,
    HlmSelectImports,
    HlmSwitchImports,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shifts-form.component.html',
})
export class ShiftsFormComponent {
  private readonly router = inject(Router);
  readonly initialValue = input.required<ShiftUpsertPayload>();
  readonly submitLabel = input('Save shift');
  readonly formError = input<string | null>(null);
  readonly installations = input<InstallationOption[]>([]);
  readonly submitForm = input.required<(value: ShiftUpsertPayload) => Promise<void>>();
  readonly cancelLink = input.required<string>();

  protected async cancel(): Promise<void> {
    await this.router.navigateByUrl(this.cancelLink());
  }

  protected readonly model = signal<ShiftUpsertPayload>({
    name: '',
    code: '',
    start_time: '',
    end_time: '',
    break_minutes: 0,
    color: randomFormColor(),
    sort_order: 0,
    active: true,
  });

  constructor() {
    effect(() => {
      this.model.set(this.initialValue());
    });
  }

  protected readonly shiftForm = form(
    this.model,
    (schema) => {
      required(schema.name, { message: 'Name is required.' });
      required(schema.start_time, { message: 'Start time is required.' });
      required(schema.end_time, { message: 'End time is required.' });
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

  protected readonly installationToLabel = (value: string | null | undefined) => {
    if (!value) {
      return '';
    }

    return this.installations().find((installation) => installation.id === value)?.name ?? value;
  };

  protected updateInstallation(installationId: string): void {
    this.model.update((value) => ({ ...value, installation: installationId || undefined }));
  }

  protected updateActive(active: boolean): void {
    this.model.update((value) => ({ ...value, active }));
  }
}
