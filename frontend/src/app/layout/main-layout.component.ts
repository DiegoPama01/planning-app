import { ChangeDetectionStrategy, Component, computed, inject, resource } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { HeaderComponent } from './header/header.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { AuthService } from '../core/auth/auth.service';
import { HlmSidebarImports } from '@spartan-ng/helm/sidebar';
import { InstallationsService } from '../core/company/installations.service';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, HlmSidebarImports, HeaderComponent, SidebarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './main-layout.component.html',
  host: {
		class: 'block [--header-height:--spacing(14)]',
	},
})
export class MainLayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly installationsService = inject(InstallationsService);
  private readonly router = inject(Router);

  protected readonly sidebarUser = computed(() => {
    const user = this.authService.currentUser();

    if (!user) {
      return {
        name: 'User',
        email: '',
        avatar: '/assets/avatar.png',
      };
    }

    const fullName = `${user.first_name} ${user.last_name}`.trim();

    return {
      name: fullName || user.email,
      email: user.email,
      avatar: '/assets/avatar.png',
    };
  });

  protected readonly companyName = computed(() => this.authService.activeCompany()?.name ?? 'Workspace');
  protected readonly companyPlan = computed(() => this.authService.activeCompany()?.role ?? 'member');
  protected readonly companies = computed(() => this.authService.currentUser()?.companies ?? []);
  protected readonly activeCompanyId = computed(() => this.authService.activeCompany()?.id ?? null);
  protected readonly activeInstallationId = computed(() => this.authService.activeInstallationId());
  protected readonly installationsResource = resource({
    params: () => ({ companyId: this.activeCompanyId() }),
    loader: async ({ params }) => {
      if (!params.companyId) {
        return [];
      }

      return firstValueFrom(this.installationsService.listForActiveCompany());
    },
  });
  protected readonly installations = computed(() => this.installationsResource.value() ?? []);

  protected selectCompany(companyId: string): void {
    const company = this.companies().find((item) => item.id === companyId) ?? null;
    this.authService.setActiveCompany(company);
  }

  protected selectInstallation(installationId: string | null): void {
    this.authService.setActiveInstallationId(installationId);
  }

  protected logout(): void {
    this.authService.logout();
    void this.router.navigate(['/login']);
  }
}
