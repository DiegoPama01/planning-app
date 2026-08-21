import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  resource,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom, forkJoin } from 'rxjs';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { PositionsService } from '../positions/positions.service';
import { ShiftsService } from '../shifts/shifts.service';
import { ZonesService } from '../zones/zones.service';
import { Employee } from './employees.model';
import { EmployeesService } from './employees.service';

interface EmployeeRow {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  active: boolean;
  positionName: string;
  zonesSummary: string;
  shiftsSummary: string;
}

@Component({
  selector: 'app-employees',
  imports: [RouterLink, HlmBadgeImports, HlmButtonImports, HlmCardImports, HlmTableImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './employees.component.html',
})
export class EmployeesComponent {
  private readonly employeesService = inject(EmployeesService);
  private readonly positionsService = inject(PositionsService);
  private readonly zonesService = inject(ZonesService);
  private readonly shiftsService = inject(ShiftsService);

  protected readonly employeesResource = resource({
    loader: async () =>
      firstValueFrom(
        forkJoin({
          employees: this.employeesService.list(),
          positions: this.positionsService.list(),
          zones: this.zonesService.list(),
          shifts: this.shiftsService.list(),
        }),
      ),
  });

  protected readonly employees = computed<EmployeeRow[]>(() => {
    const data = this.employeesResource.value();

    if (!data) {
      return [];
    }

    const positionsById = new Map(data.positions.map((position) => [position.id, position.name]));
    const zonesById = new Map(data.zones.map((zone) => [zone.id, zone.name]));
    const shiftsById = new Map(data.shifts.map((shift) => [shift.id, shift.name]));

    return data.employees.map((employee) =>
      this.mapEmployeeRow(employee, positionsById, zonesById, shiftsById),
    );
  });

  protected readonly employeesError = computed(() => {
    const error = this.employeesResource.error();

    if (!error) {
      return null;
    }

    return error instanceof Error
      ? error.message
      : 'We could not load employees right now. Please try again.';
  });

  protected reload(): void {
    void this.employeesResource.reload();
  }

  private mapEmployeeRow(
    employee: Employee,
    positionsById: Map<string, string>,
    zonesById: Map<string, string>,
    shiftsById: Map<string, string>,
  ): EmployeeRow {
    const firstName = employee.first_name.trim();
    const lastName = employee.last_name.trim();
    const fullName = `${firstName} ${lastName}`.trim();

    return {
      id: employee.id,
      firstName,
      lastName,
      fullName: fullName || 'Unnamed employee',
      active: employee.active,
      positionName: positionsById.get(employee.position) ?? 'Unknown position',
      zonesSummary: this.formatLookupNames(employee.allowed_zones, zonesById, 'No zones'),
      shiftsSummary: this.formatLookupNames(employee.allowed_shifts, shiftsById, 'No shifts'),
    };
  }

  private formatLookupNames(
    ids: string[],
    namesById: Map<string, string>,
    emptyLabel: string,
  ): string {
    const names = ids.map((id) => namesById.get(id) ?? 'Unknown').filter((name) => name.length > 0);

    if (names.length === 0) {
      return emptyLabel;
    }

    if (names.length <= 2) {
      return names.join(', ');
    }

    return `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
  }
}
