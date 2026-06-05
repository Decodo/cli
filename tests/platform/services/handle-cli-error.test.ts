import {
  AuthenticationError,
  DecodoError,
  RateLimitError,
  TimeoutError,
  ValidationError,
} from "@decodo/sdk-ts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthRequiredError } from "../../../src/auth/errors/auth-required-error.js";
import {
  CliUsageError,
  handleCliError,
} from "../../../src/platform/services/handle-cli-error.js";

type ErrorConstructor<T extends Error> = new (...args: unknown[]) => T;

function createError<T extends Error>(
  ctor: ErrorConstructor<T>,
  message: string,
  extras: Record<string, unknown> = {}
): T {
  const err = Object.create(ctor.prototype) as T & Record<string, unknown>;
  err.name = ctor.name;
  err.message = message;
  Object.assign(err, extras);
  return err;
}

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

  it("maps auth-required errors to exit code 3 with setup hint", () => {
    expect(() => handleCliError(new AuthRequiredError("token missing"))).toThrow(
      "process.exit:3"
    );

    expect(exitCode).toBe(3);
    expect(stderr.join("\n")).toContain("token missing");
    expect(stderr.join("\n")).toContain("decodo setup");
  });

  it("maps SDK authentication errors to exit code 3", () => {
    const err = createError(AuthenticationError, "Unauthorized");

    expect(() => handleCliError(err)).toThrow("process.exit:3");
    expect(exitCode).toBe(3);
  });

  it("maps validation errors to exit code 4 and prints details", () => {
    const err = createError(ValidationError, "invalid payload", {
      errors: [{ message: "query is required" }, "geo must be 2 letters"],
    });

    expect(() => handleCliError(err)).toThrow("process.exit:4");

    expect(exitCode).toBe(4);
    expect(stderr.join("\n")).toContain("Validation details:");
    expect(stderr.join("\n")).toContain("- query is required");
    expect(stderr.join("\n")).toContain("- geo must be 2 letters");
  });

  it("maps rate-limit errors to exit code 5 with retry hint", () => {
    const err = createError(RateLimitError, "Rate limit exceeded");

    expect(() => handleCliError(err)).toThrow("process.exit:5");

    expect(exitCode).toBe(5);
    expect(stderr.join("\n")).toContain("lower request concurrency");
  });

  it("maps timeout errors to exit code 6", () => {
    const err = createError(TimeoutError, "Gateway timeout");

    expect(() => handleCliError(err)).toThrow("process.exit:6");
    expect(exitCode).toBe(6);
  });

  it("maps other Decodo errors to exit code 7", () => {
    const err = createError(DecodoError, "Network unreachable");

    expect(() => handleCliError(err)).toThrow("process.exit:7");
    expect(exitCode).toBe(7);
  });

  it("maps explicit usage errors to exit code 2", () => {
    expect(() => handleCliError(new CliUsageError("bad flag"))).toThrow(
      "process.exit:2"
    );

    expect(exitCode).toBe(2);
  });

  it("maps unknown errors to exit code 1", () => {
    expect(() =>
      handleCliError({ reason: "unexpected crash" }, { fallbackMessage: "Oops" })
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
