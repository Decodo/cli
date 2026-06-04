import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveOutputFilePath } from "../../../src/platform/services/resolve-output-file.js";

describe("resolveOutputFilePath", () => {
  it("joins default filename when path is an existing directory", () => {
    const dir = mkdtempSync(join(tmpdir(), "decodo-resolve-output-"));

    try {
      expect(resolveOutputFilePath(dir, "shot.png")).toBe(
        join(dir, "shot.png")
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("returns path unchanged when it is a file path", () => {
    const dir = mkdtempSync(join(tmpdir(), "decodo-resolve-output-"));
    const path = join(dir, "out.png");

    try {
      expect(resolveOutputFilePath(path, "shot.png")).toBe(path);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("returns path unchanged when directory does not exist yet", () => {
    const dir = mkdtempSync(join(tmpdir(), "decodo-resolve-output-"));
    const nested = join(dir, "missing", "out.png");

    try {
      expect(resolveOutputFilePath(nested, "shot.png")).toBe(nested);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
