import { Injectable } from '@angular/core';

import { AppRuntimeConfig, defaultAppRuntimeConfig } from './app-runtime-config';


function normalizeConfig(config: AppRuntimeConfig): AppRuntimeConfig {
  const origin = window.location.origin;
  const normalizeUrl = (value: string, fallback: string) => {
    if (!value) {
      return fallback;
    }

    if (value === '/') {
      return origin;
    }

    return value;
  };

  return {
    ...config,
    auth: {
      ...config.auth,
      redirectUri: normalizeUrl(config.auth.redirectUri, origin),
      postLogoutRedirectUri: normalizeUrl(config.auth.postLogoutRedirectUri, origin),
    },
  };
}

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
      this.config = normalizeConfig({
        ...defaultAppRuntimeConfig,
        ...config,
        auth: {
          ...defaultAppRuntimeConfig.auth,
          ...config.auth,
        },
      });
    } catch {
      this.config = normalizeConfig(defaultAppRuntimeConfig);
    }
  }

  getConfig(): AppRuntimeConfig {
    return this.config;
  }
}
