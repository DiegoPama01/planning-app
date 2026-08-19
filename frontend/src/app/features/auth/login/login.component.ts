import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { LoginForm } from './login-form.component';

@Component({
	selector: 'app-login-simple',
	imports: [LoginForm],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
	styleUrl: './login.component.scss',
	host: {
		class: 'block',
	},
	templateUrl: './login.component.html',
})
export default class LoginPage {}
