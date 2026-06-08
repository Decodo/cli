export function renderPayload(
  payload: unknown,
  indent: number | undefined
): string {
  if (typeof payload === "string") {
    if (indent !== undefined) {
      try {
        const parsed: unknown = JSON.parse(payload);
        return JSON.stringify(parsed, null, indent);
      } catch {
        return payload;
      }
    }
    return payload;
  }

  return JSON.stringify(payload, null, indent);
}
