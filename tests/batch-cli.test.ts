import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const rootDir = dirname(fileURLToPath(import.meta.url));
const cliPath = join(rootDir, "..", "build", "esm", "index.js");

function runCli(args: string[]): { exitCode: number; stderr: string } {
  try {
    execFileSync(process.execPath, [cliPath, ...args], { encoding: "utf8" });
    return { exitCode: 0, stderr: "" };
  } catch (err) {
    const execErr = err as { status?: number; stderr?: string };
    return { exitCode: execErr.status ?? 1, stderr: execErr.stderr ?? "" };
  }
}

describe("batch flags", () => {
  it.each([
    "scrape",
    "search",
    "screenshot",
  ])("exposes batch flags in `%s --help`", (command) => {
    const output = execFileSync(
      process.execPath,
      [cliPath, command, "--help"],
      { encoding: "utf8" }
    );

    expect(output).toContain("--input-file");
    expect(output).toContain("--input-column");
    expect(output).toContain("--concurrency");
  });

  it("rejects --input-file combined with a positional input", () => {
    const { exitCode, stderr } = runCli([
      "scrape",
      "https://example.com",
      "--input-file",
      "urls.txt",
    ]);

    expect(exitCode).toBe(2);
    expect(stderr).toContain("Cannot combine --input-file with a positional");
  });

  it("requires --input-column for a CSV input file", () => {
    const { exitCode, stderr } = runCli([
      "scrape",
      "--token",
      "dummy",
      "--input-file",
      "data.csv",
    ]);

    expect(exitCode).toBe(2);
    expect(stderr).toContain("--input-column is required");
  });

  it("rejects a non-positive --concurrency", () => {
    const { exitCode } = runCli([
      "scrape",
      "--token",
      "dummy",
      "--input-file",
      "urls.txt",
      "--concurrency",
      "0",
    ]);

    expect(exitCode).not.toBe(0);
  });
});
