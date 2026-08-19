import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HeaderComponent } from './header/header.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { AuthService } from '../core/auth/auth.service';
import { HlmSidebarImports } from '@spartan-ng/helm/sidebar';

@Component({
  selector: 'app-main-layout',
  imports: [HlmSidebarImports, HeaderComponent, SidebarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './main-layout.component.html',
  host: {
		class: 'block [--header-height:--spacing(14)]',
	},
})
export class MainLayoutComponent {
  private readonly authService = inject(AuthService);
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

  protected logout(): void {
    this.authService.logout();
    void this.router.navigate(['/login']);
  }
}
