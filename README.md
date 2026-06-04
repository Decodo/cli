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
decodo search "decodo scraping api"
decodo search "shoes" --engine bing --geo us --limit 2
decodo universal --help
decodo universal https://ip.decodo.com
decodo google-search "decodo scraping api"
```

Responses are printed as JSON on stdout.

### Tests and checks

```bash
pnpm lint
pnpm typecheck
pnpm test
```
