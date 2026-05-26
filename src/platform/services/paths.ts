import envPaths from "env-paths";

export function getConfigDir(): string {
  const override = process.env.DECODO_CONFIG_HOME;
  
  if (override) {
    return override;
  }

  return envPaths("decodo", { suffix: "" }).config;
}
