import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Command } from 'commander';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

async function runSetup(args: string[]): Promise<void> {
  const { setupCommand } = await import('../../../src/auth/commands/setup.js');
  const program = new Command()
    .option('--token <token>', 'global token')
    .addCommand(setupCommand);
  await program.parseAsync(['setup', ...args], { from: 'user' });
}

describe('setupCommand', () => {
  let configHome: string;
  let previousConfigHome: string | undefined;
  let exitCode: number | undefined;
  let stdout: string[];

  beforeEach(async () => {
    previousConfigHome = process.env.XDG_CONFIG_HOME;
    configHome = await mkdtemp(join(tmpdir(), 'decodo-config-'));
    process.env.XDG_CONFIG_HOME = configHome;
    vi.resetModules();
    exitCode = undefined;
    stdout = [];

    vi.spyOn(process, 'exit').mockImplementation((code) => {
      exitCode = code as number;
      throw new Error(`process.exit:${code}`);
    });
    vi.spyOn(console, 'log').mockImplementation((msg) => {
      stdout.push(String(msg));
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ results: [] }),
      }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    if (previousConfigHome === undefined) {
      delete process.env.XDG_CONFIG_HOME;
    } else {
      process.env.XDG_CONFIG_HOME = previousConfigHome;
    }
    vi.resetModules();
  });

  it('saves config on successful validation', async () => {
    await runSetup(['--token', 'valid-token']);

    const { readConfig } = await import('../../../src/auth/services/config.js');
    expect(await readConfig()).toEqual({
      authToken: 'valid-token',
    });
    expect(stdout.join('\n')).toContain('Setup complete');
  });

  it('does not save config on 401', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Unauthorized', status: 'failed' }),
    } as Response);

    await expect(
      runSetup(['--token', 'bad-token']),
    ).rejects.toThrow('process.exit:3');

    const { readConfig } = await import('../../../src/auth/services/config.js');
    expect(await readConfig()).toBeUndefined();
    expect(exitCode).toBe(3);
  });
});
