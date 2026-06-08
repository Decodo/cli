import { readConfig } from "./config.js";

export type AuthSource = "flag" | "env" | "config" | "none";

export interface ResolvedAuth {
  source: AuthSource;
  token: string | undefined;
}

export interface ResolveAuthOptions {
  token?: string;
}

export async function resolveAuthToken(
  options: ResolveAuthOptions = {}
): Promise<ResolvedAuth> {
  if (options.token) {
    return { token: options.token, source: "flag" };
  }

  const envToken = process.env.DECODO_AUTH_TOKEN;

  if (envToken) {
    return { token: envToken, source: "env" };
  }

  const config = await readConfig();

  if (config?.authToken) {
    return { token: config.authToken, source: "config" };
  }

  return { token: undefined, source: "none" };
}
