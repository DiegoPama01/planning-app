import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  resource,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { ShiftsService } from './shifts.service';

@Component({
  selector: 'app-shifts',
  imports: [HlmButtonImports, HlmCardImports, HlmTableImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shifts.component.html',
})
export class ShiftsComponent {
  private readonly shiftsService = inject(ShiftsService);

  protected readonly shiftsResource = resource({
    loader: async () => firstValueFrom(this.shiftsService.list()),
  });

  protected readonly shifts = computed(() => this.shiftsResource.value() ?? []);
  protected readonly shiftsError = computed(() => {
    const error = this.shiftsResource.error();

    if (!error) {
      return null;
    }

    return error instanceof Error
      ? error.message
      : 'We could not load shifts right now. Please try again.';
  });

  protected reload(): void {
    void this.shiftsResource.reload();
  }
}
