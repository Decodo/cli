# Decodo CLI

[![](https://dcbadge.limes.pink/api/server/https://discord.gg/Ja8dqKgvbZ)](https://discord.gg/Ja8dqKgvbZ)
[![npm version](https://img.shields.io/npm/v/@decodo/cli)](https://www.npmjs.com/package/@decodo/cli)

<p align="center">
<a href="https://dashboard.decodo.com/integrations?utm_source=github&utm_medium=social&utm_campaign=cli"> <img src="https://github.com/user-attachments/assets/a1e52a9e-3da1-4081-b3c6-053aafb8f196"/></a>
</p>

Scrape websites, search engines, eCommerce platforms, and social media from your terminal or shell
scripts. The Decodo CLI connects you to the [Decodo Web Scraping API](https://decodo.com) without
building proxy rotation, parsers, or retry logic from scratch.

- Structured outputs in JSON, Markdown, NDJSON, and screenshots
- Server-side JavaScript rendering and anti-bot handling
- 125M+ IPs across 195+ locations
- Pipe-friendly for `jq`, CI, and coding agents

## What is the Decodo CLI?

The Decodo CLI is a command-line interface for the Decodo Web Scraping API. It wraps every API
target as a subcommand and adds shell-native output modes for scripting, automation, and agent
workflows.

Instead of maintaining scraping infrastructure, you get a single binary for reliable web data access
from the terminal.

## Why use the CLI?

Use the CLI when you need web scraping outside an IDE or MCP client:

- **Scripts and CI** — run scrapes in pipelines, cron jobs, and GitHub Actions
- **Shell pipelines** — pipe results to `jq`, `grep`, or custom tools
- **Coding agents** — invoke scraping as a subprocess (Cursor, Claude Code, Codex, Windsurf)
- **Quick terminal access** — one command to scrape, search, or screenshot

For MCP-based scraping inside an IDE, see the [Decodo MCP server](https://github.com/Decodo/mcp-server).
The CLI is the right tool when you need direct shell access or scripting.

## Key features

**Web scraping from the terminal, no infrastructure required.** Scrape any website, including
JavaScript-heavy pages, without handling proxy rotation, CAPTCHA solving, or anti-bot systems.

**Structured outputs for automation.** Markdown (human-readable), JSON and NDJSON (pipe-friendly),
and PNG screenshots — built for scripts, data pipelines, and agent subprocess calls.

**Built-in support for popular targets.** Tier-1 commands for scrape, search, and screenshot, plus
schema-driven subcommands for Google and Bing, Amazon, Walmart, and Target, Reddit, TikTok, and
YouTube, and more. Run `decodo targets` to list everything available.

**Global proxy infrastructure.** 125M+ residential IPs, 195+ geo-locations, and a 99.99% success
rate on even the most protected targets — all via the Decodo API.

**Pipe-friendly by design.** Compact JSON when piped, human-readable output in a TTY, and explicit
exit codes for auth, validation, rate limits, and API errors.

**Fast time to value.** From API token to first scrape in minutes — install with one command or
use `npx` with zero setup.

## Use cases

Use the Decodo CLI when you need web scraping from the shell, structured data extraction in
automation, reliable access to dynamic websites, or an alternative to building scraping
infrastructure from scratch. Common scenarios:

- **Shell scripts and CI** — scrape or search in pipelines without embedding SDK logic
- **Data pipelines** — stream NDJSON results into `jq`, databases, or downstream tools
- **Coding agent subprocesses** — let agents call `decodo search` or `decodo scrape` directly
- **eCommerce intelligence** — query Amazon, Walmart, and Target targets from the terminal
- **Social media data collection** — gather posts and metadata from Reddit, TikTok, and YouTube
- **Quick research** — search the web or capture screenshots without leaving the terminal

## Quick start

1. **Create a free account** at [dashboard.decodo.com](https://dashboard.decodo.com/) — up to 2K
   free requests, no credit card required.
2. **Get your API key.** Obtain a Web Scraping API basic authentication token from the
   [playground](https://dashboard.decodo.com/playground).
3. **Install Node.js 18+** from [nodejs.org](https://nodejs.org/) (required for npm/npx installs).
4. **Install the CLI** (pick one method below).
5. **Configure auth** and run your first scrape:

```bash
decodo setup
decodo scrape https://ip.decodo.com
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

## Test your setup

Once installed and authenticated, try:

```bash
decodo scrape https://ip.decodo.com
decodo google-search "top articles hacker news" --limit 5 --parse
```

You should see markdown or parsed JSON within seconds. If you see an auth error, double-check your
token from the dashboard.

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

## Examples

### Pipe-friendly workflows

```bash
# Search and extract titles
decodo google-search "rust web scraping" --limit 3 --parse | jq '.[].title'

# Scrape JSON API endpoint
decodo scrape https://ip.decodo.com/json | jq '.ip'

# Screenshot to file, then open
decodo screenshot https://example.com -o shot.png
```

### Scraping geo-restricted content

```bash
# Request from a specific country
decodo scrape https://example.com --country us
decodo search "shoes" --geo de
decodo google-search "shoes" --geo de --parse
```

Use `decodo <target> --help` for all geo, locale, and target-specific options from the API schema.

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

<details>

### Prerequisites

- Node.js 18+ (24 recommended)
- [pnpm](https://pnpm.io/) 10.x (`corepack enable` if needed)

### Install and build

```bash
git clone https://github.com/Decodo/cli
cd cli
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

</details>

## Related repositories

[Web Scraping API](https://github.com/Decodo/Web-Scraping-API),
[Decodo MCP server](https://github.com/Decodo/mcp-server),
[Decodo OpenClaw skill](https://github.com/Decodo/decodo-openclaw-skill)

## Try it

Install the CLI and start scraping from your terminal in minutes.

[Start for free](https://dashboard.decodo.com/) | [Docs](https://help.decodo.com/docs/introduction)
| [Discord](https://discord.gg/Ja8dqKgvbZ)

## License

All code is released under the [MIT License](https://github.com/Decodo/Decodo/blob/master/LICENSE).
