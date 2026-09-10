import {
  AuthenticationError,
  DecodoError,
  RateLimitError,
  Target as ScrapeTarget,
  TimeoutError,
} from "@decodo/sdk-ts";
import type { AuthCredential } from "../../auth/types/credential.js";
import { createDecodoClient } from "./client.js";

const AUTH_PROBE_URL = "https://does-not-exist.decodo.com";

export async function validateCredential(
  credential: AuthCredential
): Promise<void> {
  const client = createDecodoClient(credential);

  try {
    await client.webScrapingApi.scrape({
      target: ScrapeTarget.Universal,
      url: AUTH_PROBE_URL,
    });
  } catch (err) {
    if (
      err instanceof AuthenticationError ||
      err instanceof RateLimitError ||
      err instanceof TimeoutError
    ) {
      throw err;
    }

    if (err instanceof DecodoError) {
      return;
    }

    throw err;
  }
}
