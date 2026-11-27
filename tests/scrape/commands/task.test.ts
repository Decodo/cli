import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AUTH_TYPE } from "../../../src/auth/constants.js";
import { resolveAuthToken } from "../../../src/auth/services/resolve-token.js";
import { createTaskCommand } from "../../../src/scrape/commands/task.js";
import { createDecodoClient } from "../../../src/scrape/services/client.js";
import { runDataCommand } from "../../cli/helpers/run-data-command.js";

vi.mock("../../../src/auth/services/resolve-token.js", () => ({
  resolveAuthToken: vi.fn(),
}));

vi.mock("../../../src/scrape/services/client.js", () => ({
  createDecodoClient: vi.fn(),
}));

const RESULTS = { results: [{ content: { ok: true } }] };

describe("createTaskCommand", () => {
  let exitCode: number | undefined;
  let stdout: string[];
  let stderr: string[];
  const flows = {
    status: vi.fn(),
    wait: vi.fn(),
    hasFailed: vi.fn(),
    describe: vi.fn(),
    results: vi.fn(),
  };

  beforeEach(() => {
    exitCode = undefined;
    stdout = [];
    stderr = [];
    for (const fn of Object.values(flows)) {
      fn.mockReset();
    }
    flows.status.mockResolvedValue({ id: "123", status: "done" });
    flows.wait.mockResolvedValue({ id: "123", status: "done" });
    flows.hasFailed.mockReturnValue(false);
    flows.describe.mockReturnValue({ statusField: "status" });
    flows.results.mockResolvedValue(RESULTS);
    Object.defineProperty(process.stdout, "isTTY", {
      value: false,
      configurable: true,
    });
    vi.mocked(resolveAuthToken).mockResolvedValue({
      credential: { type: AUTH_TYPE.API_KEY, value: "key" },
      source: "flag",
    });
    vi.mocked(createDecodoClient).mockReturnValue({
      webScrapingApi: { flows },
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

  it("prints the task status as JSON", async () => {
    await runDataCommand(createTaskCommand(), ["task", "status", "123"]);

    expect(flows.status).toHaveBeenCalledWith("task", "123");
    expect(stdout.join("")).toBe('{"id":"123","status":"done"}\n');
  });

  it("prints the task result without checking the status", async () => {
    await runDataCommand(createTaskCommand(), ["task", "results", "123"]);

    expect(flows.wait).not.toHaveBeenCalled();
    expect(flows.results).toHaveBeenCalledWith("task", "123");
    expect(stdout.join("")).toBe('{"ok":true}\n');
  });

  it("waits for the task before printing its result with --wait", async () => {
    await runDataCommand(createTaskCommand(), [
      "task",
      "results",
      "123",
      "--wait",
      "--poll-interval",
      "1",
    ]);

    expect(flows.wait).toHaveBeenCalledWith("task", "123", {
      pollInterval: 1000,
      timeout: 600_000,
    });
    expect(stdout.join("")).toBe('{"ok":true}\n');
  });

  it("exits 1 with a hint when the task has no results yet", async () => {
    flows.results.mockResolvedValue(undefined);

    await expect(
      runDataCommand(createTaskCommand(), ["task", "results", "123"])
    ).rejects.toThrow("process.exit:1");

    expect(exitCode).toBe(1);
    expect(stderr.join("\n")).toContain("Task 123 has no results yet.");
  });

  it("exits 7 when the waited task is faulted", async () => {
    flows.wait.mockResolvedValue({ id: "123", status: "faulted" });
    flows.hasFailed.mockReturnValue(true);

    await expect(
      runDataCommand(createTaskCommand(), ["task", "results", "123", "--wait"])
    ).rejects.toThrow("process.exit:7");

    expect(exitCode).toBe(7);
    expect(flows.results).not.toHaveBeenCalled();
  });

  it("exits 3 with a basic token", async () => {
    vi.mocked(resolveAuthToken).mockResolvedValue({
      credential: { type: AUTH_TYPE.TOKEN, value: "dTpw" },
      source: "flag",
    });

    await expect(
      runDataCommand(createTaskCommand(), ["task", "status", "123"])
    ).rejects.toThrow("process.exit:3");

    expect(exitCode).toBe(3);
    expect(flows.status).not.toHaveBeenCalled();
  });

  it("exits 2 when --timeout is set without --wait", async () => {
    await expect(
      runDataCommand(createTaskCommand(), [
        "task",
        "results",
        "123",
        "--timeout",
        "30",
      ])
    ).rejects.toThrow("process.exit:2");

    expect(exitCode).toBe(2);
  });
});
