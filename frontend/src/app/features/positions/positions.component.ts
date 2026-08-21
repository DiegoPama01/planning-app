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
import { PositionsService } from './positions.service';

@Component({
  selector: 'app-positions',
  imports: [HlmButtonImports, HlmCardImports, HlmTableImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './positions.component.html',
})
export class PositionsComponent {
  private readonly positionsService = inject(PositionsService);

  protected readonly positionsResource = resource({
    loader: async () => firstValueFrom(this.positionsService.list()),
  });

  protected readonly positions = computed(() => this.positionsResource.value() ?? []);
  protected readonly positionsError = computed(() => {
    const error = this.positionsResource.error();

    if (!error) {
      return null;
    }

    return error instanceof Error
      ? error.message
      : 'We could not load positions right now. Please try again.';
  });

  protected reload(): void {
    void this.positionsResource.reload();
  }
}
