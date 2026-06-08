import { BundledSchema } from "@decodo/sdk-ts";
import { describe, expect, it } from "vitest";
import { resolveTargetGroup } from "../../../src/scrape/services/resolve-target-group.js";

describe("resolveTargetGroup", () => {
  const schema = BundledSchema.shared;

  it("returns the schema group when present", () => {
    expect(resolveTargetGroup(schema, "google_search")).toBe("Google");
  });

  it("infers YouTube for youtube_video when schema group is None", () => {
    expect(schema.getTargetMeta("youtube_video")?.group).toBe("None");
    expect(resolveTargetGroup(schema, "youtube_video")).toBe("YouTube");
  });

  it("infers Universal for universal_ecommerce when schema group is None", () => {
    expect(schema.getTargetMeta("universal_ecommerce")?.group).toBe("None");
    expect(resolveTargetGroup(schema, "universal_ecommerce")).toBe("Universal");
  });
});
