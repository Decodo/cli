# Decodo CLI

[![](https://dcbadge.limes.pink/api/server/https://discord.gg/Ja8dqKgvbZ)](https://discord.gg/Ja8dqKgvbZ)
[![npm version](https://img.shields.io/npm/v/@decodo/cli)](https://www.npmjs.com/package/@decodo/cli)

<p align="center">
<a href="https://dashboard.decodo.com/integrations?utm_source=github&utm_medium=social&utm_campaign=cli"> <img src="https://github.com/user-attachments/assets/a1e52a9e-3da1-4081-b3c6-053aafb8f196"/></a>
</p>

A web scraping CLI for the [Decodo Web Scraping API](https://decodo.com/scraping/web).

Scrape websites, search engines, eCommerce platforms, and social media from your terminal without building proxy rotation, JavaScript rendering, anti-bot bypass, or CAPTCHA solving from scratch.

Get data in JSON, NDJSON, Markdown, or PNG screenshots for shell scripts, CI/CD pipelines, data pipelines, and AI coding agents.

- Structured output in JSON, Markdown, NDJSON, and screenshots
- Server-side JavaScript rendering, anti-bot bypass, and CAPTCHA handling
- 115M+ residential IPs across 195+ locations
- Pipe-friendly for `jq`, CI, and coding agents

## What is the Decodo CLI?

The Decodo CLI is a web scraping CLI and command-line scraper for the Decodo Web Scraping API.

It wraps every API target as a subcommand and provides shell-native output modes for structured data extraction, scripting, shell automation, and AI agent workflows.

Instead of maintaining scraping infrastructure, you get a single binary for reliable web data access from the terminal.

## Why use the CLI?

Use the CLI when you need web scraping outside an IDE or MCP client:

- **Scripts and CI/CD**. Run scrapes in shell scripts, cron jobs, GitHub Actions, and CI/CD pipelines.
- **Shell pipelines**. Pipe JSON or NDJSON output to `jq`, `grep`, databases, or custom tools.
- **Coding agents**. Invoke scraping as a subprocess from Cursor, Claude Code, Codex, Gemini CLI, or Windsurf.
- **Quick terminal access**. Scrape websites, search the web, or capture screenshots with a single command.

For MCP-based scraping inside an IDE, see the [Decodo MCP server for IDE-based agent scraping](https://github.com/Decodo/mcp-server).

The CLI is the right tool when you need direct shell access, scripting, or automation.

## Key features

- **Web scraping from the terminal, no infrastructure required**. Scrape any website, including JavaScript-heavy pages, without handling proxy rotation, JavaScript rendering, anti-bot bypass, or CAPTCHA solving.

- **Structured output for automation**. Markdown (human-readable), JSON and NDJSON (pipe-friendly), and PNG screenshots built for scripts, data pipelines, and AI agent subprocesses.

- **Built-in support for popular targets**. Tier-1 commands for scrape, search, and screenshot, plus schema-driven subcommands for Google Search and Bing, Amazon, Walmart, and Target, Reddit, TikTok, YouTube, and more. Run `decodo targets` to list everything available.

- **Global proxy infrastructure**. Access 115M+ residential IPs across 195+ locations with IP rotation and geo-targeting. All requests are powered by the Decodo Web Scraping API with a 99.99% success rate.

- **Pipe-friendly by design**. Compact JSON when piped, human-readable output in a TTY, and explicit exit codes for authentication, validation, rate limits, and API errors.

- **Fast time to value**. From API token to your first scrape in minutes. Install with one command or use `npx` with zero setup.

## Use cases

Use the Decodo CLI when you need web scraping from the shell, structured data extraction in automation, reliable access to dynamic websites, or an alternative to building scraping infrastructure from scratch.

Common scenarios:

- **Shell scripts and CI/CD**. Scrape or search in pipelines without embedding SDK logic.
- **Data pipelines**. Stream NDJSON results into `jq`, databases, or downstream tools.
- **Coding agent subprocesses**. Let AI agents call `decodo search` or `decodo scrape` directly.
- **eCommerce intelligence**. Query Amazon, Walmart, and Target targets from the terminal.
- **Social media data collection**. Gather posts and metadata from Reddit, TikTok, and YouTube.
- **SERP monitoring**. Search Google and Bing programmatically as a SERP scraper with geo-targeting and parsed output.

## Quick start

1. **Create a free account** at [dashboard.decodo.com](https://dashboard.decodo.com/) — get up to 2K free requests with no credit card required.
2. **Get your Web Scraping API token** from the Decodo [Playground](https://dashboard.decodo.com/playground).
3. **Install Node.js 18+** from [nodejs.org](https://nodejs.org/) (required for npm or `npx`).
4. **Install the CLI** using one of the methods below.
5. **Authenticate and run** your first scrape:

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

Get an auth token from the Decodo [Playground](https://dashboard.decodo.com/playground).

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
decodo google-search "top articles hacker news" --page-count 5 --parse
```

You should see Markdown or parsed JSON within seconds. If you see an auth error, double-check your token from the dashboard.

## Commands

### Tier-1 commands

| Command | Description |
| --- | --- |
| `decodo scrape <url>` | Scrape a URL (Markdown by default) |
| `decodo search <query>` | Web search (`--engine google\|bing`, `--geo`, `--limit`) |
| `decodo screenshot <url>` | Capture a PNG screenshot (`-o` file or directory) |
| `decodo targets` | List all scrape targets by group |
| `decodo setup` | Save auth token interactively |
| `decodo whoami` | Show configured auth source |
| `decodo reset` | Remove saved auth config |

### Schema-driven target commands

Every API target is also available as its own subcommand using the kebab-case name shown by `decodo targets`:

```bash
decodo google-search "decodo scraping api"
decodo universal https://ip.decodo.com
decodo universal --help
```

Use `decodo <target> --help` for target-specific flags (`--parse`, `--geo`, and others from the schema).

## Output modes

By default, scrape commands print the first result's `content` (parsed JSON when the target supports `--parse`, Markdown for `decodo scrape`).

| Flag | Effect |
| --- | --- |
| `--full` | Print the full API response envelope |
| `--format ndjson` | One JSON object per result line on stdout (pipe-friendly) |
| `--pretty` | Indented JSON on stdout |
| `-o, --output <path>` | Write to a file instead of stdout |
| `-v, --verbose` | Print debug logs to stderr |

**TTY vs. pipe:** When stdout is a terminal, human-readable output is used where possible. When piped or redirected, raw bytes or compact JSON is written. Screenshot output must go to `-o` or a redirect — writing binary PNG to a TTY is rejected.

**NDJSON line contract:** With `--format ndjson`, stdout is one JSON object per API result line. Without `--full`, each line is that result's `content`. With `--full`, each line is the full result entry (e.g. `content`, `status_code`, `url`). There is no envelope-level `.results[]` on a single line — pipe each line through `jq` individually.

```bash
# Parsed JSON from Google Search
decodo google-search "query" --parse

# Full envelope, pretty-printed
decodo google-search "query" --full --pretty

# NDJSON stream for jq / agents
decodo google-search "query" --format ndjson --full | jq -c '.url'
```

## Examples

### Pipe-friendly workflows

```bash
# Search and extract titles
decodo google-search "rust web scraping" --page-count 3 --parse | jq '.results.results.organic[].title'

# Scrape JSON API endpoint
decodo scrape https://ip.decodo.com/json | jq '.proxy.ip'

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

The Decodo CLI is built for AI agent web scraping and agentic workflows. Coding agents such as Cursor, Claude Code, Codex, Gemini CLI, and Windsurf should invoke the CLI as a shell subprocess instead of embedding scraping logic.

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
5. Check exit codes to distinguish authentication, usage, and API errors.

### MCP vs. CLI: when to use which

Use the CLI when your agent needs to scrape from a shell, terminal, CI/CD pipeline, or subprocess. For IDE-based agent scraping using the Model Context Protocol, see the [Decodo MCP server for IDE-based agent scraping](https://github.com/Decodo/mcp-server).

## Environment variables

| Variable | Description |
| --- | --- |
| `DECODO_AUTH_TOKEN` | Auth token (overrides saved config, below `--token`) |
| `DECODO_CONFIG_HOME` | Override config directory (default: `$XDG_CONFIG_HOME/decodo`, else `~/.config/decodo`) |

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

The [install script](https://decodo.github.io/cli/install.sh) configures your PATH automatically. If `decodo` isn't available, restart your terminal or re-run the install script. You can also use `npx @decodo/cli`.

**Validation or API errors**

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

- [Decodo Web Scraping API](https://github.com/Decodo/Web-Scraping-API)
- [Decodo MCP server for IDE-based agent scraping](https://github.com/Decodo/mcp-server)
- [Decodo OpenClaw skill](https://github.com/Decodo/decodo-openclaw-skill)
- [Decodo SDK for TypeScript](https://github.com/Decodo/sdk-ts)

## Try it

Install the CLI and start scraping from your terminal in minutes.

[Start scraping for free](https://dashboard.decodo.com/) | [Web Scraping API documentation](https://help.decodo.com/docs/web-scraping-api-introduction)
| [Discord](https://discord.gg/Ja8dqKgvbZ)

## License

All code is released under the [MIT License](https://github.com/Decodo/Decodo/blob/master/LICENSE).
