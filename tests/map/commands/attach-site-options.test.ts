import { Command } from "commander";
import { describe, expect, it } from "vitest";
import { attachSiteOptions } from "../../../src/map/commands/attach-site-options.js";

describe("attachSiteOptions", () => {
  it("parses shared site flags", () => {
    const command = attachSiteOptions(new Command("probe")).exitOverride();

    command.parse(
      [
        "--limit",
        "3",
        "--sitemap",
        "skip",
        "--domain-filter",
        "domain",
        "--geo",
        "us",
        "--locale",
        "en-US",
        "--exclude-paths",
        "/a/*",
        "--exclude-paths",
        "/b/*",
      ],
      { from: "user" }
    );

    expect(command.opts()).toEqual({
      limit: 3,
      sitemap: "skip",
      domainFilter: "domain",
      geo: "us",
      locale: "en-US",
      excludePaths: ["/a/*", "/b/*"],
    });
  });

  it("rejects unknown sitemap modes", () => {
    const command = attachSiteOptions(new Command("probe"))
      .exitOverride()
      .configureOutput({ writeErr: () => undefined });

    expect(() =>
      command.parse(["--sitemap", "always"], { from: "user" })
    ).toThrow();
  });
});
