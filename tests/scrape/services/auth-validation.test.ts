import {
  AuthenticationError,
  DecodoError,
  RateLimitError,
  Target as ScrapeTarget,
} from "@decodo/sdk-ts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { validateCredential } from "../../../src/scrape/services/auth-validation.js";
import { createDecodoClient } from "../../../src/scrape/services/client.js";

vi.mock("../../../src/scrape/services/client.js", () => ({
  createDecodoClient: vi.fn(),
}));

const TOKEN_CREDENTIAL = { type: "token", value: "test-token" } as const;
const API_KEY_CREDENTIAL = { type: "apiKey", value: "test-api-key" } as const;

describe("validateCredential", () => {
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

    await validateCredential(TOKEN_CREDENTIAL);

    expect(createDecodoClient).toHaveBeenCalledWith(TOKEN_CREDENTIAL);
    expect(scrape).toHaveBeenCalledWith({
      target: ScrapeTarget.Universal,
      url: "https://does-not-exist.decodo.com",
    });
  });

  it("probes auth with an api key credential", async () => {
    scrape.mockResolvedValue({ results: [] });

    await validateCredential(API_KEY_CREDENTIAL);

    expect(createDecodoClient).toHaveBeenCalledWith(API_KEY_CREDENTIAL);
  });

  it("rejects invalid tokens", async () => {
    scrape.mockRejectedValue(new AuthenticationError("Username invalid."));

    await expect(
      validateCredential({ type: "token", value: "bad-token" })
    ).rejects.toThrow(AuthenticationError);
  });

  it("accepts valid tokens when the probe scrape fails with DecodoError", async () => {
    scrape.mockRejectedValue(new DecodoError("Request processing failed", 422));

    await expect(validateCredential(TOKEN_CREDENTIAL)).resolves.toBeUndefined();
  });

  it("rethrows rate limit errors", async () => {
    scrape.mockRejectedValue(new RateLimitError("Rate limit exceeded"));

    await expect(validateCredential(TOKEN_CREDENTIAL)).rejects.toThrow(
      RateLimitError
    );
  });
});
