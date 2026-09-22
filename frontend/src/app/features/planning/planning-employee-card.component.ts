import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CdkDrag } from '@angular/cdk/drag-drop';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { Employee } from '../employees/employees.model';

@Component({ selector: 'app-planning-employee-card', imports: [CdkDrag, HlmCardImports], changeDetection: ChangeDetectionStrategy.OnPush, template: `
  <hlm-card cdkDrag [cdkDragData]="employee()" size="sm" class="cursor-grab p-2 active:cursor-grabbing">
    <div class="flex items-center gap-2"><span class="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">{{ initials() }}</span><span class="min-w-0 flex-1"><strong class="block truncate text-sm">{{ employee().first_name }} {{ employee().last_name }}</strong><span class="text-muted-foreground block truncate text-xs">{{ positionName() }}</span></span>@if (removable()) { <button type="button" class="text-muted-foreground shrink-0 px-1 text-lg leading-none hover:text-foreground" (click)="$event.stopPropagation(); removed.emit(employee().id)" [attr.aria-label]="'Remove ' + employee().first_name">×</button> }</div>
  </hlm-card>
` })
export class PlanningEmployeeCardComponent {
  readonly employee = input.required<Employee>();
  readonly positionName = input.required<string>();
  readonly removable = input(false);
  readonly removed = output<string>();
  protected initials(): string { return `${this.employee().first_name[0] ?? ''}${this.employee().last_name[0] ?? ''}`.toUpperCase(); }
}
