import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('auth config', () => {
  let configHome: string;
  let previousConfigHome: string | undefined;

  beforeEach(async () => {
    previousConfigHome = process.env.XDG_CONFIG_HOME;
    configHome = await mkdtemp(join(tmpdir(), 'decodo-config-'));
    process.env.XDG_CONFIG_HOME = configHome;
    vi.resetModules();
  });

  afterEach(() => {
    if (previousConfigHome === undefined) {
      delete process.env.XDG_CONFIG_HOME;
    } else {
      process.env.XDG_CONFIG_HOME = previousConfigHome;
    }
    vi.resetModules();
  });

  it('writes and reads config.json under decodo/', async () => {
    const { writeConfig, readConfig, getConfigPath } =
      await import('../../../src/auth/services/config.js');

    await writeConfig({
      authToken: 'test-token-value',
    });
    expect(getConfigPath()).toBe(join(configHome, 'decodo', 'config.json'));

    const saved = await readConfig();
    expect(saved).toEqual({
      authToken: 'test-token-value',
    });

    const raw = await readFile(getConfigPath(), 'utf8');
    expect(JSON.parse(raw)).toEqual({
      authToken: 'test-token-value',
    });
  });

  it('clears config file on logout', async () => {
    const { writeConfig, clearConfig, readConfig } =
      await import('../../../src/auth/services/config.js');

    await writeConfig({ authToken: 'test-token-value' });
    await clearConfig();
    expect(await readConfig()).toBeUndefined();
  });
});
