import { BundledSchema } from "@decodo/sdk-ts";
import { Command } from "commander";
import { describe, expect, it } from "vitest";
import {
  buildScrapeBody,
  configureTargetCommand,
} from "../../../src/scrape/services/command-builder.js";
import { snakeToCamel } from "../../../src/scrape/services/naming.js";

const schema = BundledSchema.shared;

describe("configureTargetCommand", () => {
  it("adds a required input argument for google_search", () => {
    const command = new Command("google-search");
    const config = configureTargetCommand(command, "google_search", schema);

    expect(config.primaryField).toBe("query");
    expect(command.registeredArguments).toHaveLength(1);
    expect(command.registeredArguments[0]?.required).toBe(true);
    expect(command.options.some((opt) => opt.long?.includes("headless"))).toBe(
      true
    );
    expect(command.options.some((opt) => opt.long === "--query")).toBe(false);
  });

  it("does not add input for universal_ecommerce", () => {
    const command = new Command("universal-ecommerce");
    const config = configureTargetCommand(
      command,
      "universal_ecommerce",
      schema
    );

    expect(config.primaryField).toBeUndefined();
    expect(command.registeredArguments).toHaveLength(0);
  });

  it("registers walmart_product with product_id input", () => {
    const command = new Command("walmart-product");
    const config = configureTargetCommand(command, "walmart_product", schema);

    expect(config.primaryField).toBe("product_id");
    expect(command.registeredArguments).toHaveLength(1);
  });
});

describe("buildScrapeBody", () => {
  it("maps commander camelCase options to snake_case body fields", () => {
    const config = configureTargetCommand(
      new Command("google-search"),
      "google_search",
      schema
    );
    const body = buildScrapeBody(
      "google_search",
      "coffee",
      {
        [snakeToCamel("page_from")]: 2,
        parse: true,
      },
      config
    );

    expect(body).toEqual({
      target: "google_search",
      query: "coffee",
      page_from: 2,
      parse: true,
    });
  });
});
