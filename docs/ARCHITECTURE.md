# Architecture

How the Decodo CLI is put together: the request lifecycle, the module boundaries, and
the patterns that keep it consistent. For day-to-day conventions and do's/don'ts, see
[`AGENTS.md`](../AGENTS.md).

## Overview

The CLI is a thin, schema-driven wrapper over the Decodo Web Scraping API. It does not
contain a hardcoded list of scrape targets or their parameters — it loads the API schema
at startup and generates Commander subcommands from it. The runtime work of every scrape
command is the same pipeline (resolve auth → build a request body → call the SDK → render
the response), so most command files only differ in how they assemble the request body.

Stack: TypeScript (ESM), [Commander](https://github.com/tj/commander.js) for the command
tree, [`@decodo/sdk-ts`](https://www.npmjs.com/package/@decodo/sdk-ts) for the schema, the
HTTP client, and typed errors. Node >= 18 (CI on Node 24), pnpm, Biome via `ultracite`.

## Startup and command registration

`src/index.ts` is the entry point (`bin: decodo`). It:

1. Reads the version from `package.json`.
2. Creates the root Commander `program` with global options `-v, --verbose` and `--token`.
3. Calls `createCommands()` (`cli/register.ts`), adds each returned command to the program.
4. Installs custom exit handling via `configureCommanderExit`, then `parseAsync(argv)`.
5. Any uncaught error bubbles to `handleCliError`.

Command assembly is two-layered:

- `cli/register.ts` composes the static commands (`setup`, `reset`, `whoami`) with the
  dynamically generated scrape commands, then sorts them with `sortCommandsByOrder` so
  help output has a stable, curated order (`ROOT_COMMAND_ORDER`).
- `scrape/register.ts` loads the schema once and builds the scrape-family commands:
  `scrape`, `search`, `screenshot`, `targets` (list), plus one generated command per API
  target from `codegen-target-commands.ts`.

## Schema loading

`scrape/services/schema-loader.ts` calls `RemoteSchema.load({ ttlMs })` to fetch and cache
the live API schema. On any failure it logs a warning to stderr and falls back to the
SDK's `BundledSchema.shared`. The resulting `DecodoSchema` is threaded into every command
factory — it is the single source of truth for which targets exist, their parameters,
types, enums, and which field is the "primary" input (URL/query/etc.).

## Command factory pattern

Every command is produced by a `createXCommand(schema)` factory that returns a Commander
`Command`. There are two flavors:

- **Hand-written commands** (`scrape`, `search`, `screenshot`) define their own arguments,
  options, and a custom request-body builder. Example: `scrape.ts` adds `--country`,
  `--headers`, `--target`, then passes a `buildBody` closure to `createTargetAction`.
- **Generated commands** (`codegen-target-commands.ts`) iterate `schema.listTargets()`,
  convert the snake_case target to a kebab-case command name, and let
  `configureTargetCommand` derive arguments and `--flags` directly from the target's
  JSON Schema (`command-builder.ts` maps schema types → Commander options: booleans become
  flags, enums become `.choices()`, integers/numbers get parsers).

Both flavors converge on `createTargetAction`, so adding API capabilities is mostly a
schema concern, not a code concern.

## The scrape request lifecycle

`createTargetAction(target, schema, buildBody?, getOutputContext?)` in
`scrape/services/run-target-scrape.ts` returns the Commander action. On each invocation:

1. Read root options (`--verbose`, `--token`) by walking to the root command
   (`cli/services/global-opts.ts`).
2. `resolveAuthToken({ token })` — precedence is **flag > `DECODO_AUTH_TOKEN` env >
   config file**. No token → throw `AuthRequiredError`.
3. Build the request body: either the command's custom `buildBody` or the default
   `buildScrapeBody`, which maps schema option fields (snake_case) from Commander options
   (camelCase) and applies `applyRequestDefaults`.
4. `verboseLog` the request (auth source, formatted body) to stderr.
5. `executeScrape` creates the SDK client (`client.ts`), calls
   `client.webScrapingApi.scrape(body)`, logs latency, and hands the response to
   `writeScrapeResponse`.
6. Any thrown error is caught and routed to `handleCliError` with a fallback message.

## Output rendering

`output/services/write-scrape-response.ts` is the single dispatch point for turning an SDK
response into terminal output, branching on the output options:

- **PNG / binary** (screenshots) → `writeBinaryOutput` with a derived default filename.
- **NDJSON** → `writeNdjsonResults` (one JSON object per result line, pipe-friendly).
- **Full JSON** → `JSON.stringify` of the whole payload, with `--pretty` indent.
- **Default** → `renderPayload` extracts and prints the relevant content.

Output options are attached uniformly to scrape commands by
`output/commands/attach-output-options.ts`, so every scrape command supports the same
`--output`, `--format`, `--full`, `--pretty` surface. Convention: results go to stdout,
everything diagnostic goes to stderr.

## Error handling and exit codes

Errors are typed, and the type determines the exit code. `platform/constants.ts` defines
the `EXIT` map (`OK`, `ERROR`, `USAGE`, `AUTH`, `VALIDATION`, `RATE_LIMIT`, `TIMEOUT`,
`NETWORK`). `platform/services/handle-cli-error.ts`:

- Maps each known error class (CLI's `AuthRequiredError`/`CliUsageError` and the SDK's
  `AuthenticationError`, `ValidationError`, `RateLimitError`, `TimeoutError`, `DecodoError`)
  to an exit code via `resolveCliExitCode`.
- Prints `Error: <message>` to stderr, expands `ValidationError` details, and adds
  actionable hints (e.g. how to set up auth, to back off on rate limits).
- Re-throws Commander's internal `process.exit:` signal errors untouched so normal
  `--help`/`--version` exits aren't swallowed.

To introduce a new error category: add an `Error` subclass under the module's `errors/`,
then add a branch in `resolveCliExitCode` (and a hint in `handleCliError` if useful).

## Auth and configuration

`auth/services/resolve-token.ts` is the only place that decides which token wins and
reports its `source` (`flag` | `env` | `config` | `none`). Persistent config lives in a
JSON file resolved through `platform/services/paths.ts` (via `env-paths`) and managed by
`auth/services/config.ts` (`readConfig`/`writeConfig`/`clearConfig`). The config file is
written with `0o600` permissions and only persists a validated `authToken`. The `setup`,
`reset`, and `whoami` commands are the user-facing surface over these helpers; `mask.ts`
keeps tokens from being printed in full.

## Testing

`tests/` mirrors `src/` one-to-one. The suite is Vitest. Two recurring techniques:

- **Module isolation** — units are imported with dynamic `import()` after
  `vi.resetModules()` so env vars and module-level state can be controlled per test
  (see `tests/auth/services/resolve-token.test.ts`).
- **Filesystem isolation** — `tests/platform/helpers/config-home.ts` redirects the config
  home so tests never touch the real user config.

`pnpm test` runs `pnpm build` first (`pretest`). CI runs lint → typecheck → build → test.

## Conventions that keep this consistent

- One responsibility per file; small files over multi-purpose ones.
- No code comments — names and structure carry intent.
- Relative imports use `.js` extensions (ESM + Biome `forceJsExtensions`).
- Schema is authoritative: derive targets, parameters, and flags from it rather than
  hardcoding.
- Centralized exit/`process.exit` (only in `handle-cli-error.ts` and
  `configure-commander-exit.ts`) and centralized auth resolution.
