import type { DecodoSchema } from "@decodo/sdk-ts";
import { describe, expect, it } from "vitest";
import { resolveTargetGroup } from "../../../src/scrape/services/target-group.js";

function schemaWithGroup(group: string | undefined): DecodoSchema {
  return {
    getTargetMeta: () => (group === undefined ? undefined : { group }),
  } as unknown as DecodoSchema;
}

describe("resolveTargetGroup", () => {
  it("returns the group when it is a real value", () => {
    expect(
      resolveTargetGroup(schemaWithGroup("Amazon"), "amazon_product")
    ).toBe("Amazon");
  });

  it.each([
    "None",
    "",
    undefined,
  ])("returns undefined for the %p sentinel group", (group) => {
    expect(
      resolveTargetGroup(schemaWithGroup(group), "youtube_video")
    ).toBeUndefined();
  });
});
