import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { writeJsonOutput } from "../../../src/output/services/write-json-output.js";

describe("writeJsonOutput", () => {
  let written: string | undefined;

  beforeEach(() => {
    written = undefined;
    Object.defineProperty(process.stdout, "isTTY", {
      value: false,
      configurable: true,
    });
    vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
      written = String(chunk);
      return true;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("writes compact JSON when piped", () => {
    writeJsonOutput({ ok: true }, {});
    expect(written).toBe('{"ok":true}\n');
  });

  it("indents JSON with --pretty", () => {
    writeJsonOutput({ ok: true }, { pretty: true });
    expect(written).toBe('{\n  "ok": true\n}\n');
  });

  it("writes to a file with -o", () => {
    const dir = mkdtempSync(join(tmpdir(), "decodo-json-"));
    const path = join(dir, "out.json");

    try {
      writeJsonOutput({ ok: true }, { output: path });
      expect(readFileSync(path, "utf8")).toBe('{"ok":true}');
      expect(written).toBeUndefined();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
