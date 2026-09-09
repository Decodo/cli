import type { AuthType } from "../types/credential.js";

const PRINTABLE_ASCII = /^[\x20-\x7e]+$/;

export function detectCredentialType(value: string): AuthType {
  const decoded = Buffer.from(value, "base64").toString("utf8");

  if (PRINTABLE_ASCII.test(decoded) && decoded.includes(":")) {
    return "token";
  }

  return "apiKey";
}
