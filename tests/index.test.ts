import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const rootDir = dirname(fileURLToPath(import.meta.url));
const cliPath = join(rootDir, "..", "build", "esm", "index.js");
const packageJson = JSON.parse(
  readFileSync(join(rootDir, "..", "package.json"), "utf8")
) as { version: string };

function runCli(args: string[]): { exitCode: number; stderr: string } {
  try {
    execFileSync(process.execPath, [cliPath, ...args], { encoding: "utf8" });
    return { exitCode: 0, stderr: "" };
  } catch (err) {
    const execErr = err as { status?: number; stderr?: string };
    return {
      exitCode: execErr.status ?? 1,
      stderr: execErr.stderr ?? "",
    };
  }
}

describe("cli", () => {
  it("prints the package version with --version", () => {
    const output = execFileSync(process.execPath, [cliPath, "--version"], {
      encoding: "utf8",
    }).trim();

    expect(output).toBe(packageJson.version);
  });

  it("shows verbose flag in root help", () => {
    const output = execFileSync(process.execPath, [cliPath, "--help"], {
      encoding: "utf8",
    });

    expect(output).toContain("-v, --verbose");
  });

  it.each([
    ["unknown flag", ["--bad-flag"], 2],
    ["unknown command", ["nosuchcmd"], 2],
    ["missing required arg", ["search"], 2],
    ["invalid choice", ["search", "q", "--engine", "yahoo"], 2],
  ])("exits with code 2 on %s", (_label, args, expectedExit) => {
    const { exitCode } = runCli(args);
    expect(exitCode).toBe(expectedExit);
  });

  it.each([
    ["--version", 0],
    ["--help", 0],
  ])("exits with code 0 for %s", (flag, expectedExit) => {
    const { exitCode } = runCli([flag]);
    expect(exitCode).toBe(expectedExit);
  });
});
