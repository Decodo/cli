export const DEFAULT_POLL_INTERVAL_SECONDS = 5;

export const DEFAULT_CRAWL_TIMEOUT_SECONDS = 3600;

export const CRAWL_CONTENT_FORMATS = ["markdown", "html"] as const;

export const WAIT_ONLY_FLAGS = {
  progress: "--progress",
  pollInterval: "--poll-interval",
  timeout: "--timeout",
} as const;

export const CRAWL_START_WAIT_ONLY_FLAGS = {
  ...WAIT_ONLY_FLAGS,
  output: "--output",
} as const;
