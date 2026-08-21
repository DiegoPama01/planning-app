import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  resource,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { ZonesService } from './zones.service';

@Component({
  selector: 'app-zones',
  imports: [RouterLink, HlmButtonImports, HlmCardImports, HlmTableImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './zones.component.html',
})
export class ZonesComponent {
  private readonly zonesService = inject(ZonesService);

  protected readonly zonesResource = resource({
    loader: async () => firstValueFrom(this.zonesService.list()),
  });

  protected readonly zones = computed(() => this.zonesResource.value() ?? []);
  protected readonly zonesError = computed(() => {
    const error = this.zonesResource.error();

    if (!error) {
      return null;
    }

    return error instanceof Error
      ? error.message
      : 'We could not load zones right now. Please try again.';
  });

  protected reload(): void {
    void this.zonesResource.reload();
  }
}
