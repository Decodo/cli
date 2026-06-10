import { Target as ScrapeTarget } from "@decodo/sdk-ts";
import { createDecodoClient } from "./client.js";

export async function validateAuthToken(token: string): Promise<void> {
  const client = createDecodoClient(token);

  await client.webScrapingApi.scrape({
    target: ScrapeTarget.Universal,
    url: "https://does-not-exist.decodo.com",
  });
}
