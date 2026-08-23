import { Injectable } from '@angular/core';

import { AppRuntimeConfig, defaultAppRuntimeConfig } from './app-runtime-config';

@Injectable({
  providedIn: 'root',
})
export class RuntimeConfigService {
  private config: AppRuntimeConfig = defaultAppRuntimeConfig;

  async load(): Promise<void> {
    try {
      const response = await fetch('/app-config.json', {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        return;
      }

      const config = (await response.json()) as Partial<AppRuntimeConfig>;
      this.config = {
        ...defaultAppRuntimeConfig,
        ...config,
        auth: {
          ...defaultAppRuntimeConfig.auth,
          ...config.auth,
        },
      };
    } catch {
      this.config = defaultAppRuntimeConfig;
    }
  }

  getConfig(): AppRuntimeConfig {
    return this.config;
  }
}
