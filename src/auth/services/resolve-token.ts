import { AUTH_TYPE } from "../constants.js";
import type { AuthCredential } from "../types/credential.js";
import { readConfig } from "./config.js";
import { detectCredentialType } from "./detect-credential-type.js";

export type AuthSource = "flag" | "env" | "config" | "none";

export interface ResolvedAuth {
  credential: AuthCredential | undefined;
  source: AuthSource;
}

export interface ResolveAuthOptions {
  token?: string;
}

function detect(value: string): AuthCredential {
  return { type: detectCredentialType(value), value };
}

export async function resolveAuthToken(
  options: ResolveAuthOptions = {}
): Promise<ResolvedAuth> {
  const flagToken = options.token?.trim();

  if (flagToken) {
    return { credential: detect(flagToken), source: "flag" };
  }

  const envToken = process.env.DECODO_AUTH_TOKEN?.trim();

  if (envToken) {
    return { credential: detect(envToken), source: "env" };
  }

  const config = await readConfig();

  if (config?.authToken) {
    return {
      credential: { type: AUTH_TYPE.TOKEN, value: config.authToken },
      source: "config",
    };
  }

  if (config?.apiKey) {
    return {
      credential: { type: AUTH_TYPE.API_KEY, value: config.apiKey },
      source: "config",
    };
  }

  return { credential: undefined, source: "none" };
}
