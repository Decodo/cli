import { mkdir, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

interface EnvSnapshot {
  decodoConfigHome: string | undefined;
}

export interface IsolatedConfigHome {
  configDir: string;
  configPath: string;
  restore: () => void;
}

export async function isolateConfigHome(): Promise<IsolatedConfigHome> {
  const configDir = await mkdtemp(join(tmpdir(), "decodo-config-"));
  const snapshot: EnvSnapshot = {
    decodoConfigHome: process.env.DECODO_CONFIG_HOME,
  };

  process.env.DECODO_CONFIG_HOME = configDir;
  await mkdir(configDir, { recursive: true });

  return {
    configDir,
    configPath: join(configDir, "config.json"),
    restore: () => {
      if (snapshot.decodoConfigHome === undefined) {
        delete process.env.DECODO_CONFIG_HOME;
      } else {
        process.env.DECODO_CONFIG_HOME = snapshot.decodoConfigHome;
      }
    },
  };
}
