export const INTEGRATION_HEADER = "cli";

export const SCHEMA_TTL_MS = 3_600_000;

export const TASK_FLOW = "task";

export const DEFAULT_TASK_TIMEOUT_SECONDS = 600;

export const TASK_WAIT_ONLY_FLAGS = {
  pollInterval: "--poll-interval",
  timeout: "--timeout",
} as const;

export const PRIMARY_INPUT_FIELDS = [
  "query",
  "url",
  "product_id",
  "prompt",
] as const;

export type PrimaryInputField = (typeof PRIMARY_INPUT_FIELDS)[number];
