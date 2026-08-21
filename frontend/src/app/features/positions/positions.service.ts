import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CompanyService } from '../../core/company/company.service';
import { Position, PositionUpsertPayload } from './positions.model';

@Injectable({
  providedIn: 'root',
})
export class PositionsService {
  private readonly http = inject(HttpClient);
  private readonly companyService = inject(CompanyService);

  list(): Observable<Position[]> {
    return this.http.get<Position[]>(this.companyService.buildCompanyApiUrl('positions'));
  }

  get(positionId: string): Observable<Position> {
    return this.http.get<Position>(
      this.companyService.buildCompanyResourceUrl('positions', positionId),
    );
  }

  create(payload: PositionUpsertPayload): Observable<Position> {
    return this.http.post<Position>(this.companyService.buildCompanyApiUrl('positions'), payload);
  }

  update(positionId: string, payload: PositionUpsertPayload): Observable<Position> {
    return this.http.put<Position>(
      this.companyService.buildCompanyResourceUrl('positions', positionId),
      payload,
    );
  }

  delete(positionId: string): Observable<void> {
    return this.http.delete<void>(
      this.companyService.buildCompanyResourceUrl('positions', positionId),
    );
  }
}
