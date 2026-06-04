import type { OutputFormat } from "./types.js";

function stringifyForText(payload: unknown): string {
  if (typeof payload === "string") {
    return payload;
  }

  return JSON.stringify(payload);
}

function stringifyJson(payload: unknown, indent: number | undefined): string {
  if (typeof payload === "string") {
    try {
      const parsed: unknown = JSON.parse(payload);
      return JSON.stringify(parsed, null, indent);
    } catch {
      return payload;
    }
  }

  return JSON.stringify(payload, null, indent);
}

export function renderOutput(
  payload: unknown,
  format: OutputFormat,
  indent: number | undefined,
  full: boolean
): string {
  if (full) {
    return JSON.stringify(payload, null, indent);
  }

  switch (format) {
    case "json":
      return stringifyJson(payload, indent);
    case "markdown":
    case "html":
    case "raw":
      return stringifyForText(payload);
    default:
      return stringifyForText(payload);
  }
}
