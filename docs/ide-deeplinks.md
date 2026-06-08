# IDE one-click install

Install `@decodo/cli` from your editor or share these links in docs and READMEs.

Pattern follows the [Decodo MCP server](https://github.com/Decodo/mcp-server) Cursor deeplink style.

## Install methods

| Method | Command |
| --- | --- |
| curl installer | `curl -fsSL https://decodo.github.io/cli/install.sh \| sh` |
| npm global | `npm install -g @decodo/cli` |
| npx (no install) | `npx --yes @decodo/cli <command>` |

After install, run `decodo setup` to save your auth token.

## Cursor

Cursor supports one-click MCP install deeplinks. For the CLI, use the **npx** deeplink so agents can run `decodo` without a global install:

[![Add Decodo CLI (npx)](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/en-US/install-mcp?name=Decodo%20CLI&config=eyJkZWNvZG8iOnsiY29tbWFuZCI6Im5weCIsImFyZ3MiOlsiLXkiLCJAZGVjb2RvL2NsaSJdfX0=)

Protocol link (same action):

```text
cursor://anysphere.cursor-deeplink/mcp/install?name=Decodo%20CLI&config=eyJkZWNvZG8iOnsiY29tbWFuZCI6Im5weCIsImFyZ3MiOlsiLXkiLCJAZGVjb2RvL2NsaSJdfX0=
```

> The npx deeplink registers a local MCP entry that runs `npx -y @decodo/cli`. For a global install, use the curl or npm commands above.

Docs: [Cursor MCP install links](https://cursor.com/docs/mcp/install-links)

## Windsurf

Windsurf does not publish a CLI-package deeplink. Install globally, then use Cascade with shell commands:

```bash
npm install -g @decodo/cli
decodo setup
```

Example prompt: *"Run `decodo search \"topic\" --parse` and summarize the top results."*

## Continue

Add a shell-friendly workflow in your Continue config, or call via terminal:

```json
{
  "models": [],
  "customCommands": [
    {
      "name": "decodo-search",
      "description": "Search the web with Decodo CLI",
      "prompt": "Run: npx --yes @decodo/cli search \"{{{input}}}\" --parse"
    }
  ]
}
```

Set `DECODO_AUTH_TOKEN` in your environment before using Continue commands.

## Claude Code / Codex / Gemini CLI

These agents run shell commands directly. Prefer:

```bash
npx --yes @decodo/cli scrape https://example.com
```

Or install once with `npm install -g @decodo/cli` for faster repeat invocations.

## Related

- [Decodo MCP server](https://github.com/Decodo/mcp-server) — MCP tools inside Cursor/Windsurf
- [CLI README](../README.md) — full command reference
