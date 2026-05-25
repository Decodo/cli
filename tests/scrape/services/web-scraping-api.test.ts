import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HttpClient } from "../../../src/platform/services/http.js";
import { WebScrapingApi } from "../../../src/scrape/services/web-scraping-api.js";

describe("WebScrapingApi", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts scrape requests to /v2/scrape", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ results: [{ content: "ok", status_code: 200 }] }),
    } as Response);

    const api = new WebScrapingApi(
      new HttpClient({
        baseUrl: "https://scraper-api.decodo.com",
        auth: { type: "basic", token: "token123" },
        timeoutMs: 5000,
        integrationHeader: "cli",
      })
    );

    const response = await api.scrape({
      target: "universal",
      url: "https://ip.decodo.com",
    });

    expect(response.results).toHaveLength(1);
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://scraper-api.decodo.com/v2/scrape"
    );
  });
});
