import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { CompanyService } from '../../core/company/company.service';
import { PlanningService } from './planning.service';
import { PlanningWeekResponse } from './planning.model';

describe('PlanningService', () => {
  let planningService: PlanningService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: CompanyService,
          useValue: { buildCompanyApiUrl: (path: string) => `/api/companies/company-1/${path}/` },
        },
      ],
    });

    planningService = TestBed.inject(PlanningService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('requests the selected planning week for the active company', async () => {
    const response: PlanningWeekResponse = { week_start: '2026-09-14', week_end: '2026-09-20', assignments: [] };
    const requestPromise = firstValueFrom(planningService.getWeek('2026-09-14'));
    const request = http.expectOne('/api/companies/company-1/planning-weeks/2026-09-14/');

    expect(request.request.method).toBe('GET');
    request.flush(response);

    await expect(requestPromise).resolves.toEqual(response);
  });

  it('saves assignments for the selected planning week', async () => {
    const payload = {
      assignments: [{ employee: 'employee-1', work_date: '2026-09-14', zone: 'zone-1', shift: 'shift-1', note: 'Cover' }],
    };
    const response: PlanningWeekResponse = { week_start: '2026-09-14', week_end: '2026-09-20', assignments: [] };
    const requestPromise = firstValueFrom(planningService.saveWeek('2026-09-14', payload));
    const request = http.expectOne('/api/companies/company-1/planning-weeks/2026-09-14/');

    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(payload);
    request.flush(response);

    await expect(requestPromise).resolves.toEqual(response);
  });
});
