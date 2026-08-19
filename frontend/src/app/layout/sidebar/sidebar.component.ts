import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCommand } from '@ng-icons/lucide';
import { HlmSidebarImports } from '@spartan-ng/helm/sidebar';
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
  imports: [HlmSidebarImports, NgIcon, NavMain, NavUser],
  providers: [provideIcons({ lucideCommand })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  public readonly companyName = input('Acme Inc');
  public readonly companyPlan = input('Enterprise');
  public readonly user = input<SidebarUser>(data.user);
  public readonly logoutRequested = output<void>();
  protected readonly data = data;

  protected requestLogout(): void {
    this.logoutRequested.emit();
  }
}
