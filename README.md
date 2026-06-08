# @decodo/cli

Official command-line interface for the Decodo APIs.

## Development setup

### Prerequisites

- Node.js 18+ (24 recommended)
- [pnpm](https://pnpm.io/) 10.x (`corepack enable` if needed)

### Install and build

```bash
pnpm install
pnpm build
```

### Run locally

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
decodo screenshot https://ip.decodo.com -o shot.png
decodo screenshot https://ip.decodo.com -o ./shots
decodo screenshot https://ip.decodo.com > shot.png
decodo universal --help
decodo universal https://ip.decodo.com
decodo google-search "decodo scraping api"
decodo scrape https://ip.decodo.com/json
decodo google-search "query" --parse
decodo google-search "query" --full
decodo google-search "query" --format ndjson --full
```

By default, commands print the first result's `content` (parsed JSON when the target supports `parse`, markdown for `decodo scrape`). Use `--full` for the complete API envelope, `--format ndjson` for one JSON object per result (pipe-friendly), `-o` to write to a file, and `--pretty` for indented JSON. Request shape (`--parse`, `--markdown`, and other API flags) comes from the schema on each target command; use `decodo universal` for full universal options.

### Tests and checks

```bash
pnpm lint
pnpm typecheck
pnpm test
```
