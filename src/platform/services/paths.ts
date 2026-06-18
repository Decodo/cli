import { homedir } from "node:os";
import { join } from "node:path";

export function getConfigDir(): string {
  const override = process.env.DECODO_CONFIG_HOME;

  if (override) {
    return override;
  }

  return join(homedir(), ".config", "decodo");
}

export function getLegacyConfigDir(): string | undefined {
  if (process.platform !== "darwin") {
    return;
  }

  return join(homedir(), "Library", "Preferences", "decodo");
}
