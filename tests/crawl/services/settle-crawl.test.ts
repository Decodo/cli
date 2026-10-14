import type { WebScrapingApi } from "@decodo/sdk-ts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { settleCrawl } from "../../../src/crawl/services/settle-crawl.js";

const DONE = {
  crawl_id: "abc",
  status: "done",
  completed: 1,
  discovered: 1,
  failed: 0,
  in_flight: 0,
};

describe("settleCrawl", () => {
  let stderr: string[];

  beforeEach(() => {
    stderr = [];
    vi.spyOn(process.stderr, "write").mockImplementation((chunk) => {
      stderr.push(String(chunk));
      return true;
    });
    vi.spyOn(console, "error").mockImplementation((message) => {
      stderr.push(String(message));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function apiWith(status: object): WebScrapingApi {
    return {
      getCrawlStatus: vi.fn().mockResolvedValue(status),
    } as unknown as WebScrapingApi;
  }

  it("stays quiet without --progress", async () => {
    await settleCrawl(apiWith(DONE), "abc", {});
    expect(stderr).toEqual([]);
  });

  it("prints progress lines with --progress", async () => {
    await settleCrawl(apiWith(DONE), "abc", { progress: true });
    expect(stderr).toEqual([
      "crawl abc done: 1/1 pages, 0 failed, 0 in flight\n",
    ]);
  });

  it("returns the final status", async () => {
    const faulted = { ...DONE, status: "faulted" };
    await expect(settleCrawl(apiWith(faulted), "abc", {})).resolves.toEqual(
      faulted
    );
    expect(stderr).toEqual([]);
  });

  it("warns when the crawl is truncated", async () => {
    await settleCrawl(
      apiWith({ ...DONE, status: "truncated", reason: "max_duration" }),
      "abc",
      {}
    );
    expect(stderr).toEqual([
      "Warning: crawl abc ended with status truncated (max_duration)",
    ]);
  });
});
