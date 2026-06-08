import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { writeTextOutput } from "../../../src/output/services/write-text-output.js";

describe("writeTextOutput", () => {
  let written: string | undefined;

  beforeEach(() => {
    written = undefined;
    vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
      written = String(chunk);
      return true;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("writes to file when -o is set", () => {
    const dir = mkdtempSync(join(tmpdir(), "decodo-output-"));
    const path = join(dir, "out.txt");

    try {
      writeTextOutput("hello", { output: path });
      expect(readFileSync(path, "utf8")).toBe("hello");
      expect(written).toBeUndefined();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("writes to stdout when no -o", () => {
    writeTextOutput("hello", {});
    expect(written).toBe("hello\n");
  });
});
