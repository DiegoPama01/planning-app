import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { email, form, FormField, FormRoot, minLength, required } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
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
		password: '',
	});
	protected readonly loginError = signal<string | null>(null);
	protected readonly loginSucceeded = signal(false);
	protected readonly isBusy = computed(() => this.form().submitting());

	public readonly form = form(
		this._model,
		(schemaPath) => {
			required(schemaPath.email, { message: 'Email is required.' });
			email(schemaPath.email, { message: 'Enter a valid email address.' });
			required(schemaPath.password, { message: 'Password is required.' });
			minLength(schemaPath.password, 8, { message: 'Password must be at least 8 characters long.' });
		},
		{
			submission: {
				action: async () => {
					const model = this._model();
					this.loginError.set(null);
					this.loginSucceeded.set(false);

					try {
						await firstValueFrom(
							this.authService.login({
								email: model.email,
								password: model.password,
							}),
						);

						await firstValueFrom(this.authService.loadCurrentUser());
						this.loginSucceeded.set(true);
					} catch {
						this.loginError.set('Invalid credentials. Please verify your email and password.');
					}
				},
			},
		},
	);
}
