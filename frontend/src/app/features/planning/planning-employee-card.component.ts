import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CdkDrag } from '@angular/cdk/drag-drop';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { Employee } from '../employees/employees.model';

const AVATAR_COLORS = [
  { background: '#dbeafe', foreground: '#1e3a8a' },
  { background: '#dcfce7', foreground: '#166534' },
  { background: '#fef3c7', foreground: '#78350f' },
  { background: '#fce7f3', foreground: '#9d174d' },
  { background: '#ede9fe', foreground: '#5b21b6' },
  { background: '#cffafe', foreground: '#155e75' },
  { background: '#ffedd5', foreground: '#9a3412' },
  { background: '#f3e8ff', foreground: '#7e22ce' },
] as const;

@Component({ selector: 'app-planning-employee-card', imports: [CdkDrag, HlmButtonImports, HlmCardImports], changeDetection: ChangeDetectionStrategy.OnPush, template: `
  <hlm-card cdkDrag [cdkDragData]="employee()" size="sm" class="cursor-grab p-2 active:cursor-grabbing">
    <div class="flex items-center gap-2"><span class="flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold" [style.background-color]="avatarColor().background" [style.color]="avatarColor().foreground" aria-hidden="true">{{ initials() }}</span><div class="min-w-0 flex-1"><p class="truncate text-sm font-medium leading-tight">{{ employeeName() }}</p>@if (positionName()) { <p class="text-muted-foreground truncate text-xs">{{ positionName() }}</p> }</div>@if (removable()) { <button hlmBtn type="button" variant="ghost" size="icon-sm" (click)="$event.stopPropagation(); removed.emit(employee().id)" [attr.aria-label]="'Eliminar empleado ' + employeeName()">×</button> }</div>
  </hlm-card>
` })
export class PlanningEmployeeCardComponent {
  readonly employee = input.required<Employee>();
  readonly positionName = input.required<string>();
  readonly removable = input(false);
  readonly removed = output<string>();
  protected readonly employeeName = computed(() => `${this.employee().first_name} ${this.employee().last_name}`.trim());
  protected readonly initials = computed(() => `${this.employee().first_name[0] ?? ''}${this.employee().last_name[0] ?? ''}`.toUpperCase());
  protected readonly avatarColor = computed(() => {
    const hash = [...this.initials()].reduce((total, character) => total + (character.codePointAt(0) ?? 0), 0);
    return AVATAR_COLORS[hash % AVATAR_COLORS.length];
  });
}
