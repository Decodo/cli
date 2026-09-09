export type AuthType = "token" | "apiKey";

export interface AuthCredential {
  type: AuthType;
  value: string;
}
