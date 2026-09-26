import { ChangeDetectionStrategy, Component, computed, inject, resource, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, forkJoin, of } from 'rxjs';
import { PositionsService } from '../positions/positions.service';
import { ShiftsService } from '../shifts/shifts.service';
import { ZonesService } from '../zones/zones.service';
import { EmployeesFormComponent } from './employees-form.component';
import { EmployeeUpsertPayload } from './employees.model';
import { EmployeesService } from './employees.service';
import { CompanyService } from '../../core/company/company.service';
import { collectInstallationOptions } from '../../core/company/installation-utils';
import { InstallationOption } from '../../core/company/installation.model';
import { InstallationsService } from '../../core/company/installations.service';
import { randomFormColor } from '../../shared/color-utils';

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
  private readonly companyService = inject(CompanyService);
  private readonly installationsService = inject(InstallationsService);
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
          employees: this.employeesService.list(),
          installations: this.installationsService.listForActiveCompany(),
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
        installation: this.companyService.getActiveInstallationId() ?? undefined,
        employee_code: '',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        hire_date: '',
        termination_date: '',
        color: randomFormColor(),
        notes: '',
        active: true,
        position: '',
        allowed_zones: [],
        allowed_shifts: [],
      };
    }

    return {
      installation: employee.installation ?? undefined,
      employee_code: employee.employee_code ?? '',
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email ?? '',
      phone: employee.phone ?? '',
      hire_date: employee.hire_date ?? '',
      termination_date: employee.termination_date ?? '',
      color: employee.color ?? randomFormColor(),
      notes: employee.notes ?? '',
      active: employee.active,
      position: employee.position ?? '',
      allowed_zones: [...employee.allowed_zones],
      allowed_shifts: [...employee.allowed_shifts],
    };
  });

  protected readonly positions = computed(() => this.employeeFormResource.value()?.positions ?? []);
  protected readonly zones = computed(() => this.employeeFormResource.value()?.zones ?? []);
  protected readonly shifts = computed(() => this.employeeFormResource.value()?.shifts ?? []);
  protected readonly installations = computed<InstallationOption[]>(() =>
    collectInstallationOptions([
      ...(this.employeeFormResource.value()?.employees ?? []),
      ...this.positions(),
      ...this.zones(),
      ...this.shifts(),
      ...(this.employeeFormResource.value()?.employee ? [this.employeeFormResource.value()!.employee!] : []),
    ], this.employeeFormResource.value()?.installations ?? []),
  );

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

}
