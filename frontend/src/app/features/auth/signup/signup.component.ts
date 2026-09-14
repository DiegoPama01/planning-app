import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { SignupForm } from './signup-form.component';

@Component({
	selector: 'app-signup-page',
	imports: [SignupForm],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
	styleUrl: './signup.component.scss',
	host: {
		class: 'block',
	},
	templateUrl: './signup.component.html',
})
export default class SignupPage {}
