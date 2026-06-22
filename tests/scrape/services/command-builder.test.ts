import { BundledSchema } from "@decodo/sdk-ts";
import { Command } from "commander";
import { describe, expect, it } from "vitest";
import {
  buildScrapeBody,
  configureTargetCommand,
} from "../../../src/scrape/services/command-builder.js";
import { snakeToCamel } from "../../../src/scrape/services/naming.js";

const schema = BundledSchema.shared;

const INVALID_JSON_FLAG_ERROR = /--headers expects valid JSON/;

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

  it("registers a --no-<flag> negation alongside boolean options", () => {
    const command = new Command("universal");
    configureTargetCommand(command, "universal", schema);

    expect(command.options.some((opt) => opt.long === "--markdown")).toBe(true);
    expect(command.options.some((opt) => opt.long === "--no-markdown")).toBe(
      true
    );
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
      config,
      schema
    );

    expect(body).toEqual({
      target: "google_search",
      query: "coffee",
      page_from: 2,
      parse: true,
      markdown: false,
    });
  });

  it("sets parse defaults when schema has parse and flags are omitted", () => {
    const config = configureTargetCommand(
      new Command("google-search"),
      "google_search",
      schema
    );
    const body = buildScrapeBody("google_search", "coffee", {}, config, schema);

    expect(body).toEqual({
      target: "google_search",
      query: "coffee",
      parse: true,
      markdown: false,
    });
  });

  it("registers object/array flags with a JSON-parsing argParser", () => {
    const command = new Command("universal");
    command.exitOverride();
    configureTargetCommand(command, "universal", schema);
    command.action(() => undefined);

    const headersOption = command.options.find(
      (opt) => opt.long === "--headers"
    );
    expect(headersOption?.flags).toContain("<json>");

    command.parse(
      [
        "https://example.com",
        "--headers",
        '{"X-Test":"1"}',
        "--successful-status-codes",
        "[200,204]",
      ],
      { from: "user" }
    );

    const opts = command.opts();
    expect(opts.headers).toEqual({ "X-Test": "1" });
    expect(opts.successfulStatusCodes).toEqual([200, 204]);
  });

  it("rejects invalid JSON for object/array flags as a usage error", () => {
    const command = new Command("universal");
    command.exitOverride();
    configureTargetCommand(command, "universal", schema);
    command.action(() => undefined);

    expect(() =>
      command.parse(["https://example.com", "--headers", "not-json"], {
        from: "user",
      })
    ).toThrow(INVALID_JSON_FLAG_ERROR);
  });

  it("does not override explicit parse: false from options", () => {
    const config = configureTargetCommand(
      new Command("google-search"),
      "google_search",
      schema
    );
    const body = buildScrapeBody(
      "google_search",
      "coffee",
      { parse: false },
      config,
      schema
    );

    expect(body).toEqual({
      target: "google_search",
      query: "coffee",
      parse: false,
      markdown: false,
    });
  });

  it("lets --no-markdown send markdown: false for universal", () => {
    const command = new Command("universal");
    command.exitOverride();
    const config = configureTargetCommand(command, "universal", schema);
    command.action(() => undefined);

    command.parse(["https://example.com", "--no-markdown"], { from: "user" });
    expect(command.opts().markdown).toBe(false);

    const body = buildScrapeBody(
      "universal",
      "https://example.com",
      command.opts(),
      config,
      schema
    );
    expect(body.markdown).toBe(false);
  });

  it("keeps the markdown default when the flag is omitted for universal", () => {
    const command = new Command("universal");
    command.exitOverride();
    const config = configureTargetCommand(command, "universal", schema);
    command.action(() => undefined);

    command.parse(["https://example.com"], { from: "user" });
    expect(command.opts().markdown).toBeUndefined();

    const body = buildScrapeBody(
      "universal",
      "https://example.com",
      command.opts(),
      config,
      schema
    );
    expect(body.markdown).toBe(true);
  });
});
