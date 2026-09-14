import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay, tap } from 'rxjs';
import { CompanyService } from '../../core/company/company.service';
import { Employee, EmployeeUpsertPayload } from './employees.model';

@Injectable({
  providedIn: 'root',
})
export class EmployeesService {
  private readonly http = inject(HttpClient);
  private readonly companyService = inject(CompanyService);
  private readonly listCache = new Map<string, Observable<Employee[]>>();
  private readonly resourceCache = new Map<string, Observable<Employee>>();

  list(): Observable<Employee[]> {
    const url = this.companyService.buildCompanyApiUrl('employees');
    const cached = this.listCache.get(url);

    if (cached) {
      return cached;
    }

    const request = this.http
      .get<Employee[]>(url)
      .pipe(shareReplay({ bufferSize: 1, refCount: false }));
    this.listCache.set(url, request);

    return request;
  }

  get(employeeId: string): Observable<Employee> {
    const url = this.companyService.buildCompanyResourceUrl('employees', employeeId);
    const cached = this.resourceCache.get(url);

    if (cached) {
      return cached;
    }

    const request = this.http
      .get<Employee>(url)
      .pipe(shareReplay({ bufferSize: 1, refCount: false }));
    this.resourceCache.set(url, request);

    return request;
  }

  create(payload: EmployeeUpsertPayload): Observable<Employee> {
    const collectionUrl = this.companyService.buildCompanyApiUrl('employees');

    return this.http
      .post<Employee>(collectionUrl, payload)
      .pipe(tap(() => this.invalidateCollection(collectionUrl)));
  }

  update(employeeId: string, payload: EmployeeUpsertPayload): Observable<Employee> {
    const collectionUrl = this.companyService.buildCompanyApiUrl('employees');
    const resourceUrl = this.companyService.buildCompanyResourceUrl('employees', employeeId);

    return this.http
      .put<Employee>(resourceUrl, payload)
      .pipe(tap(() => this.invalidateCollection(collectionUrl)));
  }

  delete(employeeId: string): Observable<void> {
    const collectionUrl = this.companyService.buildCompanyApiUrl('employees');
    const resourceUrl = this.companyService.buildCompanyResourceUrl('employees', employeeId);

    return this.http
      .delete<void>(resourceUrl)
      .pipe(tap(() => this.invalidateCollection(collectionUrl)));
  }

  private invalidateCollection(collectionUrl: string): void {
    this.listCache.delete(collectionUrl);

    for (const resourceUrl of this.resourceCache.keys()) {
      if (resourceUrl.startsWith(collectionUrl)) {
        this.resourceCache.delete(resourceUrl);
      }
    }
  }
}
