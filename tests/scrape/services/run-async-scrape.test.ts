import type { WebScrapingApi } from "@decodo/sdk-ts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TaskFailedError } from "../../../src/scrape/errors/task-failed-error.js";
import { runAsyncScrape } from "../../../src/scrape/services/run-async-scrape.js";

const BODY = { target: "google_search", query: "coffee" };
const TASK = { id: "123", status: "pending" };

function apiWith(overrides: Record<string, unknown> = {}): WebScrapingApi {
  return {
    scrapeAsync: vi.fn().mockResolvedValue(TASK),
    getStatus: vi.fn().mockResolvedValue({ id: "123", status: "done" }),
    getResults: vi
      .fn()
      .mockResolvedValue({ results: [{ content: { ok: true } }] }),
    ...overrides,
  } as unknown as WebScrapingApi;
}

describe("runAsyncScrape", () => {
  let stdout: string[];
  let stderr: string[];

  beforeEach(() => {
    stdout = [];
    stderr = [];

    Object.defineProperty(process.stdout, "isTTY", {
      value: false,
      configurable: true,
    });
    vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
      stdout.push(String(chunk));
      return true;
    });
    vi.spyOn(process.stderr, "write").mockImplementation((chunk) => {
      stderr.push(String(chunk));
      return true;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("prints the created task and does not wait without --wait", async () => {
    const api = apiWith();

    await runAsyncScrape(api, { body: BODY, options: { async: true } });

    expect(api.scrapeAsync).toHaveBeenCalledWith(BODY);
    expect(api.getStatus).not.toHaveBeenCalled();
    expect(api.getResults).not.toHaveBeenCalled();
    expect(stdout.join("")).toBe('{"id":"123","status":"pending"}\n');
  });

  it("waits for the task and prints its result with --wait", async () => {
    const api = apiWith();

    await runAsyncScrape(api, {
      body: BODY,
      options: { async: true, wait: true },
    });

    expect(api.getStatus).toHaveBeenCalledWith("123");
    expect(api.getResults).toHaveBeenCalledWith("123");
    expect(stderr.join("")).toBe("task 123 started\n");
    expect(stdout.join("")).toBe('{"ok":true}\n');
  });

  it("fails without reading results when the task is faulted", async () => {
    const api = apiWith({
      getStatus: vi.fn().mockResolvedValue({ id: "123", status: "faulted" }),
    });

    await expect(
      runAsyncScrape(api, { body: BODY, options: { async: true, wait: true } })
    ).rejects.toThrow(new TaskFailedError("123", "faulted"));
    expect(api.getResults).not.toHaveBeenCalled();
  });
});
