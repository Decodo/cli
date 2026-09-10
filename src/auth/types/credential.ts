import type { AUTH_TYPE } from "../constants.js";

export type AuthType = (typeof AUTH_TYPE)[keyof typeof AUTH_TYPE];

export interface AuthCredential {
  type: AuthType;
  value: string;
}
