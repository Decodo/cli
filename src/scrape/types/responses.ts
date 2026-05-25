export interface ResultEntry {
  browser_actions_error?: Record<string, string>[];
  browser_actions_warnings?: Record<string, string>[];
  content: unknown;
  cookies?: Record<string, string>[];
  created_at: string;
  delivery_zip?: string;
  headers?: Record<string, string>;
  help?: string;
  status_code: number;
  task_id: string;
  updated_at: string;
  url?: string;
}

export interface SyncResponse {
  results: ResultEntry[];
}

export interface ErrorResponse {
  errors?: unknown[];
  message: string;
  status: string;
}
