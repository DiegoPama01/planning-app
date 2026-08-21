import { ChangeDetectionStrategy, Component, effect, input, signal } from '@angular/core';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { ZoneUpsertPayload } from './zones.model';

@Component({
  selector: 'app-zones-form',
  imports: [FormRoot, FormField, HlmButtonImports, HlmCardImports, HlmFieldImports, HlmInputImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './zones-form.component.html',
})
export class ZonesFormComponent {
  readonly initialValue = input.required<ZoneUpsertPayload>();
  readonly submitLabel = input('Save zone');
  readonly formError = input<string | null>(null);
  readonly submitForm = input.required<(value: ZoneUpsertPayload) => Promise<void>>();
  readonly cancel = input.required<() => void>();

  protected readonly model = signal<ZoneUpsertPayload>({
    name: '',
    color: '#0f172a',
  });

  constructor() {
    effect(() => {
      this.model.set(this.initialValue());
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
}
