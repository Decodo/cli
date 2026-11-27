import type { WebScrapingApi } from "@decodo/sdk-ts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TaskFailedError } from "../../../src/scrape/errors/task-failed-error.js";
import { runAsyncScrape } from "../../../src/scrape/services/run-async-scrape.js";

const BODY = { target: "google_search", query: "coffee" };
const TASK = { id: "123", status: "pending" };

function apiWith(status = "done") {
  const flows = {
    start: vi.fn().mockResolvedValue(TASK),
    wait: vi.fn().mockResolvedValue({ id: "123", status }),
    hasFailed: vi.fn().mockReturnValue(status === "faulted"),
    describe: vi.fn().mockReturnValue({ idField: "id", statusField: "status" }),
    results: vi
      .fn()
      .mockResolvedValue({ results: [{ content: { ok: true } }] }),
  };
  return { api: { flows } as unknown as WebScrapingApi, flows };
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
    const { api, flows } = apiWith();

    await runAsyncScrape(api, { body: BODY, options: { async: true } });

    expect(flows.start).toHaveBeenCalledWith("task", BODY);
    expect(flows.wait).not.toHaveBeenCalled();
    expect(flows.results).not.toHaveBeenCalled();
    expect(stdout.join("")).toBe('{"id":"123","status":"pending"}\n');
  });

  it("waits for the task and prints its result with --wait", async () => {
    const { api, flows } = apiWith();

    await runAsyncScrape(api, {
      body: BODY,
      options: { async: true, wait: true },
    });

    expect(flows.wait).toHaveBeenCalledWith("task", "123", expect.anything());
    expect(flows.results).toHaveBeenCalledWith("task", "123");
    expect(stderr.join("")).toBe("task 123 started\n");
    expect(stdout.join("")).toBe('{"ok":true}\n');
  });

  it("fails without reading results when the task is faulted", async () => {
    const { api, flows } = apiWith("faulted");

    await expect(
      runAsyncScrape(api, { body: BODY, options: { async: true, wait: true } })
    ).rejects.toThrow(new TaskFailedError("123", "faulted"));
    expect(flows.results).not.toHaveBeenCalled();
  });
});
