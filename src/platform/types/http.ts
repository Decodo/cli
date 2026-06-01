interface BasicAuth {
  token: string;
  type: "basic";
}

interface ApiKeyAuth {
  apiKey: string;
  type: "apiKey";
}

export interface HttpClientConfig {
  auth: BasicAuth | ApiKeyAuth;
  baseUrl: string;
  integrationHeader: string;
  timeoutMs: number;
}

export interface ErrorResponse {
  errors?: unknown[];
  message?: string;
  status?: string;
}
