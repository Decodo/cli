import { DecodoClient, type DecodoSchema } from "@decodo/sdk-ts";

export function createDecodoClient(
  token: string,
  schema?: DecodoSchema
): DecodoClient {
  return new DecodoClient({
    webScrapingApi: { token },
    schema,
  });
}
