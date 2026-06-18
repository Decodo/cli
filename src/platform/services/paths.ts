import { homedir } from "node:os";
import { join } from "node:path";

export function getConfigDir(): string {
  const override = process.env.DECODO_CONFIG_HOME;

  if (override) {
    return override;
  }

  const xdgConfigHome = process.env.XDG_CONFIG_HOME;

  if (xdgConfigHome) {
    return join(xdgConfigHome, "decodo");
  }

  return join(homedir(), ".config", "decodo");
}
