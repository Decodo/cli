import { DecodoClient } from "@decodo/sdk-ts";

export function createDecodoClient(token: string): DecodoClient {
  return new DecodoClient({
    webScrapingApi: { token },
  });
}
