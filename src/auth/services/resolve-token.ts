import { CliUsageError } from "../../platform/errors/cli-usage-error.js";
import { AMBIGUOUS_CREDENTIAL_MESSAGE } from "../constants.js";
import type { AuthCredential } from "../types/credential.js";
import { readConfig } from "./config.js";

export type AuthSource = "flag" | "env" | "config" | "none";

export interface ResolvedAuth {
  credential: AuthCredential | undefined;
  source: AuthSource;
}

export interface ResolveAuthOptions {
  apiKey?: string;
  token?: string;
}

function resolveFrom(
  source: AuthSource,
  apiKey: string | undefined,
  token: string | undefined
): ResolvedAuth | undefined {
  const resolvedToken = token?.trim();

  if (resolvedToken) {
    return { credential: { kind: "token", value: resolvedToken }, source };
  }

  const resolvedApiKey = apiKey?.trim();

  if (resolvedApiKey) {
    return { credential: { kind: "apiKey", value: resolvedApiKey }, source };
  }

  return;
}

export async function resolveAuthToken(
  options: ResolveAuthOptions = {}
): Promise<ResolvedAuth> {
  if (options.apiKey?.trim() && options.token?.trim()) {
    throw new CliUsageError(AMBIGUOUS_CREDENTIAL_MESSAGE);
  }

  const fromFlag = resolveFrom("flag", options.apiKey, options.token);

  if (fromFlag) {
    return fromFlag;
  }

  const fromEnv = resolveFrom(
    "env",
    process.env.DECODO_API_KEY,
    process.env.DECODO_AUTH_TOKEN
  );

  if (fromEnv) {
    return fromEnv;
  }

  const config = await readConfig();
  const fromConfig = resolveFrom("config", config?.apiKey, config?.authToken);

  if (fromConfig) {
    return fromConfig;
  }

  return { credential: undefined, source: "none" };
}
