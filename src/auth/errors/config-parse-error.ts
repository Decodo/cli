export class ConfigParseError extends Error {
  constructor(configPath: string) {
    super(
      `Configuration file is invalid (${configPath}). Run \`decodo setup\` to reconfigure.`
    );
    this.name = "ConfigParseError";
  }
}
