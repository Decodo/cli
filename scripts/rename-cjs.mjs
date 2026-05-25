import { readdir, rename } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cjsDir = fileURLToPath(new URL('../build/cjs', import.meta.url));

async function renameJsToCjs(dir) {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      await renameJsToCjs(entryPath);
      continue;
    }

    if (entry.name.endsWith('.js')) {
      const base = entry.name.slice(0, -3);
      await rename(entryPath, join(dir, `${base}.cjs`));
    }

    if (entry.name.endsWith('.d.ts')) {
      const base = entry.name.slice(0, -5);
      await rename(entryPath, join(dir, `${base}.d.cts`));
    }
  }
}

await renameJsToCjs(cjsDir);
