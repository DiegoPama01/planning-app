import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CompanyService } from '../../core/company/company.service';
import { Shift, ShiftUpsertPayload } from './shifts.model';

@Injectable({
  providedIn: 'root',
})
export class ShiftsService {
  private readonly http = inject(HttpClient);
  private readonly companyService = inject(CompanyService);

  list(): Observable<Shift[]> {
    return this.http.get<Shift[]>(this.companyService.buildCompanyApiUrl('shifts'));
  }

  get(shiftId: string): Observable<Shift> {
    return this.http.get<Shift>(this.companyService.buildCompanyResourceUrl('shifts', shiftId));
  }

  create(payload: ShiftUpsertPayload): Observable<Shift> {
    return this.http.post<Shift>(this.companyService.buildCompanyApiUrl('shifts'), payload);
  }

  update(shiftId: string, payload: ShiftUpsertPayload): Observable<Shift> {
    return this.http.put<Shift>(this.companyService.buildCompanyResourceUrl('shifts', shiftId), payload);
  }

  delete(shiftId: string): Observable<void> {
    return this.http.delete<void>(this.companyService.buildCompanyResourceUrl('shifts', shiftId));
  }
}
