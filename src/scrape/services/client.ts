import { DecodoClient, type DecodoSchema } from "@decodo/sdk-ts";
import { INTEGRATION_HEADER } from "../constants.js";

export function createDecodoClient(
  token: string,
  schema?: DecodoSchema,
  timeoutMs?: number
): DecodoClient {
  return new DecodoClient({
    webScrapingApi: {
      token,
      integrationHeader: INTEGRATION_HEADER,
    },
    schema,
    timeoutMs,
  });
}
