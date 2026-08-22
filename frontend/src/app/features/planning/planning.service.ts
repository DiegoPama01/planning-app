import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CompanyService } from '../../core/company/company.service';
import { PlanningWeekResponse, PlanningWeekWritePayload } from './planning.model';

@Injectable({
  providedIn: 'root',
})
export class PlanningService {
  private readonly http = inject(HttpClient);
  private readonly companyService = inject(CompanyService);

  getWeek(weekStart: string): Observable<PlanningWeekResponse> {
    return this.http.get<PlanningWeekResponse>(
      this.companyService.buildCompanyApiUrl(`planning-weeks/${weekStart}`),
    );
  }

  saveWeek(weekStart: string, payload: PlanningWeekWritePayload): Observable<PlanningWeekResponse> {
    return this.http.put<PlanningWeekResponse>(
      this.companyService.buildCompanyApiUrl(`planning-weeks/${weekStart}`),
      payload,
    );
  }
}
