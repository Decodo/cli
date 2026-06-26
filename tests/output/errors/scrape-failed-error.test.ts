import { describe, expect, it } from "vitest";
import { ScrapeFailedError } from "../../../src/output/errors/scrape-failed-error.js";

describe("ScrapeFailedError", () => {
  it("sets name, message, and status code", () => {
    const err = new ScrapeFailedError("scrape failed", 613);

    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("ScrapeFailedError");
    expect(err.message).toBe("scrape failed");
    expect(err.statusCode).toBe(613);
  });

  it("leaves status code undefined when omitted", () => {
    const err = new ScrapeFailedError("scrape failed");

    expect(err.statusCode).toBeUndefined();
  });
});
