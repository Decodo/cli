import { describe, expect, it } from "vitest";
import { buildSiteRequest } from "../../../src/map/services/build-site-request.js";

describe("buildSiteRequest", () => {
  it("maps options to snake_case request fields", () => {
    expect(
      buildSiteRequest("https://example.com", {
        limit: 10,
        sitemap: "skip",
        domainFilter: "subdomain",
        geo: "us",
        locale: "en-US",
        selectPaths: ["/blog/*"],
        excludePaths: ["/tag/*"],
      })
    ).toEqual({
      url: "https://example.com",
      limit: 10,
      sitemap: "skip",
      domain_filter: "subdomain",
      geo: "us",
      locale: "en-US",
      select_paths: ["/blog/*"],
      exclude_paths: ["/tag/*"],
    });
  });

  it("omits unset options", () => {
    expect(buildSiteRequest("https://example.com", {})).toEqual({
      url: "https://example.com",
    });
  });
});
