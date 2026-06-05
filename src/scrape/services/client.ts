import { DecodoClient, type DecodoSchema } from "@decodo/sdk-ts";

export function createDecodoClient(
  token: string,
  schema?: DecodoSchema,
  timeoutMs?: number
): DecodoClient {
  return new DecodoClient({
    webScrapingApi: { token },
    timeoutMs,
    schema,
  });
}
