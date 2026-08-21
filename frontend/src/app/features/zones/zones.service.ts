import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CompanyService } from '../../core/company/company.service';
import { Zone, ZoneUpsertPayload } from './zones.model';

@Injectable({
  providedIn: 'root',
})
export class ZonesService {
  private readonly http = inject(HttpClient);
  private readonly companyService = inject(CompanyService);

  list(): Observable<Zone[]> {
    return this.http.get<Zone[]>(this.companyService.buildCompanyApiUrl('zones'));
  }

  get(zoneId: string): Observable<Zone> {
    return this.http.get<Zone>(this.companyService.buildCompanyResourceUrl('zones', zoneId));
  }

  create(payload: ZoneUpsertPayload): Observable<Zone> {
    return this.http.post<Zone>(this.companyService.buildCompanyApiUrl('zones'), payload);
  }

  update(zoneId: string, payload: ZoneUpsertPayload): Observable<Zone> {
    return this.http.put<Zone>(this.companyService.buildCompanyResourceUrl('zones', zoneId), payload);
  }

  delete(zoneId: string): Observable<void> {
    return this.http.delete<void>(this.companyService.buildCompanyResourceUrl('zones', zoneId));
  }
}
