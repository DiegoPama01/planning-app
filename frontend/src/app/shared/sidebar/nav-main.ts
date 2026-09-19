import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideBookOpen, lucideBot, lucideChevronRight, lucideSettings2, lucideSquareTerminal } from '@ng-icons/lucide';
import { HlmCollapsibleImports } from '@spartan-ng/helm/collapsible';
import { HlmSidebarImports } from '@spartan-ng/helm/sidebar';

@Component({
	selector: 'spartan-nav-main',
	imports: [HlmSidebarImports, NgIcon, HlmCollapsibleImports, RouterLink, RouterLinkActive],
	providers: [provideIcons({ lucideSquareTerminal, lucideBot, lucideBookOpen, lucideSettings2, lucideChevronRight })],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<hlm-sidebar-group>
			<div hlmSidebarGroupLabel>Platform</div>
			<ul hlmSidebarMenu>
				@for (item of items(); track $index) {
					<hlm-collapsible
						[expanded]="groupActive.isActive || (item.isActive ?? false)"
						routerLinkActive
						#groupActive="routerLinkActive"
					>
						<li hlmSidebarMenuItem>
							@if (item.items; as subItems) {
								<button
									hlmCollapsibleTrigger
									hlmSidebarMenuButton
									type="button"
									class="group"
									[isActive]="groupActive.isActive"
								>
									<ng-icon [name]="item.icon" />
									{{ item.title }}
									<ng-icon name="lucideChevronRight" class="ml-auto transition-transform group-data-[state=open]:rotate-90" />
								</button>
								<hlm-collapsible-content>
									<ul hlmSidebarMenuSub>
										@for (subItem of subItems; track $index) {
											<li hlmSidebarMenuSubItem>
												<a
													hlmSidebarMenuSubButton
													[routerLink]="subItem.url"
													routerLinkActive
													[routerLinkActiveOptions]="{ exact: true }"
													#subItemActive="routerLinkActive"
													[isActive]="subItemActive.isActive"
													ariaCurrentWhenActive="page"
												>
													{{ subItem.title }}
												</a>
											</li>
										}
									</ul>
								</hlm-collapsible-content>
							} @else {
								<a
									hlmSidebarMenuButton
									[routerLink]="item.url"
									routerLinkActive
									[routerLinkActiveOptions]="{ exact: true }"
									#itemActive="routerLinkActive"
									[isActive]="itemActive.isActive"
									ariaCurrentWhenActive="page"
								>
									<ng-icon [name]="item.icon" />
									{{ item.title }}
								</a>
							}
						</li>
					</hlm-collapsible>
				}
			</ul>
		</hlm-sidebar-group>
	`,
})
export class NavMain {
	public readonly items = input.required<
		{
			title: string;
			url: string;
			icon: string;
			isActive?: boolean;
			items?: {
				title: string;
				url: string;
			}[];
		}[]
	>();
}
