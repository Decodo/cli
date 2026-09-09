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

function resolveFrom(
  source: AuthSource,
  value: string | undefined
): ResolvedAuth | undefined {
  const resolved = value?.trim();

  if (!resolved) {
    return;
  }

  return {
    credential: { type: detectCredentialType(resolved), value: resolved },
    source,
  };
}

async function fromConfig(): Promise<ResolvedAuth | undefined> {
  const config = await readConfig();

  if (config?.authToken) {
    return {
      credential: { type: "token", value: config.authToken },
      source: "config",
    };
  }

  if (config?.apiKey) {
    return {
      credential: { type: "apiKey", value: config.apiKey },
      source: "config",
    };
  }

  return;
}

export async function resolveAuthToken(
  options: ResolveAuthOptions = {}
): Promise<ResolvedAuth> {
  return (
    resolveFrom("flag", options.token) ??
    resolveFrom("env", process.env.DECODO_AUTH_TOKEN) ??
    (await fromConfig()) ?? { credential: undefined, source: "none" }
  );
}
