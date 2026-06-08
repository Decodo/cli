import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const rootDir = dirname(fileURLToPath(import.meta.url));
const packageJson = JSON.parse(
  readFileSync(join(rootDir, "..", "package.json"), "utf8")
) as { version: string };

describe("cli", () => {
  it("prints the package version with --version", () => {
    const output = execFileSync(
      process.execPath,
      [join(rootDir, "..", "build", "esm", "index.js"), "--version"],
      { encoding: "utf8" }
    ).trim();

    expect(output).toBe(packageJson.version);
  });

  it("shows verbose flag in root help", () => {
    const output = execFileSync(
      process.execPath,
      [join(rootDir, "..", "build", "esm", "index.js"), "--help"],
      { encoding: "utf8" }
    );

    expect(output).toContain("-v, --verbose");
  });
});
