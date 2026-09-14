import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay, tap } from 'rxjs';
import { CompanyService } from '../../core/company/company.service';
import { Shift, ShiftUpsertPayload } from './shifts.model';

@Injectable({
  providedIn: 'root',
})
export class ShiftsService {
  private readonly http = inject(HttpClient);
  private readonly companyService = inject(CompanyService);
  private readonly listCache = new Map<string, Observable<Shift[]>>();
  private readonly resourceCache = new Map<string, Observable<Shift>>();

  list(): Observable<Shift[]> {
    const url = this.companyService.buildCompanyApiUrl('shifts');
    const cached = this.listCache.get(url);

    if (cached) {
      return cached;
    }

    const request = this.http
      .get<Shift[]>(url)
      .pipe(shareReplay({ bufferSize: 1, refCount: false }));
    this.listCache.set(url, request);

    return request;
  }

  get(shiftId: string): Observable<Shift> {
    const url = this.companyService.buildCompanyResourceUrl('shifts', shiftId);
    const cached = this.resourceCache.get(url);

    if (cached) {
      return cached;
    }

    const request = this.http.get<Shift>(url).pipe(shareReplay({ bufferSize: 1, refCount: false }));
    this.resourceCache.set(url, request);

    return request;
  }

  create(payload: ShiftUpsertPayload): Observable<Shift> {
    const collectionUrl = this.companyService.buildCompanyApiUrl('shifts');

    return this.http
      .post<Shift>(collectionUrl, payload)
      .pipe(tap(() => this.invalidateCollection(collectionUrl)));
  }

  update(shiftId: string, payload: ShiftUpsertPayload): Observable<Shift> {
    const collectionUrl = this.companyService.buildCompanyApiUrl('shifts');
    const resourceUrl = this.companyService.buildCompanyResourceUrl('shifts', shiftId);

    return this.http
      .put<Shift>(resourceUrl, payload)
      .pipe(tap(() => this.invalidateCollection(collectionUrl)));
  }

  delete(shiftId: string): Observable<void> {
    const collectionUrl = this.companyService.buildCompanyApiUrl('shifts');
    const resourceUrl = this.companyService.buildCompanyResourceUrl('shifts', shiftId);

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
