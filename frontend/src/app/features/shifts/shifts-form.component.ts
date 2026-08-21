import { ChangeDetectionStrategy, Component, effect, input, signal } from '@angular/core';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideClock3 } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmInputGroupImports } from '@spartan-ng/helm/input-group';
import { ShiftUpsertPayload } from './shifts.model';

@Component({
  selector: 'app-shifts-form',
  imports: [
    FormRoot,
    FormField,
    NgIcon,
    HlmButtonImports,
    HlmCardImports,
    HlmFieldImports,
    HlmInputImports,
    HlmInputGroupImports,
  ],
  providers: [provideIcons({ lucideClock3 })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shifts-form.component.html',
})
export class ShiftsFormComponent {
  readonly initialValue = input.required<ShiftUpsertPayload>();
  readonly submitLabel = input('Save shift');
  readonly formError = input<string | null>(null);
  readonly submitForm = input.required<(value: ShiftUpsertPayload) => Promise<void>>();
  readonly cancel = input.required<() => void>();

  protected readonly model = signal<ShiftUpsertPayload>({
    name: '',
    start_time: '',
    end_time: '',
    color: '#0f172a',
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
}
