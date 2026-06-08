import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const rootDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(rootDir, "..", "..");
const scriptPath = join(repoRoot, "scripts", "verify-publish.mjs");

describe("verify-publish", () => {
  it("passes when build output and pack manifest look healthy", () => {
    const output = execFileSync(process.execPath, [scriptPath], {
      cwd: repoRoot,
      encoding: "utf8",
    });

    expect(output).toContain("verify-publish: ok");
  });
});
