# @decodo/cli

Official command-line interface for the [Decodo](https://decodo.com) Web Scraping API.

## Quickstart

```bash
# Install (pick one method below), then configure auth
decodo setup

# Scrape a page
decodo scrape https://ip.decodo.com

# Search the web
decodo search "decodo scraping api"
```

## Installation

> **Requires [Node.js](https://nodejs.org/) 18+**

### macOS / Linux (recommended)

```bash
curl -fsSL https://decodo.github.io/cli/install.sh | sh
```

### Windows (PowerShell)

```powershell
irm https://decodo.github.io/cli/install.ps1 | iex
```

### npm (any platform)

```bash
npm install -g @decodo/cli
```

### Run without installing

```bash
npx @decodo/cli --version
npx @decodo/cli scrape https://ip.decodo.com --token "$DECODO_AUTH_TOKEN"
```

IDE one-click install: see [docs/ide-deeplinks.md](docs/ide-deeplinks.md) (added in a follow-up PR).

## Authentication

Get a Basic auth token from the [Decodo playground](https://dashboard.decodo.com/playground).

```bash
# Interactive — saves token to config
decodo setup

# Environment variable — no saved config required
export DECODO_AUTH_TOKEN='your-token'

# Per-command override
decodo whoami --token 'your-token'
```

**Precedence:** `--token` flag → `DECODO_AUTH_TOKEN` env var → saved config (`decodo setup`).

```bash
decodo whoami   # shows token source (flag / env / config)
decodo reset    # clear saved config
```

## Commands

### Tier-1 commands

| Command | Description |
| --- | --- |
| `decodo scrape <url>` | Scrape a URL (markdown by default) |
| `decodo search <query>` | Web search (`--engine google\|bing`, `--geo`, `--limit`) |
| `decodo screenshot <url>` | Capture a PNG screenshot (`-o` file or directory) |
| `decodo targets` | List all scrape targets by group |
| `decodo setup` | Save auth token interactively |
| `decodo whoami` | Show configured auth source |
| `decodo reset` | Remove saved auth config |

### Schema-driven target commands

Every API target is also available as its own subcommand (kebab-case name from `decodo targets`):

```bash
decodo google-search "decodo scraping api"
decodo universal https://ip.decodo.com
decodo universal --help
```

Use `decodo <target> --help` for target-specific flags (`--parse`, `--geo`, and others from the schema).

## Output modes

By default, scrape commands print the first result's `content` (parsed JSON when the target supports `--parse`, markdown for `decodo scrape`).

| Flag | Effect |
| --- | --- |
| `--full` | Print the full API response envelope |
| `--format ndjson` | One JSON object per result (pipe-friendly) |
| `--pretty` | Indented JSON on stdout |
| `-o, --output <path>` | Write to a file instead of stdout |
| `-v, --verbose` | Print debug logs to stderr |

**TTY vs pipe:** When stdout is a terminal, human-readable output is used where possible. When piped or redirected, raw bytes or compact JSON is written. Screenshot output must go to `-o` or a redirect — writing binary PNG to a TTY is rejected.

```bash
# Parsed JSON from Google Search
decodo google-search "query" --parse

# Full envelope, pretty-printed
decodo google-search "query" --full --pretty

# NDJSON stream for jq / agents
decodo google-search "query" --format ndjson --full | jq -c '.results[]'
```

## Pipe-friendly examples

```bash
# Search and extract titles
decodo search "rust web scraping" --limit 3 --parse | jq '.[].title'

# Scrape JSON API endpoint
decodo scrape https://ip.decodo.com/json | jq '.ip'

# Screenshot to file, then open
decodo screenshot https://example.com -o shot.png
```

## Agent tooling

Coding agents (Cursor, Claude Code, Codex, Gemini CLI, Windsurf) should invoke the CLI as a **shell subprocess**, not embed scraping logic.

**Recommended patterns:**

```bash
# Zero-install (good for CI and ephemeral agents)
npx --yes @decodo/cli search "topic" --token "$DECODO_AUTH_TOKEN"

# Global install (faster repeat calls)
decodo search "topic"
decodo scrape https://example.com --full --format ndjson
```

**Guidelines for agents:**

1. Require `DECODO_AUTH_TOKEN` or run `decodo setup` before scraping.
2. Prefer `--format ndjson --full` when parsing multiple results programmatically.
3. Use `decodo targets` to discover available target commands.
4. Use `decodo <target> --help` for schema-accurate flags.
5. Check exit codes (below) to distinguish auth, usage, and API errors.

For MCP-based scraping inside an IDE, see the [Decodo MCP server](https://github.com/Decodo/mcp-server). The CLI is the right tool when agents need direct shell access or scripting.

## Environment variables

| Variable | Description |
| --- | --- |
| `DECODO_AUTH_TOKEN` | Basic auth token (overrides saved config, below `--token`) |
| `DECODO_CONFIG_HOME` | Override config directory (default: OS-specific `env-paths` location) |

## Exit codes

| Code | Meaning |
| --- | --- |
| `0` | Success |
| `1` | General error |
| `2` | Usage error (invalid flags, missing args) |
| `3` | Authentication error (missing or invalid token) |
| `4` | Validation error (invalid request parameters) |
| `5` | Rate limit |
| `6` | Timeout |
| `7` | API / network error |

## Troubleshooting

**`No auth token found`**

Run `decodo setup` or export `DECODO_AUTH_TOKEN`.

**`command not found: decodo`**

Ensure npm's global bin directory is on your `PATH` after `npm install -g`. Re-run the [install script](https://decodo.github.io/cli/install.sh) or use `npx @decodo/cli`.

**Validation / API errors**

Read the `Error:` message on stderr. Use `--full` to inspect the raw API response.

**Screenshot TTY error**

Use `-o shot.png` or redirect: `decodo screenshot <url> > shot.png`.

## Development

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
pnpm link --global && decodo --help
```

### Tests and checks

```bash
pnpm lint
pnpm typecheck
pnpm test
```
