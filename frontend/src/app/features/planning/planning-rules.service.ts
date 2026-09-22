import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CompanyService } from '../../core/company/company.service';
import { StaffingRequirement, ZoneShiftPreset } from './planning.model';

@Injectable({ providedIn: 'root' })
export class PlanningRulesService {
  private readonly http = inject(HttpClient);
  private readonly company = inject(CompanyService);

  listPresets(): Observable<ZoneShiftPreset[]> { return this.http.get<ZoneShiftPreset[]>(this.company.buildCompanyApiUrl('zone-shift-presets')); }
  createPreset(payload: Omit<ZoneShiftPreset, 'id'>): Observable<ZoneShiftPreset> { return this.http.post<ZoneShiftPreset>(this.company.buildCompanyApiUrl('zone-shift-presets'), payload); }
  deletePreset(id: string): Observable<void> { return this.http.delete<void>(this.company.buildCompanyApiUrl(`zone-shift-presets/${id}`)); }
  listRequirements(): Observable<StaffingRequirement[]> { return this.http.get<StaffingRequirement[]>(this.company.buildCompanyApiUrl('staffing-requirements')); }
  createRequirement(payload: Omit<StaffingRequirement, 'id'>): Observable<StaffingRequirement> { return this.http.post<StaffingRequirement>(this.company.buildCompanyApiUrl('staffing-requirements'), payload); }
  deleteRequirement(id: string): Observable<void> { return this.http.delete<void>(this.company.buildCompanyApiUrl(`staffing-requirements/${id}`)); }
}
