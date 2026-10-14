import { describe, expect, it } from "vitest";
import { API_KEY_REQUIRED_MESSAGE } from "../../../src/auth/constants.js";
import { ApiKeyRequiredError } from "../../../src/auth/errors/api-key-required-error.js";

describe("ApiKeyRequiredError", () => {
  it("defaults to the API key message", () => {
    const err = new ApiKeyRequiredError();
    expect(err.message).toBe(API_KEY_REQUIRED_MESSAGE);
    expect(err.name).toBe("ApiKeyRequiredError");
  });
});
