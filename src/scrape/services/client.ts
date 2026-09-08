import { DecodoClient, type DecodoSchema } from "@decodo/sdk-ts";
import type { AuthCredential } from "../../auth/types/credential.js";
import { INTEGRATION_HEADER } from "../constants.js";

export function createDecodoClient(
  credential: AuthCredential,
  schema?: DecodoSchema
): DecodoClient {
  const credentials =
    credential.kind === "apiKey"
      ? { apiKey: credential.value }
      : { token: credential.value };

  return new DecodoClient({
    webScrapingApi: { ...credentials, integrationHeader: INTEGRATION_HEADER },
    schema,
  });
}
