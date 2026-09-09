import { describe, expect, it } from "vitest";
import { detectCredentialType } from "../../../src/auth/services/detect-credential-type.js";

const BASIC_TOKEN = "VTAwMDAwMDAwMDA6UFdfZXhhbXBsZXNlY3JldA==";
const API_KEY =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

describe("detectCredentialType", () => {
  it("detects a base64 user:password token as a basic auth token", () => {
    expect(detectCredentialType(BASIC_TOKEN)).toBe("token");
  });

  it("detects a 64-character hex string as an api key", () => {
    expect(detectCredentialType(API_KEY)).toBe("apiKey");
  });

  it("treats a value that decodes without a colon as an api key", () => {
    const noColon = Buffer.from("nocolonhere").toString("base64");
    expect(detectCredentialType(noColon)).toBe("apiKey");
  });

  it("treats a non-base64 value as an api key", () => {
    expect(detectCredentialType("not base64 at all!!")).toBe("apiKey");
  });

  it("keeps a token with a colon inside the password as a basic token", () => {
    const nested = Buffer.from("user:pa:ss").toString("base64");
    expect(detectCredentialType(nested)).toBe("token");
  });
});
