import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CompanyService } from '../../core/company/company.service';
import { Employee, EmployeeUpsertPayload } from './employees.model';

@Injectable({
  providedIn: 'root',
})
export class EmployeesService {
  private readonly http = inject(HttpClient);
  private readonly companyService = inject(CompanyService);

  list(): Observable<Employee[]> {
    return this.http.get<Employee[]>(this.companyService.buildCompanyApiUrl('employees'));
  }

  get(employeeId: string): Observable<Employee> {
    return this.http.get<Employee>(
      this.companyService.buildCompanyResourceUrl('employees', employeeId),
    );
  }

  create(payload: EmployeeUpsertPayload): Observable<Employee> {
    return this.http.post<Employee>(this.companyService.buildCompanyApiUrl('employees'), payload);
  }

  update(employeeId: string, payload: EmployeeUpsertPayload): Observable<Employee> {
    return this.http.put<Employee>(
      this.companyService.buildCompanyResourceUrl('employees', employeeId),
      payload,
    );
  }

  delete(employeeId: string): Observable<void> {
    return this.http.delete<void>(
      this.companyService.buildCompanyResourceUrl('employees', employeeId),
    );
  }
}
