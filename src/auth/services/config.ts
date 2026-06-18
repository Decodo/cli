import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { getConfigDir } from "../../platform/services/paths.js";
import { ConfigParseError } from "../errors/config-parse-error.js";
import type { DecodoConfig } from "../types/config.js";

const CONFIG_FILE = "config.json";

export function getConfigPath(): string {
  return join(getConfigDir(), CONFIG_FILE);
}

function parseConfig(
  raw: string,
  configPath: string
): DecodoConfig | undefined {
  let parsed: Partial<DecodoConfig>;

  try {
    parsed = JSON.parse(raw) as Partial<DecodoConfig>;
  } catch {
    throw new ConfigParseError(configPath);
  }

  if (typeof parsed.authToken === "string" && parsed.authToken.length > 0) {
    return {
      authToken: parsed.authToken,
    };
  }

  return;
}

export async function readConfig(): Promise<DecodoConfig | undefined> {
  const configPath = getConfigPath();

  try {
    const raw = await readFile(configPath, "utf8");

    return parseConfig(raw, configPath);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return;
    }

    throw err;
  }
}

export async function writeConfig(config: DecodoConfig): Promise<void> {
  const configPath = getConfigPath();
  await mkdir(dirname(configPath), { recursive: true });

  const content = `${JSON.stringify(config, null, 2)}\n`;
  await writeFile(configPath, content, { mode: 0o600 });
}

export async function clearConfig(): Promise<void> {
  try {
    await unlink(getConfigPath());
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      throw err;
    }
  }
}
