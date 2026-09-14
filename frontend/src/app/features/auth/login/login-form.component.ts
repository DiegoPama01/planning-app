import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { email, form, FormField, FormRoot, required } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputImports } from '@spartan-ng/helm/input';

import { AuthService } from '../../../core/auth/auth.service';

@Component({
	selector: 'app-login-form',
	imports: [FormRoot, FormField, RouterLink, HlmCardImports, HlmFieldImports, HlmInputImports, HlmButtonImports],
	changeDetection: ChangeDetectionStrategy.OnPush,
	styleUrl: './login-form.component.scss',
	templateUrl: './login-form.component.html',
})
export class LoginForm {
	private readonly authService = inject(AuthService);

	protected readonly _model = signal({
		email: '',
	});
	protected readonly loginError = signal<string | null>(null);
	protected readonly isBusy = computed(() => this.form().submitting());

	public readonly form = form(
		this._model,
		(schemaPath) => {
			required(schemaPath.email, { message: 'Email is required.' });
			email(schemaPath.email, { message: 'Enter a valid email address.' });
		},
		{
			submission: {
				action: async () => {
					const model = this._model();
					this.loginError.set(null);

					try {
						await this.authService.startOidcLogin(model.email);
					} catch {
						this.loginError.set('We could not start the Authentik login flow.');
					}
				},
			},
		},
	);
}
