import type { SiteOptions } from "../types/site-options.js";

export function buildSiteRequest(
  url: string,
  options: SiteOptions
): Record<string, unknown> & { url: string } {
  const fields: Record<string, unknown> = {
    limit: options.limit,
    sitemap: options.sitemap,
    domain_filter: options.domainFilter,
    geo: options.geo,
    locale: options.locale,
    select_paths: options.selectPaths,
    exclude_paths: options.excludePaths,
  };

  return {
    url,
    ...Object.fromEntries(
      Object.entries(fields).filter(([, value]) => value !== undefined)
    ),
  };
}
