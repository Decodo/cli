import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const rootDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(rootDir, "..");

const limits = {
  minEntryBytes: 400,
  minPackUnpackedBytes: 40_000,
  minPackJsFiles: 35,
} as const;

interface PackManifest {
  files?: Array<{ path?: string }>;
  unpackedSize?: number;
}

const packageJson = JSON.parse(
  readFileSync(join(repoRoot, "package.json"), "utf8")
) as {
  bin?: Record<string, string>;
  files?: string[];
};

function runPackDryRun(): PackManifest {
  const output = execFileSync(
    "npm",
    ["pack", "--dry-run", "--json", "--ignore-scripts"],
    {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }
  );

  const manifest = JSON.parse(output) as PackManifest | PackManifest[];
  return Array.isArray(manifest) ? (manifest[0] ?? {}) : manifest;
}

describe("publish artifact", () => {
  it("includes built bin entries with non-trivial size", () => {
    for (const relativePath of Object.values(packageJson.bin ?? {})) {
      const absolutePath = join(repoRoot, relativePath);
      expect(existsSync(absolutePath)).toBe(true);
      expect(statSync(absolutePath).size).toBeGreaterThanOrEqual(
        limits.minEntryBytes
      );
    }
  });

  it("includes configured files paths", () => {
    for (const entry of packageJson.files ?? []) {
      expect(existsSync(join(repoRoot, entry))).toBe(true);
    }
  });

  it("packs a non-empty build output", () => {
    const manifest = runPackDryRun();
    const packedFiles = manifest.files ?? [];
    const packJsFiles = packedFiles.filter(
      (file) =>
        typeof file.path === "string" &&
        file.path.startsWith("build/") &&
        file.path.endsWith(".js")
    );

    expect(manifest.unpackedSize).toBeGreaterThanOrEqual(
      limits.minPackUnpackedBytes
    );
    expect(packJsFiles.length).toBeGreaterThanOrEqual(limits.minPackJsFiles);
    expect(packJsFiles.some((file) => file.path === "build/esm/index.js")).toBe(
      true
    );
  });
});
