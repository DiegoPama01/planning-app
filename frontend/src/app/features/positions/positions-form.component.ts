import { ChangeDetectionStrategy, Component, effect, input, signal } from '@angular/core';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { PositionUpsertPayload } from './positions.model';

@Component({
  selector: 'app-positions-form',
  imports: [FormRoot, FormField, HlmButtonImports, HlmCardImports, HlmFieldImports, HlmInputImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './positions-form.component.html',
})
export class PositionsFormComponent {
  readonly initialValue = input.required<PositionUpsertPayload>();
  readonly submitLabel = input('Save position');
  readonly formError = input<string | null>(null);
  readonly submitForm = input.required<(value: PositionUpsertPayload) => Promise<void>>();
  readonly cancel = input.required<() => void>();

  protected readonly model = signal<PositionUpsertPayload>({
    name: '',
    color: '#0f172a',
  });

  constructor() {
    effect(() => {
      this.model.set(this.initialValue());
    });
  }

  protected readonly positionForm = form(
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
}
