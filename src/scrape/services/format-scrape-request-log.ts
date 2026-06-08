const SENSITIVE_QUERY_PARAM_KEYS = new Set([
  "auth",
  "authorization",
  "apikey",
  "api_key",
  "key",
  "password",
  "secret",
  "token",
]);

function sanitizeUrlForLog(value: string): string {
  try {
    const parsed = new URL(value);
    for (const key of parsed.searchParams.keys()) {
      if (SENSITIVE_QUERY_PARAM_KEYS.has(key.toLowerCase())) {
        parsed.searchParams.set(key, "<redacted>");
      }
    }
    return parsed.toString();
  } catch {
    return value;
  }
}

export function formatScrapeRequestLog(body: Record<string, unknown>): string {
  const target = typeof body.target === "string" ? body.target : "unknown";
  const url = typeof body.url === "string" ? sanitizeUrlForLog(body.url) : null;
  if (url !== null) {
    return `request target=${target} url=${url}`;
  }

  const query = typeof body.query === "string" ? body.query : null;
  if (query !== null) {
    return `request target=${target} query=${query}`;
  }

  return `request target=${target}`;
}
