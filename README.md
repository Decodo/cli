# @decodo/cli

Official command-line interface for the Decodo APIs.

## Development setup (temporary)

Until `@decodo/sdk-ts` is published to npm, the CLI depends on a **sibling checkout** of [Decodo/sdk-ts](https://github.com/Decodo/sdk-ts). CI does the same thing.

### Prerequisites

- Node.js 18+ (24 recommended)
- [pnpm](https://pnpm.io/) 10.x (`corepack enable` if needed)

### Repo layout

Clone both repos next to each other:

```text
your-workspace/
  cli/      # this repo
  sdk-ts/   # https://github.com/Decodo/sdk-ts
```

### Install and build

```bash
cd cli
pnpm install
pnpm build
```

`pnpm build` and `pnpm test` build `../sdk-ts` automatically via `prebuild` / `pretest`. If you only change the SDK, rebuild it once:

```bash
pnpm run build:sdk-ts
```

### Run locally

From `cli/`:

```bash
node build/esm/index.js --help
node build/esm/index.js targets
```

Or link the binary globally:

```bash
pnpm link --global
decodo --help
```

### Auth

Configure a Basic auth token (from the [playground](https://dashboard.decodo.com/playground)):

```bash
decodo setup
# or
export DECODO_AUTH_TOKEN='your-token'
decodo whoami
```

### Try scrape commands

List targets, inspect help, then run a scrape (examples):

```bash
decodo targets
decodo scrape https://ip.decodo.com
decodo https://ip.decodo.com
decodo search "decodo scraping api"
decodo search "shoes" --engine bing --geo us --limit 2
decodo screenshot https://ip.decodo.com -o shot.png
decodo screenshot https://ip.decodo.com -o ./shots
decodo screenshot https://ip.decodo.com > shot.png
decodo universal --help
decodo universal https://ip.decodo.com
decodo google-search "decodo scraping api"
decodo scrape https://ip.decodo.com/json
decodo google-search "query" --parse
decodo google-search "query" --full
```

By default, commands print the first result's `content` (parsed JSON when the target supports `parse`, markdown for `decodo scrape`). Use `--full` for the complete API envelope, `-o` to write to a file, and `--pretty` for indented JSON. Request shape (`--parse`, `--markdown`, and other API flags) comes from the schema on each target command; use `decodo universal` for full universal options.

### Tests and checks

```bash
pnpm lint
pnpm typecheck
pnpm test
```
