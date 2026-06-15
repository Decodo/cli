import {
  AuthenticationError,
  DecodoError,
  RateLimitError,
  Target as ScrapeTarget,
} from "@decodo/sdk-ts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDecodoClient } from "../../../src/scrape/services/client.js";
import { validateAuthToken } from "../../../src/scrape/services/auth-validation.js";

vi.mock("../../../src/scrape/services/client.js", () => ({
  createDecodoClient: vi.fn(),
}));

describe("validateAuthToken", () => {
  const scrape = vi.fn();

  beforeEach(() => {
    scrape.mockReset();
    vi.mocked(createDecodoClient).mockReturnValue({
      webScrapingApi: { scrape },
    } as never);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("probes auth with the stats-invisible URL", async () => {
    scrape.mockResolvedValue({ results: [] });

    await validateAuthToken("test-token");

    expect(createDecodoClient).toHaveBeenCalledWith("test-token");
    expect(scrape).toHaveBeenCalledWith({
      target: ScrapeTarget.Universal,
      url: "https://does-not-exist.decodo.com",
    });
  });

  it("rejects invalid tokens", async () => {
    scrape.mockRejectedValue(new AuthenticationError("Username invalid."));

    await expect(validateAuthToken("bad-token")).rejects.toThrow(
      AuthenticationError
    );
  });

  it("accepts valid tokens when the probe scrape fails with DecodoError", async () => {
    scrape.mockRejectedValue(new DecodoError("Request processing failed"));

    await expect(validateAuthToken("test-token")).resolves.toBeUndefined();
  });

  it("rethrows rate limit errors", async () => {
    scrape.mockRejectedValue(new RateLimitError("Rate limit exceeded"));

    await expect(validateAuthToken("test-token")).rejects.toThrow(RateLimitError);
  });
});
