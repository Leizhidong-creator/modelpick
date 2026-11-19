# Agent CLI verification

**Date:** 2026-11-19
**Platform:** Windows 11, Node 24.15.0

This is the raw integration evidence for the agent platforms installed on the build machine. It is not a claim that every vendor UI was exercised end to end; it records exactly what was run and what happened.

## Claude Code 2.1.170

### Plugin marketplace validation

```text
$ claude plugin validate .
Validating marketplace manifest: E:\Agent model choice\modelpick\.claude-plugin\marketplace.json

√ Validation passed
```

### MCP registration

```text
$ claude mcp add --scope project --transport stdio modelpick -- node bin/modelpick.js mcp
Added stdio MCP server modelpick with command: ... to project config
File modified: ...\.mcp.json
```

Resulting file:

```json
{
  "mcpServers": {
    "modelpick": {
      "type": "stdio",
      "command": "D:\\Program Files\\nodejs\\node.exe",
      "args": ["E:\\Agent model choice\\modelpick\\bin\\modelpick.js", "mcp"],
      "env": {}
    }
  }
}
```

`claude mcp list` reported:

```text
modelpick: ... - ⏸ Pending approval (run `claude` to approve)
```

That is the expected headless result for a project-scoped server: Claude Code requires a human to approve a project MCP server. The config itself is valid; the server responds to the MCP handshake when spawned directly (see `tests/integration/mcp.test.js`).

## Codex CLI 0.166.0

```text
$ codex mcp add modelpick -- node bin/modelpick.js mcp
Added global MCP server 'modelpick'.

$ codex mcp list
Name       Command                           Args                                                  Status
modelpick  D:\Program Files\nodejs\node.exe  ...\bin\modelpick.js mcp                              enabled
```

The resulting `config.toml`:

```toml
[mcp_servers.modelpick]
command = 'D:\Program Files\nodejs\node.exe'
args = ['E:\Agent model choice\modelpick\bin\modelpick.js', "mcp"]
```

Codex emitted a warning about PATH aliases because `CODEX_HOME` was pointed at a temp directory during the test; that is a test-harness artifact, not a ModelPick issue.

## DeepSeek Harness

DSH has no MCP JSON file. The profile at `~/.dsh/profiles/desktop/cordis.patch.yml` uses Cordis plugin rows. `modelpick setup dsh --global --dry-run --profile desktop` produced:

```yaml
- id: mcp-modelpick
  name: '@deepseek-ai/dsh-mcp-client'
  config:
    serverName: modelpick
    transport: stdio
    command: "D:\\Program Files\\nodejs\\node.exe"
    args: ["E:\\Agent model choice\\modelpick\\bin\\modelpick.js", "mcp"]
```

`writeDshMcp()` is covered by two tests: it appends once, creates a backup, and does not write on `--dry-run`. It is intentionally **not** run against the live profile by this test suite; the user must opt in with `--write`.

## Copilot CLI

Not installed on this machine. The documented config path is `~/.copilot/mcp-config.json`; the project writer uses `.mcp.json` and `.github/skills/`.

## What this proves

- The generated Claude plugin manifest is accepted by the real Claude Code validator.
- The generated Codex MCP config is accepted by the real Codex CLI.
- The MCP server speaks the protocol and answers six tools (tested directly).
- DSH's file format and profile path are real, not invented.

## What this does not prove

- That a human approved the Claude project MCP server.
- That every vendor UI renders the tool output identically.
- That Copilot CLI accepts the config (not installed here).
- That DSH hot-reloads the new MCP row without a restart.
