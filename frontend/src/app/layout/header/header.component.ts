import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideSearch } from '@ng-icons/lucide';
import { HlmBreadcrumbImports } from '@spartan-ng/helm/breadcrumb';
import { HlmInputGroupImports } from '@spartan-ng/helm/input-group';
import { HlmSeparatorImports } from '@spartan-ng/helm/separator';
import { HlmSidebarImports } from '@spartan-ng/helm/sidebar';
import { ActivatedRouteSnapshot, NavigationEnd, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';

interface BreadcrumbItem {
  label: string;
  url: string;
}

@Component({
	selector: 'app-header',
	imports: [RouterLink, HlmSidebarImports, HlmSeparatorImports, HlmBreadcrumbImports, HlmInputGroupImports, NgIcon],
	providers: [provideIcons({ lucideSearch })],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './header.component.html',
})
export class HeaderComponent {
	private readonly router = inject(Router);

	private readonly currentUrl = toSignal(
		this.router.events.pipe(
			filter((event) => event instanceof NavigationEnd),
			map(() => this.router.url),
			startWith(this.router.url),
		),
		{ initialValue: this.router.url },
	);

	protected readonly breadcrumbs = computed(() => this.buildBreadcrumbs(this.currentUrl()));

	private buildBreadcrumbs(_url: string): BreadcrumbItem[] {
		return this.collectBreadcrumbs(this.router.routerState.snapshot.root);
	}

	private collectBreadcrumbs(route: ActivatedRouteSnapshot, parentUrl = ''): BreadcrumbItem[] {
		const routePath = route.routeConfig?.path ?? '';
		const ownSegments = route.url.map((segment) => segment.path).filter(Boolean);
		const fallbackSegments = routePath.split('/').filter((segment) => segment && !segment.startsWith(':'));
		const pathSegments = ownSegments.length > 0 ? ownSegments : fallbackSegments;
		const ownUrl = pathSegments.length > 0 ? `${parentUrl}/${pathSegments.join('/')}` : parentUrl;
		const ownBreadcrumb = route.data['breadcrumb'] as string | undefined;
		const breadcrumbs = ownBreadcrumb
			? [
					{
						label: ownBreadcrumb,
						url: ownUrl || this.normalizeRoutePath(routePath),
					},
				]
			: [];

		const primaryChild = route.children.find((child) => child.outlet === 'primary');

		if (!primaryChild) {
			return breadcrumbs;
		}

		return [...breadcrumbs, ...this.collectBreadcrumbs(primaryChild, ownUrl)];
	}

	private normalizeRoutePath(routePath: string): string {
		if (!routePath) {
			return '/';
		}

		return routePath.startsWith('/') ? routePath : `/${routePath}`;
	}
}
