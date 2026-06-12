# Contributing to the Decodo CLI

Conventions and guardrails for humans and AI agents working in this repo. Keep this
file short; the full design narrative lives in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## What this is

An ESM TypeScript CLI (`decodo`) that wraps the Decodo Web Scraping API via
[`@decodo/sdk-ts`](https://www.npmjs.com/package/@decodo/sdk-ts). It turns each API
scrape target into a subcommand and adds shell-native output modes. Built with
[Commander](https://github.com/tj/commander.js), bundled as ESM, run on Node >= 18
(developed and CI-tested on Node 24).

## Project layout

`src/` is split into feature modules. Each module owns one concern and follows the
same internal shape:

```
src/<module>/
  commands/    Commander command factories (createXCommand) and option wiring
  services/    Pure logic, IO, SDK calls — one responsibility per file
  types/       Shared TypeScript types/interfaces for the module
  errors/      Custom Error subclasses
  constants.ts Module-level constant values
```

Modules:

- `cli/` — root command registration, ordering, global options, verbose logging
- `auth/` — token resolution (flag > env > config file), setup/reset/whoami commands
- `scrape/` — scrape/search/screenshot commands, schema loading, request building, the SDK client
- `output/` — output format handling (text, JSON, NDJSON, PNG), request defaults
- `platform/` — OS-level concerns: config paths, file/binary writes, hidden prompts, central error handler

## Where new code goes

- **New scrape target** — nothing to do; targets are generated from the API schema at
  runtime in `scrape/commands/codegen-target-commands.ts`. Don't hand-write a command per target.
- **New top-level command** — add a `createXCommand` factory under the owning module's
  `commands/`, register it in `cli/register.ts` (or `scrape/register.ts`), and add its
  name to `ROOT_COMMAND_ORDER` in `cli/services/sort-commands-by-order.ts`.
- **New reusable logic** — a new single-purpose file in the relevant `services/`.
- **New error type** — subclass `Error` in the module's `errors/`, then map it to an
  exit code in `platform/services/handle-cli-error.ts`.

## Do

- Keep each file to one responsibility; prefer small files over multi-purpose ones.
- Write self-explanatory code — **no comments** (names and structure carry intent).
- Use `.js` extensions on all relative imports (ESM + `forceJsExtensions` lint rule).
- Throw typed errors (`ValidationError`, `AuthRequiredError`, SDK errors) and let
  `handleCliError` render them and pick the exit code — see `EXIT` in `platform/constants.ts`.
- Write user-facing output to stdout; write logs, warnings, and verbose lines to stderr
  (use `verboseLog`). The CLI must stay pipe-friendly.
- Add a mirrored test under `tests/` for every new `src/` file (see Testing).

## Don't

- Don't add comments or leave commented-out code.
- Don't hardcode scrape targets, parameters, or option flags — derive them from the schema.
- Don't `console.log` for diagnostics or `process.exit` outside `handle-cli-error.ts` /
  `configure-commander-exit.ts`.
- Don't read or write `~/.config` paths directly — go through `platform/services/paths.ts`
  and the `auth/services/config.ts` helpers (config is written `0o600`).
- Don't omit the `.js` import extension (lint will fail).

## Testing

- Tests live in `tests/` and **mirror `src/` 1:1** (`src/auth/services/config.ts` →
  `tests/auth/services/config.test.ts`).
- Use Vitest. Import the unit under test with a dynamic `import()` after `vi.resetModules()`
  when module state or env matters (see `tests/auth/services/resolve-token.test.ts`).
- Isolate filesystem/config side effects with the helper in `tests/platform/helpers/`.

## Commands

```bash
pnpm build      # tsc -> build/esm
pnpm typecheck  # tsc --noEmit
pnpm lint       # ultracite check (Biome)
pnpm fix        # ultracite fix
pnpm test       # vitest run (runs pnpm build first)
```

CI runs lint, typecheck, build, and test on every PR — all four must pass.
