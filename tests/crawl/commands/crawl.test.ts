import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AUTH_TYPE } from "../../../src/auth/constants.js";
import { resolveAuthToken } from "../../../src/auth/services/resolve-token.js";
import { createCrawlCommand } from "../../../src/crawl/commands/crawl.js";
import { createDecodoClient } from "../../../src/scrape/services/client.js";
import { runDataCommand } from "../../cli/helpers/run-data-command.js";

vi.mock("../../../src/auth/services/resolve-token.js", () => ({
  resolveAuthToken: vi.fn(),
}));

vi.mock("../../../src/scrape/services/client.js", () => ({
  createDecodoClient: vi.fn(),
}));

const PAGES = [{ url: "https://example.com/", content: "home" }];

describe("createCrawlCommand", () => {
  let exitCode: number | undefined;
  let stdout: string[];
  let stderr: string[];
  const api = {
    startCrawl: vi.fn(),
    getCrawlStatus: vi.fn(),
    getCrawlResults: vi.fn(),
    cancelCrawl: vi.fn(),
  };

  beforeEach(() => {
    exitCode = undefined;
    stdout = [];
    stderr = [];
    for (const fn of Object.values(api)) {
      fn.mockReset();
    }
    api.startCrawl.mockResolvedValue({ crawl_id: "abc" });
    api.getCrawlResults.mockResolvedValue(PAGES);
    Object.defineProperty(process.stdout, "isTTY", {
      value: false,
      configurable: true,
    });
    vi.mocked(resolveAuthToken).mockResolvedValue({
      credential: { type: AUTH_TYPE.API_KEY, value: "key" },
      source: "flag",
    });
    vi.mocked(createDecodoClient).mockReturnValue({
      webScrapingApi: api,
    } as never);
    vi.spyOn(process, "exit").mockImplementation((code) => {
      exitCode = code as number;
      throw new Error(`process.exit:${code}`);
    });
    vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
      stdout.push(String(chunk));
      return true;
    });
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

  it("starts a crawl and prints its id", async () => {
    await runDataCommand(createCrawlCommand(), [
      "crawl",
      "https://example.com",
      "--limit",
      "5",
      "--max-depth",
      "2",
      "--content-format",
      "html",
    ]);

    expect(api.startCrawl).toHaveBeenCalledWith({
      url: "https://example.com",
      limit: 5,
      max_depth: 2,
      output: "html",
    });
    expect(api.getCrawlStatus).not.toHaveBeenCalled();
    expect(stdout).toEqual(["abc\n"]);
  });

  it("waits, reports progress and prints pages as NDJSON", async () => {
    api.getCrawlStatus
      .mockResolvedValueOnce({
        crawl_id: "abc",
        status: "pending",
        completed: 0,
        discovered: 1,
        failed: 0,
        in_flight: 1,
      })
      .mockResolvedValueOnce({
        crawl_id: "abc",
        status: "done",
        completed: 1,
        discovered: 1,
        failed: 0,
        in_flight: 0,
      });

    await runDataCommand(createCrawlCommand(), [
      "crawl",
      "https://example.com",
      "--wait",
      "--progress",
      "--poll-interval",
      "1",
    ]);

    expect(stderr).toEqual([
      "crawl abc started\n",
      "crawl abc pending: 0/1 pages, 0 failed, 1 in flight\n",
      "crawl abc done: 1/1 pages, 0 failed, 0 in flight\n",
    ]);
    expect(api.getCrawlResults).toHaveBeenCalledWith("abc");
    expect(stdout).toEqual([`${JSON.stringify(PAGES[0])}\n`]);
  });

  it("warns when the crawl does not finish cleanly", async () => {
    api.getCrawlStatus.mockResolvedValue({
      crawl_id: "abc",
      status: "truncated",
      reason: "max_duration",
    });

    await runDataCommand(createCrawlCommand(), [
      "crawl",
      "https://example.com",
      "--wait",
    ]);

    expect(stderr).toEqual([
      "crawl abc started\n",
      "Warning: crawl abc ended with status truncated (max_duration)",
    ]);
    expect(stdout).toHaveLength(1);
  });

  it("prints the pages, then exits non-zero when the crawl faults", async () => {
    api.getCrawlStatus.mockResolvedValue({
      crawl_id: "abc",
      status: "faulted",
    });

    await expect(
      runDataCommand(createCrawlCommand(), [
        "crawl",
        "https://example.com",
        "--wait",
      ])
    ).rejects.toThrow("process.exit:7");
    expect(stdout).toEqual([`${JSON.stringify(PAGES[0])}\n`]);
    expect(stderr).toEqual([
      "crawl abc started\n",
      "Error: Crawl abc ended with status faulted.",
    ]);
  });

  it("names the crawl id before a failure while waiting", async () => {
    api.getCrawlStatus.mockRejectedValue(new Error("Service unavailable"));

    await expect(
      runDataCommand(createCrawlCommand(), [
        "crawl",
        "https://example.com",
        "--wait",
      ])
    ).rejects.toThrow("process.exit:1");
    expect(stderr).toEqual([
      "crawl abc started\n",
      "Error: Service unavailable",
    ]);
  });

  it("exits 2 when a wait-only flag is used without --wait", async () => {
    await expect(
      runDataCommand(createCrawlCommand(), [
        "crawl",
        "https://example.com",
        "--timeout",
        "10",
      ])
    ).rejects.toThrow("process.exit:2");
    expect(exitCode).toBe(2);
    expect(api.startCrawl).not.toHaveBeenCalled();
  });

  it("prints crawl status", async () => {
    api.getCrawlStatus.mockResolvedValue({ crawl_id: "abc", status: "done" });

    await runDataCommand(createCrawlCommand(), ["crawl", "status", "abc"]);

    expect(api.getCrawlStatus).toHaveBeenCalledWith("abc");
    expect(api.startCrawl).not.toHaveBeenCalled();
    expect(stdout).toEqual(['{"crawl_id":"abc","status":"done"}\n']);
  });

  it("prints crawl results without content", async () => {
    await runDataCommand(createCrawlCommand(), [
      "crawl",
      "results",
      "abc",
      "--no-content",
    ]);

    expect(api.getCrawlResults).toHaveBeenCalledWith("abc", { content: false });
    expect(stdout).toEqual([`${JSON.stringify(PAGES[0])}\n`]);
  });

  it("waits for a running crawl before printing results", async () => {
    api.getCrawlStatus
      .mockResolvedValueOnce({ crawl_id: "abc", status: "pending" })
      .mockResolvedValueOnce({ crawl_id: "abc", status: "done" });

    await runDataCommand(createCrawlCommand(), [
      "crawl",
      "results",
      "abc",
      "--wait",
      "--poll-interval",
      "1",
    ]);

    expect(api.getCrawlStatus).toHaveBeenCalledTimes(2);
    expect(api.getCrawlResults).toHaveBeenCalledWith("abc", { content: true });
    expect(stdout).toEqual([`${JSON.stringify(PAGES[0])}\n`]);
  });

  it("prints results, then exits non-zero when the awaited crawl faulted", async () => {
    api.getCrawlStatus.mockResolvedValue({
      crawl_id: "abc",
      status: "faulted",
    });

    await expect(
      runDataCommand(createCrawlCommand(), [
        "crawl",
        "results",
        "abc",
        "--wait",
      ])
    ).rejects.toThrow("process.exit:7");
    expect(stdout).toEqual([`${JSON.stringify(PAGES[0])}\n`]);
  });

  it("warns but succeeds when the awaited crawl was cancelled", async () => {
    api.getCrawlStatus.mockResolvedValue({
      crawl_id: "abc",
      status: "cancelled",
    });

    await runDataCommand(createCrawlCommand(), [
      "crawl",
      "results",
      "abc",
      "--wait",
    ]);
    expect(exitCode).toBeUndefined();
    expect(stderr).toEqual(["Warning: crawl abc ended with status cancelled"]);
    expect(stdout).toEqual([`${JSON.stringify(PAGES[0])}\n`]);
  });

  it("exits 2 when results gets --timeout without --wait", async () => {
    await expect(
      runDataCommand(createCrawlCommand(), [
        "crawl",
        "results",
        "abc",
        "--timeout",
        "10",
      ])
    ).rejects.toThrow("process.exit:2");
    expect(api.getCrawlResults).not.toHaveBeenCalled();
  });

  it("cancels a crawl", async () => {
    api.cancelCrawl.mockResolvedValue({ crawl_id: "abc", status: "cancelled" });

    await runDataCommand(createCrawlCommand(), ["crawl", "cancel", "abc"]);

    expect(api.cancelCrawl).toHaveBeenCalledWith("abc");
    expect(stdout).toEqual(['{"crawl_id":"abc","status":"cancelled"}\n']);
  });
});
