#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

function readVersion(): string {
  const entry = process.argv[1];
  if (!entry) {
    throw new Error('Unable to resolve CLI entry path');
  }

  const packageJsonPath = join(dirname(entry), '..', '..', 'package.json');
  const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
    version: string;
  };

  return pkg.version;
}

const program = new Command()
  .name('decodo')
  .description('Official CLI for Decodo APIs')
  .version(readVersion(), '-V, --version', 'output the version number');

program.parse(process.argv);
