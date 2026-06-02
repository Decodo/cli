import { BundledSchema, RemoteSchema } from "@decodo/sdk-ts";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  loadSchema,
  warnIfSpecNewer,
} from "../../../src/scrape/services/schema-loader.js";

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

    expect(result).toEqual({ schema: remoteSchema, source: "remote" });
  });

  it("falls back to bundled schema when remote load fails", async () => {
    const stderr = vi.spyOn(console, "error").mockImplementation(vi.fn());
    vi.mocked(RemoteSchema.load).mockRejectedValue(new Error("network down"));

    const result = await loadSchema();

    expect(result.schema).toBe(BundledSchema.shared);
    expect(result.source).toBe("bundled");
    expect(stderr).toHaveBeenCalledWith(
      expect.stringContaining("failed to load remote schema")
    );
  });
});

describe("warnIfSpecNewer", () => {
  it("warns when remote schema version is newer than bundled", () => {
    const stderr = vi.spyOn(console, "error").mockImplementation(vi.fn());

    warnIfSpecNewer({ version: "3.0.0" } as never);

    expect(stderr).toHaveBeenCalledWith(
      expect.stringContaining("remote schema v3.0.0 is newer than bundled")
    );
  });

  it("warns for pre-release versions newer than bundled", () => {
    const stderr = vi.spyOn(console, "error").mockImplementation(vi.fn());

    warnIfSpecNewer({ version: "2.0.2-alpha" } as never);

    expect(stderr).toHaveBeenCalledWith(
      expect.stringContaining(
        "remote schema v2.0.2-alpha is newer than bundled"
      )
    );
  });

  it("does not warn when schema has no version", () => {
    const stderr = vi.spyOn(console, "error").mockImplementation(vi.fn());

    warnIfSpecNewer(BundledSchema.shared);

    expect(stderr).not.toHaveBeenCalled();
  });
});
