import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay, tap } from 'rxjs';
import { CompanyService } from '../../core/company/company.service';
import { Zone, ZoneUpsertPayload } from './zones.model';

@Injectable({
  providedIn: 'root',
})
export class ZonesService {
  private readonly http = inject(HttpClient);
  private readonly companyService = inject(CompanyService);
  private readonly listCache = new Map<string, Observable<Zone[]>>();
  private readonly resourceCache = new Map<string, Observable<Zone>>();

  list(): Observable<Zone[]> {
    const url = this.companyService.buildCompanyApiUrl('zones');
    const cached = this.listCache.get(url);

    if (cached) {
      return cached;
    }

    const request = this.http
      .get<Zone[]>(url)
      .pipe(shareReplay({ bufferSize: 1, refCount: false }));
    this.listCache.set(url, request);

    return request;
  }

  get(zoneId: string): Observable<Zone> {
    const url = this.companyService.buildCompanyResourceUrl('zones', zoneId);
    const cached = this.resourceCache.get(url);

    if (cached) {
      return cached;
    }

    const request = this.http.get<Zone>(url).pipe(shareReplay({ bufferSize: 1, refCount: false }));
    this.resourceCache.set(url, request);

    return request;
  }

  create(payload: ZoneUpsertPayload): Observable<Zone> {
    const collectionUrl = this.companyService.buildCompanyApiUrl('zones');

    return this.http
      .post<Zone>(collectionUrl, payload)
      .pipe(tap(() => this.invalidateCollection(collectionUrl)));
  }

  update(zoneId: string, payload: ZoneUpsertPayload): Observable<Zone> {
    const collectionUrl = this.companyService.buildCompanyApiUrl('zones');
    const resourceUrl = this.companyService.buildCompanyResourceUrl('zones', zoneId);

    return this.http
      .put<Zone>(resourceUrl, payload)
      .pipe(tap(() => this.invalidateCollection(collectionUrl)));
  }

  delete(zoneId: string): Observable<void> {
    const collectionUrl = this.companyService.buildCompanyApiUrl('zones');
    const resourceUrl = this.companyService.buildCompanyResourceUrl('zones', zoneId);

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
