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
  apiBaseUrl: '/api',
  auth: {
    enabled: false,
    issuerUrl: '',
    clientId: '',
    redirectUri: '/',
    postLogoutRedirectUri: '/',
    scopes: 'openid profile email',
    responseType: 'code',
  },
};
