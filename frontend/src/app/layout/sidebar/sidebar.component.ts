import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck, lucideChevronsUpDown, lucideCommand } from '@ng-icons/lucide';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { HlmSidebarImports } from '@spartan-ng/helm/sidebar';
import { CompanyMembership } from '../../core/auth/auth.model';
import { data } from '../../shared/sidebar/data';
import { NavMain } from '../../shared/sidebar/nav-main';
import { NavUser } from '../../shared/sidebar/nav-user';

export interface SidebarUser {
  name: string;
  email: string;
  avatar: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [HlmSidebarImports, HlmDropdownMenuImports, NgIcon, NavMain, NavUser],
  providers: [provideIcons({ lucideCheck, lucideChevronsUpDown, lucideCommand })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  public readonly companies = input<CompanyMembership[]>([]);
  public readonly activeCompanyId = input<string | null>(null);
  public readonly companyName = input('Acme Inc');
  public readonly companyPlan = input('Enterprise');
  public readonly user = input<SidebarUser>(data.user);
  public readonly companySelected = output<string>();
  public readonly logoutRequested = output<void>();
  protected readonly data = data;

  protected requestLogout(): void {
    this.logoutRequested.emit();
  }

  protected selectCompany(companyId: string): void {
    this.companySelected.emit(companyId);
  }
}
