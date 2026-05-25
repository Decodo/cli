import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';

const rootDir = dirname(fileURLToPath(import.meta.url));
const packageJson = JSON.parse(
  readFileSync(join(rootDir, '..', 'package.json'), 'utf8'),
) as { version: string };

describe('cli', () => {
  it('prints the package version with --version', () => {
    const output = execFileSync(
      process.execPath,
      [join(rootDir, '..', 'build', 'esm', 'index.js'), '--version'],
      { encoding: 'utf8' },
    ).trim();

    expect(output).toBe(packageJson.version);
  });
});
