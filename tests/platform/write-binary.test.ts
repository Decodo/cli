import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  BINARY_TTY_ERROR,
  writeBinaryOutput,
} from "../../src/platform/write-binary.js";

describe("writeBinaryOutput", () => {
  let exitCode: number | undefined;
  let stderr: string[];
  let written: Buffer | undefined;
  const bytes = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

  beforeEach(() => {
    exitCode = undefined;
    stderr = [];
    written = undefined;

    vi.spyOn(process, "exit").mockImplementation((code) => {
      exitCode = code as number;
      throw new Error(`process.exit:${code}`);
    });
    vi.spyOn(console, "error").mockImplementation((message) => {
      stderr.push(String(message));
    });
    vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
      written = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
      return true;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("writes bytes to file when -o is set", () => {
    const dir = mkdtempSync(join(tmpdir(), "decodo-write-binary-"));
    const path = join(dir, "out.png");

    try {
      writeBinaryOutput(bytes, { output: path });
      expect(readFileSync(path)).toEqual(bytes);
      expect(written).toBeUndefined();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("refuses TTY stdout without -o", () => {
    Object.defineProperty(process.stdout, "isTTY", {
      value: true,
      configurable: true,
    });

    expect(() => writeBinaryOutput(bytes, {})).toThrow("process.exit:2");
    expect(exitCode).toBe(2);
    expect(stderr.join("\n")).toContain(BINARY_TTY_ERROR);
    expect(written).toBeUndefined();
  });

  it("writes bytes to stdout when not a TTY", () => {
    Object.defineProperty(process.stdout, "isTTY", {
      value: false,
      configurable: true,
    });

    writeBinaryOutput(bytes, {});

    expect(written).toEqual(bytes);
    expect(exitCode).toBeUndefined();
  });
});
