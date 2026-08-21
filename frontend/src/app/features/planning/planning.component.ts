import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-planning',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './planning.component.html',
})
export class PlanningComponent {}
