export type AppRuntimeConfig = {
  apiBaseUrl: string;
  auth: {
    enabled: boolean;
    issuerUrl: string;
    clientId: string;
    redirectUri: string;
    postLogoutRedirectUri: string;
    scopes: string;
    responseType: string;
  };
};

export const defaultAppRuntimeConfig: AppRuntimeConfig = {
  apiBaseUrl: 'http://127.0.0.1:8000/api',
  auth: {
    enabled: false,
    issuerUrl: '',
    clientId: '',
    redirectUri: 'http://localhost:4200',
    postLogoutRedirectUri: 'http://localhost:4200',
    scopes: 'openid profile email',
    responseType: 'code',
  },
};
