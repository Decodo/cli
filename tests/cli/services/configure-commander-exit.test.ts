import { Command } from "commander";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { configureCommanderExit } from "../../../src/cli/services/configure-commander-exit.js";

describe("configureCommanderExit", () => {
  let exitCode: number | undefined;

  beforeEach(() => {
    exitCode = undefined;

    vi.spyOn(process, "exit").mockImplementation((code) => {
      exitCode = code as number;
      throw new Error(`process.exit:${code}`);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("maps parse errors to exit code 2", async () => {
    const program = new Command().option("--known", "a known flag");
    configureCommanderExit(program);

    await expect(
      program.parseAsync(["--unknown"], { from: "user" })
    ).rejects.toThrow("process.exit:2");

    expect(exitCode).toBe(2);
  });

  it("maps help to exit code 0", async () => {
    const program = new Command()
      .name("test-cli")
      .option("--known", "a known flag");
    configureCommanderExit(program);

    await expect(
      program.parseAsync(["--help"], { from: "user" })
    ).rejects.toThrow("process.exit:0");

    expect(exitCode).toBe(0);
  });

  it("maps subcommand parse errors to exit code 2", async () => {
    const program = new Command().addCommand(
      new Command("search").argument("<query>", "search query")
    );
    configureCommanderExit(program);

    await expect(
      program.parseAsync(["search"], { from: "user" })
    ).rejects.toThrow("process.exit:2");

    expect(exitCode).toBe(2);
  });
});
