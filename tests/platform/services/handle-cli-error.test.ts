import {
  AuthenticationError,
  DecodoError,
  RateLimitError,
  TimeoutError,
  ValidationError,
} from "@decodo/sdk-ts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthRequiredError } from "../../../src/auth/errors/auth-required-error.js";
import { ScrapeFailedError } from "../../../src/output/errors/scrape-failed-error.js";
import { CliUsageError } from "../../../src/platform/errors/cli-usage-error.js";
import { handleCliError } from "../../../src/platform/services/handle-cli-error.js";

describe("handleCliError", () => {
  let exitCode: number | undefined;
  let stderr: string[];

  beforeEach(() => {
    exitCode = undefined;
    stderr = [];

    vi.spyOn(process, "exit").mockImplementation((code) => {
      exitCode = code as number;
      throw new Error(`process.exit:${code}`);
    });
    vi.spyOn(console, "error").mockImplementation((message) => {
      stderr.push(String(message));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("maps auth-required errors to exit code 3 with onboarding steps", () => {
    expect(() =>
      handleCliError(new AuthRequiredError("token missing"))
    ).toThrow("process.exit:3");

    expect(exitCode).toBe(3);
    expect(stderr.join("\n")).toContain("token missing");
    expect(stderr.join("\n")).toContain("installed and working");
    expect(stderr.join("\n")).toContain("decodo setup");
    expect(stderr.join("\n")).toContain("DECODO_AUTH_TOKEN");
  });

  it("maps SDK authentication errors to exit code 3 with setup hint", () => {
    const err = new AuthenticationError("Unauthorized");

    expect(() => handleCliError(err)).toThrow("process.exit:3");
    expect(exitCode).toBe(3);
    expect(stderr.join("\n")).toContain("decodo setup");
  });

  it("maps validation errors to exit code 4 and prints details", () => {
    const err = new ValidationError("invalid payload", [
      { message: "query is required" },
      "geo must be 2 letters",
    ]);

    expect(() => handleCliError(err)).toThrow("process.exit:4");

    expect(exitCode).toBe(4);
    expect(stderr.join("\n")).toContain("Validation details:");
    expect(stderr.join("\n")).toContain("- query is required");
    expect(stderr.join("\n")).toContain("- geo must be 2 letters");
  });

  it("maps rate-limit errors to exit code 5 with retry hint", () => {
    const err = new RateLimitError("Rate limit exceeded");

    expect(() => handleCliError(err)).toThrow("process.exit:5");

    expect(exitCode).toBe(5);
    expect(stderr.join("\n")).toContain("lower request concurrency");
  });

  it("maps timeout errors to exit code 6", () => {
    const err = new TimeoutError("Gateway timeout");

    expect(() => handleCliError(err)).toThrow("process.exit:6");
    expect(exitCode).toBe(6);
  });

  it("maps other Decodo errors to exit code 7", () => {
    const err = new DecodoError("Network unreachable", 503);

    expect(() => handleCliError(err)).toThrow("process.exit:7");
    expect(exitCode).toBe(7);
  });

  it("maps 400 Decodo errors to exit code 4 (validation)", () => {
    const err = new DecodoError("Validation failed, see documentation", 400);

    expect(() => handleCliError(err)).toThrow("process.exit:4");
    expect(exitCode).toBe(4);
  });

  it("maps 422 Decodo errors to exit code 4 (validation)", () => {
    const err = new DecodoError("Unprocessable entity", 422);

    expect(() => handleCliError(err)).toThrow("process.exit:4");
    expect(exitCode).toBe(4);
  });

  it("maps scrape failures to exit code 7 with the API message", () => {
    const err = new ScrapeFailedError("Trends request was rejected", 613);

    expect(() => handleCliError(err)).toThrow("process.exit:7");
    expect(exitCode).toBe(7);
    expect(stderr.join("\n")).toContain("Trends request was rejected");
  });

  it("maps syscall-coded network failures in the cause chain to exit code 7", () => {
    const cause = Object.assign(
      new Error("getaddrinfo ENOTFOUND api.decodo.com"),
      {
        code: "ENOTFOUND",
      }
    );
    const err = Object.assign(new TypeError("fetch failed"), { cause });

    expect(() => handleCliError(err)).toThrow("process.exit:7");

    expect(exitCode).toBe(7);
    expect(stderr.join("\n")).toContain("fetch failed");
    expect(stderr.join("\n")).toContain("ENOTFOUND");
  });

  it("maps explicit usage errors to exit code 2", () => {
    expect(() => handleCliError(new CliUsageError("bad flag"))).toThrow(
      "process.exit:2"
    );

    expect(exitCode).toBe(2);
  });

  it("maps unknown errors to exit code 1", () => {
    expect(() =>
      handleCliError(
        { reason: "unexpected crash" },
        { fallbackMessage: "Oops" }
      )
    ).toThrow("process.exit:1");

    expect(exitCode).toBe(1);
    expect(stderr.join("\n")).toContain("Oops");
  });

  it("rethrows mocked process.exit signals without remapping", () => {
    expect(() => handleCliError(new Error("process.exit:2"))).toThrow(
      "process.exit:2"
    );

    expect(process.exit).not.toHaveBeenCalled();
  });
});
