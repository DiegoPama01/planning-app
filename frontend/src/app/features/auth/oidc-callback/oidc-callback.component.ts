import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../../core/auth/auth.service';

@Component({
	selector: 'app-oidc-callback-page',
	imports: [RouterLink],
	changeDetection: ChangeDetectionStrategy.OnPush,
	styleUrl: './oidc-callback.component.scss',
	templateUrl: './oidc-callback.component.html',
})
export default class OidcCallbackPage {
	private readonly route = inject(ActivatedRoute);
	private readonly router = inject(Router);
	private readonly authService = inject(AuthService);

	protected readonly errorMessage = signal<string | null>(null);

	constructor() {
		void this.completeLogin();
	}

	private async completeLogin(): Promise<void> {
		const params = this.route.snapshot.queryParamMap;
		const authError = params.get('error');
		const authErrorDescription = params.get('error_description');
		const code = params.get('code');
		const state = params.get('state');

		if (authError) {
			this.errorMessage.set(authErrorDescription ?? `Authentik rejected the login request (${authError}).`);
			return;
		}

		if (!code || !state) {
			this.errorMessage.set('Missing Authentik callback parameters.');
			return;
		}

		const pendingLogin = this.authService.consumePendingOidcLogin(state);
		if (!pendingLogin) {
			this.errorMessage.set('Your login session expired. Please try again.');
			return;
		}

		try {
			await firstValueFrom(
				this.authService.exchangeOidcCode({
					code,
					code_verifier: pendingLogin.codeVerifier,
					redirect_uri: pendingLogin.redirectUri,
				}),
			);
			await firstValueFrom(this.authService.loadCurrentUser());
			await this.router.navigateByUrl('/', { replaceUrl: true });
		} catch {
			this.authService.logout();
			this.errorMessage.set('We could not complete the Authentik login flow.');
		}
	}
}
