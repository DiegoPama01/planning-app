import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { email, form, FormField, FormRoot, minLength, required, validate } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
	selector: 'app-signup-form',
	imports: [FormRoot, FormField, RouterLink, HlmCardImports, HlmFieldImports, HlmInputImports, HlmButtonImports],
	changeDetection: ChangeDetectionStrategy.OnPush,
	styleUrl: './signup-form.component.scss',
	templateUrl: './signup-form.component.html',
})
export class SignupForm {
	private readonly authService = inject(AuthService);
	private readonly router = inject(Router);

	protected readonly _model = signal({
		name: '',
		email: '',
		password: '',
		confirmPassword: '',
	});
	protected readonly signupError = signal<string | null>(null);
	protected readonly signupSucceeded = signal(false);
	protected readonly isBusy = computed(() => this.form().submitting());

	public readonly form = form(
		this._model,
		(schemaPath) => {
			required(schemaPath.name, { message: 'Name is required.' });
			required(schemaPath.email, { message: 'Email is required.' });
			email(schemaPath.email, { message: 'Enter a valid email address.' });
			required(schemaPath.password, { message: 'Password is required.' });
			minLength(schemaPath.password, 8, { message: 'Password must be at least 8 characters long.' });
			required(schemaPath.confirmPassword, { message: 'Confirming your password is required.' });

			validate(schemaPath.confirmPassword, ({ value, valueOf, stateOf }) => {
				if (value() === '') return null;
				if (!stateOf(schemaPath.password).touched()) return null;
				if (value() !== valueOf(schemaPath.password)) {
					return {
						kind: 'passwordMismatch',
						message: 'Passwords must match.',
					};
				}
				return null;
			});
		},
		{
			submission: {
				action: async () => {
					const model = this._model();
					this.signupError.set(null);
					this.signupSucceeded.set(false);

					try {
						const response = await firstValueFrom(
							this.authService.signup({
								name: model.name,
								email: model.email,
								password: model.password,
								confirm_password: model.confirmPassword,
							}),
						);
						this.signupSucceeded.set(true);

						if (response.login_succeeded && response.access && response.refresh) {
							await firstValueFrom(this.authService.loadCurrentUser());
							await this.router.navigate(['/']);
							return;
						}

						await this.router.navigate(['/login']);
					} catch {
						this.signupError.set('We could not create your account. Please review your details and try again.');
					}
				},
			},
		},
	);
}
