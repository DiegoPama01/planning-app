import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideSearch } from '@ng-icons/lucide';
import { HlmInputGroupImports } from '@spartan-ng/helm/input-group';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmSeparatorImports } from '@spartan-ng/helm/separator';
import { HlmSidebarImports } from '@spartan-ng/helm/sidebar';
import { InstallationSummary } from '../../core/company/installation.model';

@Component({
	selector: 'app-header',
	imports: [HlmSidebarImports, HlmSeparatorImports, HlmInputGroupImports, HlmSelectImports, NgIcon],
	providers: [provideIcons({ lucideSearch })],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './header.component.html',
})
export class HeaderComponent {
  readonly installations = input<InstallationSummary[]>([]);
  readonly activeInstallationId = input<string | null>(null);
  readonly installationSelected = output<string | null>();

  protected readonly installationToLabel = (value: string | null | undefined) => {
    if (!value) {
      return 'All installations';
    }

    return this.installations().find((installation) => installation.id === value)?.name ?? value;
  };

  protected selectInstallation(installationId: string | null | undefined): void {
    this.installationSelected.emit(installationId || null);
  }
}
