import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

const limits = {
  minEntryBytes: 400,
  minPackUnpackedBytes: 40_000,
  minPackJsFiles: 35,
};

function fail(message) {
  console.error(`verify-publish: ${message}`);
  process.exit(1);
}

function assertFile(relativePath, minBytes = 1) {
  const absolutePath = join(root, relativePath);
  if (!existsSync(absolutePath)) {
    fail(`missing required file: ${relativePath}`);
  }

  const { size } = statSync(absolutePath);
  if (size < minBytes) {
    fail(`${relativePath} is too small (${size} bytes, need >= ${minBytes})`);
  }
}

for (const [_name, relativePath] of Object.entries(pkg.bin ?? {})) {
  assertFile(relativePath, limits.minEntryBytes);
}

for (const entry of pkg.files ?? []) {
  if (!existsSync(join(root, entry))) {
    fail(`files field path missing: ${entry}`);
  }
}

const binPaths = Object.values(pkg.bin ?? {});
if (binPaths.length === 0) {
  fail("no bin entry configured");
}

const entry = join(root, binPaths[0]);

for (const args of [["--version"], ["--help"]]) {
  try {
    execFileSync(process.execPath, [entry, ...args], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    fail(`CLI smoke test failed for ${args.join(" ")}: ${message}`);
  }
}

const versionOutput = execFileSync(process.execPath, [entry, "--version"], {
  cwd: root,
  encoding: "utf8",
}).trim();

if (versionOutput !== pkg.version) {
  fail(`CLI version mismatch: got ${versionOutput}, expected ${pkg.version}`);
}

let packManifest;
try {
  const output = execFileSync("npm", ["pack", "--dry-run", "--json"], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  packManifest = JSON.parse(output);
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  fail(`npm pack --dry-run failed: ${message}`);
}

const manifest = Array.isArray(packManifest) ? packManifest[0] : packManifest;
if (!manifest) {
  fail("npm pack --dry-run returned no manifest");
}

if (
  typeof manifest.unpackedSize !== "number" ||
  manifest.unpackedSize < limits.minPackUnpackedBytes
) {
  fail(
    `pack unpacked size too small (${manifest.unpackedSize ?? "unknown"} bytes, need >= ${limits.minPackUnpackedBytes})`
  );
}

const packedFiles = Array.isArray(manifest.files) ? manifest.files : [];
const packJsFiles = packedFiles.filter(
  (file) =>
    typeof file.path === "string" &&
    file.path.startsWith("build/") &&
    file.path.endsWith(".js")
);

if (packJsFiles.length < limits.minPackJsFiles) {
  fail(
    `pack includes too few build JS files (${packJsFiles.length}, need >= ${limits.minPackJsFiles})`
  );
}

if (!packJsFiles.some((file) => file.path === "build/esm/index.js")) {
  fail("pack is missing build/esm/index.js");
}

console.log(
  `verify-publish: ok (unpacked ${manifest.unpackedSize} bytes, ${packJsFiles.length} build JS files)`
);
