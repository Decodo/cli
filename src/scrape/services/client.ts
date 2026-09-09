import { DecodoClient, type DecodoSchema } from "@decodo/sdk-ts";
import { AUTH_TYPE } from "../../auth/constants.js";
import type { AuthCredential } from "../../auth/types/credential.js";
import { INTEGRATION_HEADER } from "../constants.js";

export function createDecodoClient(
  credential: AuthCredential,
  schema?: DecodoSchema
): DecodoClient {
  const credentials =
    credential.type === AUTH_TYPE.API_KEY
      ? { apiKey: credential.value }
      : { token: credential.value };

  return new DecodoClient({
    webScrapingApi: { ...credentials, integrationHeader: INTEGRATION_HEADER },
    schema,
  });
}
