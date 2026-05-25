export type BasicAuth = {
  type: 'basic';
  token: string;
};

export type ApiKeyAuth = {
  type: 'apiKey';
  apiKey: string;
};

export type HttpClientConfig = {
  baseUrl: string;
  auth: BasicAuth | ApiKeyAuth;
  timeoutMs: number;
  integrationHeader: string;
};
