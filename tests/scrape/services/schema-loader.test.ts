import { BundledSchema, RemoteSchema } from "@decodo/sdk-ts";
import { afterEach, describe, expect, it, vi } from "vitest";
import { loadSchema } from "../../../src/scrape/services/schema-loader.js";

vi.mock("@decodo/sdk-ts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@decodo/sdk-ts")>();
  return {
    ...actual,
    RemoteSchema: {
      load: vi.fn(),
    },
  };
});

describe("loadSchema", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.mocked(RemoteSchema.load).mockReset();
  });

  it("returns remote schema on success", async () => {
    const remoteSchema = { version: "2.0.1" } as Awaited<
      ReturnType<typeof RemoteSchema.load>
    >;
    vi.mocked(RemoteSchema.load).mockResolvedValue(remoteSchema);

    const result = await loadSchema();

    expect(result).toBe(remoteSchema);
  });

  it("falls back to bundled schema when remote load fails", async () => {
    const stderr = vi.spyOn(console, "error").mockImplementation(vi.fn());
    vi.mocked(RemoteSchema.load).mockRejectedValue(new Error("network down"));

    const result = await loadSchema();

    expect(result).toBe(BundledSchema.shared);
    expect(stderr).toHaveBeenCalledWith(
      expect.stringContaining("failed to load remote schema")
    );
  });
});
