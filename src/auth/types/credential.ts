export type AuthType = "token" | "apiKey";

export interface AuthCredential {
  kind: AuthType;
  value: string;
}
