import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay, tap } from 'rxjs';
import { CompanyService } from '../../core/company/company.service';
import { Position, PositionUpsertPayload } from './positions.model';

@Injectable({
  providedIn: 'root',
})
export class PositionsService {
  private readonly http = inject(HttpClient);
  private readonly companyService = inject(CompanyService);
  private readonly listCache = new Map<string, Observable<Position[]>>();
  private readonly resourceCache = new Map<string, Observable<Position>>();

  list(): Observable<Position[]> {
    const url = this.companyService.buildCompanyApiUrl('positions');
    const cached = this.listCache.get(url);

    if (cached) {
      return cached;
    }

    const request = this.http
      .get<Position[]>(url)
      .pipe(shareReplay({ bufferSize: 1, refCount: false }));
    this.listCache.set(url, request);

    return request;
  }

  get(positionId: string): Observable<Position> {
    const url = this.companyService.buildCompanyResourceUrl('positions', positionId);
    const cached = this.resourceCache.get(url);

    if (cached) {
      return cached;
    }

    const request = this.http
      .get<Position>(url)
      .pipe(shareReplay({ bufferSize: 1, refCount: false }));
    this.resourceCache.set(url, request);

    return request;
  }

  create(payload: PositionUpsertPayload): Observable<Position> {
    const collectionUrl = this.companyService.buildCompanyApiUrl('positions');

    return this.http
      .post<Position>(collectionUrl, payload)
      .pipe(tap(() => this.invalidateCollection(collectionUrl)));
  }

  update(positionId: string, payload: PositionUpsertPayload): Observable<Position> {
    const collectionUrl = this.companyService.buildCompanyApiUrl('positions');
    const resourceUrl = this.companyService.buildCompanyResourceUrl('positions', positionId);

    return this.http
      .put<Position>(resourceUrl, payload)
      .pipe(tap(() => this.invalidateCollection(collectionUrl)));
  }

  delete(positionId: string): Observable<void> {
    const collectionUrl = this.companyService.buildCompanyApiUrl('positions');
    const resourceUrl = this.companyService.buildCompanyResourceUrl('positions', positionId);

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
