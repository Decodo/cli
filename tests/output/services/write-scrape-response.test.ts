import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { SyncResponse } from "@decodo/sdk-ts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { writeScrapeResponse } from "../../../src/output/services/write-scrape-response.js";
import { BINARY_TTY_ERROR } from "../../../src/platform/services/write-binary.js";

const MINIMAL_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAD0JEQVQImWP4GwADAwEAAv6C7p4AAAAASUVORK5CYII=";

describe("writeScrapeResponse", () => {
  let written: string | string[] | undefined;
  let exitCode: number | undefined;
  let stderr: string[];

  beforeEach(() => {
    written = undefined;
    exitCode = undefined;
    stderr = [];

    Object.defineProperty(process.stdout, "isTTY", {
      value: false,
      configurable: true,
    });
    vi.spyOn(process, "exit").mockImplementation((code) => {
      exitCode = code as number;
      throw new Error(`process.exit:${code}`);
    });
    vi.spyOn(console, "error").mockImplementation((message) => {
      stderr.push(String(message));
    });
    vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
      if (Array.isArray(written)) {
        written.push(String(chunk));
      } else {
        written = String(chunk);
      }
      return true;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("prints compact JSON for object content", () => {
    const response = {
      results: [{ content: { items: [1] } }],
    } as SyncResponse;

    writeScrapeResponse(response, { options: {} });

    expect(written).toBe('{"items":[1]}\n');
  });

  it("prints string content as-is", () => {
    const response = {
      results: [{ content: "# Title" }],
    } as SyncResponse;

    writeScrapeResponse(response, { options: {} });

    expect(written).toBe("# Title\n");
  });

  it("prints full envelope with --full", () => {
    const response = {
      results: [{ content: "x", status_code: 200 }],
    } as SyncResponse;

    writeScrapeResponse(response, { options: { full: true } });

    expect(written).toContain('"results"');
    expect(written).toContain('"status_code":200');
  });

  it("delegates to ndjson output when --format ndjson is set", () => {
    written = [];
    const response = {
      results: [{ content: { a: 1 } }, { content: { b: 2 } }],
    } as SyncResponse;

    writeScrapeResponse(response, { options: { format: "ndjson" } });

    expect(written).toEqual(['{"a":1}\n', '{"b":2}\n']);
  });

  it("writes PNG bytes to file for binary png context", () => {
    const dir = mkdtempSync(join(tmpdir(), "decodo-write-scrape-binary-"));
    const path = join(dir, "shot.png");

    try {
      const response = {
        results: [{ content: MINIMAL_PNG_BASE64 }],
      } as SyncResponse;

      writeScrapeResponse(response, {
        options: { output: path },
        binary: { kind: "png" },
        input: "https://example.com",
      });

      expect(readFileSync(path).subarray(0, 8).toString("hex")).toBe(
        "89504e470d0a1a0a"
      );
      expect(stderr.join("\n")).toContain(path);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("refuses TTY stdout for binary png without -o", () => {
    Object.defineProperty(process.stdout, "isTTY", {
      value: true,
      configurable: true,
    });

    const response = {
      results: [{ content: MINIMAL_PNG_BASE64 }],
    } as SyncResponse;

    expect(() =>
      writeScrapeResponse(response, {
        options: {},
        binary: { kind: "png" },
      })
    ).toThrow("process.exit:2");

    expect(exitCode).toBe(2);
    expect(stderr.join("\n")).toContain(BINARY_TTY_ERROR);
  });
});
