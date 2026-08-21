import { ChangeDetectionStrategy, Component, computed, inject, resource, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, forkJoin, of } from 'rxjs';
import { PositionsService } from '../positions/positions.service';
import { ShiftsService } from '../shifts/shifts.service';
import { ZonesService } from '../zones/zones.service';
import { EmployeesFormComponent } from './employees-form.component';
import { EmployeeUpsertPayload } from './employees.model';
import { EmployeesService } from './employees.service';

@Component({
  selector: 'app-employees-form-page',
  imports: [EmployeesFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './employees-form-page.component.html',
})
export class EmployeesFormPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly employeesService = inject(EmployeesService);
  private readonly positionsService = inject(PositionsService);
  private readonly zonesService = inject(ZonesService);
  private readonly shiftsService = inject(ShiftsService);

  private readonly employeeId = this.route.snapshot.paramMap.get('id');
  protected readonly isEditMode = this.employeeId !== null;
  protected readonly formError = signal<string | null>(null);

  protected readonly employeeFormResource = resource({
    loader: async () =>
      firstValueFrom(
        forkJoin({
          employee: this.employeeId ? this.employeesService.get(this.employeeId) : of(null),
          positions: this.positionsService.list(),
          zones: this.zonesService.list(),
          shifts: this.shiftsService.list(),
        }),
      ),
  });

  protected readonly initialValue = computed<EmployeeUpsertPayload>(() => {
    const employee = this.employeeFormResource.value()?.employee;

    if (!employee) {
      return {
        first_name: '',
        last_name: '',
        active: true,
        position: '',
        allowed_zones: [],
        allowed_shifts: [],
      };
    }

    return {
      first_name: employee.first_name,
      last_name: employee.last_name,
      active: employee.active,
      position: employee.position,
      allowed_zones: [...employee.allowed_zones],
      allowed_shifts: [...employee.allowed_shifts],
    };
  });

  protected readonly positions = computed(() => this.employeeFormResource.value()?.positions ?? []);
  protected readonly zones = computed(() => this.employeeFormResource.value()?.zones ?? []);
  protected readonly shifts = computed(() => this.employeeFormResource.value()?.shifts ?? []);

  protected async saveEmployee(payload: EmployeeUpsertPayload): Promise<void> {
    this.formError.set(null);

    try {
      if (this.employeeId) {
        await firstValueFrom(this.employeesService.update(this.employeeId, payload));
      } else {
        await firstValueFrom(this.employeesService.create(payload));
      }

      await this.router.navigate(['/employees']);
    } catch {
      this.formError.set('We could not save this employee. Please review the form and try again.');
    }
  }

  protected async goBack(): Promise<void> {
    await this.router.navigate(['/employees']);
  }
}
