export type ResultEntry = {
  content: unknown;
  status_code: number;
  url?: string;
  task_id: string;
  headers?: Record<string, string>;
  cookies?: Record<string, string>[];
  created_at: string;
  updated_at: string;
  help?: string;
  browser_actions_warnings?: Record<string, string>[];
  browser_actions_error?: Record<string, string>[];
  delivery_zip?: string;
};

export type SyncResponse = {
  results: ResultEntry[];
};

export type ErrorResponse = {
  status: string;
  message: string;
  errors?: unknown[];
};
