import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { validateAuthToken } from "../../../src/scrape/services/auth-validation.js";

describe("validateAuthToken", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("calls universal scrape against ip.decodo.com", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ results: [] }),
    } as Response);

    await validateAuthToken("test-token");

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://scraper-api.decodo.com/v2/scrape");
    expect(JSON.parse(init.body as string)).toEqual({
      target: "universal",
      url: "https://does-not-exist.decodo.com",
    });
    expect(init.headers).toMatchObject({
      Authorization: "Basic test-token",
      "x-integration": "sdk-ts", // TODO: switch to cli when sdk task lands
    });
  });
});
