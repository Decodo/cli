import type { SyncResponse } from "@decodo/sdk-ts";
import { ValidationError } from "@decodo/sdk-ts";
import { describe, expect, it } from "vitest";
import { extractPayload } from "../../../src/output/services/extract-payload.js";

describe("extractPayload", () => {
  const response: SyncResponse = {
    results: [{ content: { ok: true } }],
  } as SyncResponse;

  it("returns full response when --full", () => {
    expect(extractPayload(response, true)).toEqual(response);
  });

  it("returns first result content by default", () => {
    expect(extractPayload(response, false)).toEqual({ ok: true });
  });

  it("throws when results are empty", () => {
    expect(() =>
      extractPayload({ results: [] } as SyncResponse, false)
    ).toThrow(ValidationError);
  });
});
