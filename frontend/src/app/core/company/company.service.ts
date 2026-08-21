import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from '../api/api.config';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class CompanyService {
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly authService = inject(AuthService);

  getActiveCompanyId(): string | null {
    return this.authService.activeCompany()?.id ?? null;
  }

  getRequiredCompanyId(): string {
    const companyId = this.getActiveCompanyId();

    if (!companyId) {
      throw new Error('An active company is required to access company-scoped resources.');
    }

    return companyId;
  }

  buildCompanyApiUrl(resourcePath: string): string {
    const normalizedResourcePath = resourcePath.replace(/^\/+|\/+$/g, '');

    return `${this.apiBaseUrl}/companies/${this.getRequiredCompanyId()}/${normalizedResourcePath}/`;
  }

  buildCompanyResourceUrl(resourcePath: string, resourceId: string): string {
    return `${this.buildCompanyApiUrl(resourcePath)}${resourceId}/`;
  }
}
