import { ChangeDetectionStrategy, Component, computed, inject, resource, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ZonesFormComponent } from './zones-form.component';
import { ZoneUpsertPayload } from './zones.model';
import { ZonesService } from './zones.service';

@Component({
  selector: 'app-zones-form-page',
  imports: [ZonesFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './zones-form-page.component.html',
})
export class ZonesFormPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly zonesService = inject(ZonesService);

  private readonly zoneId = this.route.snapshot.paramMap.get('id');
  protected readonly isEditMode = this.zoneId !== null;
  protected readonly formError = signal<string | null>(null);

  protected readonly zoneResource = resource({
    loader: async () => {
      if (!this.zoneId) {
        return null;
      }

      return firstValueFrom(this.zonesService.get(this.zoneId));
    },
  });

  protected readonly initialValue = computed<ZoneUpsertPayload>(() => {
    const zone = this.zoneResource.value();

    if (!zone) {
      return {
        name: '',
        color: '#0f172a',
      };
    }

    return {
      name: zone.name,
      color: zone.color,
    };
  });

  protected async saveZone(payload: ZoneUpsertPayload): Promise<void> {
    this.formError.set(null);

    try {
      if (this.zoneId) {
        await firstValueFrom(this.zonesService.update(this.zoneId, payload));
      } else {
        await firstValueFrom(this.zonesService.create(payload));
      }

      await this.router.navigate(['/settings/zones']);
    } catch {
      this.formError.set('We could not save this zone. Please review the form and try again.');
    }
  }

  protected async goBack(): Promise<void> {
    await this.router.navigate(['/settings/zones']);
  }
}
