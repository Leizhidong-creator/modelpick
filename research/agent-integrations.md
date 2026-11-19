# Coding-agent integration mechanics for `modelpick`

**Compiled 2026-11-19.** Every path, snippet, and command below was checked against official docs or the locally installed app on this date. Anything I could not verify is explicitly labelled `[UNVERIFIED]`. Do not add flags that are not listed here.

**The single most useful finding:** `.agents/skills/<name>/SKILL.md` is read by **Codex CLI, Cursor, GitHub Copilot CLI, Windsurf/Devin Desktop, and DeepSeek Harness** — five of the seven agents in this report, with one directory. Ship there first, then add `.claude/skills/` for Claude Code.

---

## 0. TL;DR — what `modelpick` should ship

| Artifact | Path in repo | Read by |
|---|---|---|
| Portable skill | `.agents/skills/modelpick/SKILL.md` | Codex, Cursor, Copilot CLI, Devin/Windsurf, DSH |
| Claude skill | `.claude/skills/modelpick/SKILL.md` | Claude Code (does **not** read `.agents/skills`) |
| Claude plugin | `.claude-plugin/plugin.json` + `skills/` + `.mcp.json` | Claude Code (`/plugin install`) |
| Claude marketplace | `.claude-plugin/marketplace.json` | Claude Code (`/plugin marketplace add`) |
| Codex/Cursor plugin | `plugin.json` (Agent Plugins schema) + `skills/` + `mcp.json` | Codex, Cursor |
| Codex marketplace | `.agents/plugins/marketplace.json` | Codex |
| Cursor marketplace | `.cursor-plugin/marketplace.json` | Cursor Plugins |
| Universal instructions | `AGENTS.md` at repo root | Codex, Cursor, DSH, Copilot CLI |
| MCP server | published npm package, invoked `npx -y` | all of the above |

One-command install candidates:

```bash
# Claude Code
/plugin marketplace add your-org/modelpick && /plugin install modelpick@modelpick

# Codex CLI
codex plugin marketplace add your-org/modelpick

# GitHub Copilot CLI
copilot plugin marketplace add your-org/modelpick
copilot plugin install modelpick@modelpick

# Cursor
# ship cursor://anysphere.cursor-deeplink/mcp/install?name=modelpick&config=<base64>
```

---

## 1. Claude Code (Anthropic)

### 1.1 Plugin directory layout

A plugin is a directory. Only `.claude-plugin/plugin.json` lives inside `.claude-plugin/`; **every other file sits at the plugin root** (official: “Put every other plugin file at the plugin root, not inside `.claude-plugin/`. That includes `skills/`, `commands/`, and `hooks/`.”).

```
modelpick/
├── .claude-plugin/
│   ├── plugin.json           # optional manifest
│   └── marketplace.json      # only when this repo is also the marketplace
├── skills/
│   └── modelpick/
│       └── SKILL.md          # one <name>/SKILL.md per skill
├── commands/                 # flat .md slash commands (legacy; prefer skills/)
│   └── pick.md
├── agents/                   # subagent .md files; subfolders become part of the name
│   └── model-scout.md
├── hooks/
│   └── hooks.json            # event map wrapped in a top-level "hooks" key
├── .mcp.json                 # MCP servers bundled with the plugin
└── .lsp.json                 # optional
```

### 1.2 `.claude-plugin/plugin.json`

The manifest is **optional**. Without it, Claude Code loads the standard layout and takes the name from the marketplace entry (or directory name under `--plugin-dir`). Manifest paths are relative to the plugin root and **must start with `./`** (`commands/foo.md` fails validation).

```json
{
  "name": "modelpick",
  "displayName": "modelpick",
  "version": "0.1.0",
  "description": "Recommends the best model/API at each task node and helps connect keys",
  "author": { "name": "Your Name", "email": "you@example.com", "url": "https://example.com" },
  "homepage": "https://example.com/modelpick",
  "repository": "https://github.com/your-org/modelpick",
  "license": "MIT",
  "keywords": ["model-selection", "mcp"],
  "defaultEnabled": true,
  "skills": ["./skills/"],
  "commands": {
    "pick": { "source": "./commands/pick.md", "description": "Pick a model for this task" }
  },
  "agents": ["./agents/model-scout.md"],
  "hooks": "./hooks/hooks.json",
  "mcpServers": {
    "modelpick": {
      "command": "npx",
      "args": ["-y", "modelpick-mcp@latest"]
    }
  }
}
```

Key combination rules (verified, `plugins-reference`):

- **Replaces the default folder:** `commands`, `agents`, `outputStyles`, `workflows`, `experimental.themes`, `experimental.monitors`. Setting `commands` means `commands/` is *not* scanned; list it explicitly to keep both.
- **Adds to the default:** `skills`. `skills/` is always scanned, and manifest paths load alongside it.
- `mcpServers` accepts a path, an object, or an array; it is loaded **together with** `.mcp.json`. A server name declared later replaces an earlier one.
- `hooks` must be a file whose shape is `{"hooks": {...}}`; a bare event map fails to load.

### 1.3 `.claude-plugin/marketplace.json`

Required keys: `name`, `owner`, `plugins`. Each plugin entry needs `name` and `source`; `source` is a path from the marketplace root (the directory containing `.claude-plugin/`).

```json
{
  "name": "modelpick",
  "description": "Model selection tooling",
  "owner": { "name": "Your Name" },
  "plugins": [
    {
      "name": "modelpick",
      "source": "./plugins/modelpick",
      "description": "Model/API recommendations plus key connection"
    }
  ]
}
```

Validate locally before pushing:

```bash
claude plugin validate ./plugins/modelpick     # prints "✔ Validation passed"
claude plugin validate ./my-marketplace
claude plugin validate .claude/skills          # also validates a skills dir (v2.1.233+)
```

### 1.4 Install from a GitHub repo

In a session:

```text
/plugin marketplace add your-org/modelpick
/plugin marketplace add your-org/modelpick#v0.1.0      # pin a tag/branch
/plugin market add ./my-marketplace                    # shorter alias; local dir
/plugin install modelpick@modelpick
/plugin install modelpick --marketplace your-org/modelpick   # add+install in one step (v2.1.275+)
```

From a shell (no session):

```bash
claude plugin marketplace add your-org/modelpick
claude plugin marketplace list
claude plugin install modelpick@modelpick
claude plugin install modelpick --marketplace your-org/modelpick   # v2.1.292+
```

Accepted marketplace sources (all verified): GitHub `owner/repo` (append `#ref`), full git URL with `https://` or `git@host:path`, a local directory holding `.claude-plugin/marketplace.json` (must start with `./` or `../`), or a hosted `https://…/marketplace.json`.

Install scope is chosen interactively (three options): **user** (every project), **project** (committed for all collaborators), **local** (you, this repo only). For local plugin development you do not need a marketplace at all: `claude --plugin-dir ./modelpick`.

> ⚠️ A plugin marketplace is **not** “Claude Marketplace” (claude.com/marketplace). `claude-plugins-official` / `claude-code-plugins` names are reserved for `github.com/anthropics/` repos.

### 1.5 `claude mcp add` — stdio server and scopes

```bash
# stdio (note the "--" separator before the command)
claude mcp add --transport stdio modelpick -- npx -y github:Leizhidong-creator/modelpick-mcp@latest

# with env vars (put another option between --env and the server name)
claude mcp add --env MODELPICK_API_KEY=sk-... --transport stdio modelpick -- npx -y github:Leizhidong-creator/modelpick-mcp@latest

# remote
claude mcp add --transport http modelpick https://api.example.com/mcp

# raw JSON (the object inside mcpServers, not the wrapper)
claude mcp add-json modelpick '{"type":"stdio","command":"npx","args":["-y","modelpick-mcp@latest"]}'

claude mcp list
claude mcp get modelpick
```

Scopes and **exact** storage (identical on macOS, Linux, Windows; `~` = `%USERPROFILE%` on Windows):

| Scope | Flag | Loads in | Shared | Stored in |
|---|---|---|---|---|
| Local (default) | `--scope local` | current project only | no | `~/.claude.json` → `projects["<abs path>"].mcpServers` |
| Project | `--scope project` | current project only | yes, via git | `.mcp.json` at project root |
| User | `--scope user` | all your projects | no | `~/.claude.json` |

```json
// ~/.claude.json  (local scope, written by `claude mcp add`)
{
  "projects": {
    "/path/to/your/project": {
      "mcpServers": {
        "modelpick": { "type": "stdio", "command": "npx", "args": ["-y", "modelpick-mcp@latest"] }
      }
    }
  }
}
```

```json
// .mcp.json  (project scope, commit this)
{
  "mcpServers": {
    "modelpick": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "modelpick-mcp@latest"],
      "env": { "MODELPICK_API_KEY": "${MODELPICK_API_KEY}" }
    }
  }
}
```

`type` accepts `stdio`, `http`, `sse`, and `streamable-http` as an alias for `http`. `${VAR}` expansion works in `command`/`args`/`env`; inside project `.mcp.json` use `${CLAUDE_PROJECT_DIR:-.}` when you need the project root.

### 1.6 Settings / hook / skill file locations

| What | Path |
|---|---|
| User settings | `~/.claude/settings.json` |
| Project settings (committed) | `.claude/settings.json` |
| Project local settings (personal) | `.claude/settings.local.json` |
| MCP + per-project state | `~/.claude.json` |
| Personal skills | `~/.claude/skills/<name>/SKILL.md` |
| Project skills | `.claude/skills/<name>/SKILL.md` |
| Plugin skills | `<plugin>/skills/<name>/SKILL.md` |
| Managed policy | `managed-settings.json` (per-OS location documented under managed-settings; **not re-verified here**) |

Precedence when a skill name collides: enterprise > personal (`~/.claude/skills/`) > project (`.claude/skills/`). Reserved folder name: `synced` (used for claude.ai-synced skills).

### 1.7 Windows caveat

Claude Code's docs contain **no** `cmd /c` guidance — I checked. In practice, a stdio server whose `command` is `npx` fails to spawn on native Windows because `npx` is a `.cmd` shim; the working form is:

```powershell
claude mcp add --transport stdio modelpick -- cmd /c npx -y github:Leizhidong-creator/modelpick-mcp@latest
```

`[UNVERIFIED — field-reported, not in official docs]`. Test per machine; prefer an absolute `node.exe` + script path if you need determinism.

---

## 2. OpenAI Codex CLI

Docs moved: `github.com/openai/codex/docs/config.md` is now a stub pointing at `developers.openai.com/codex/*`. **Every page has a `.md` twin** — append `.md` to any docs URL for clean markdown.

### 2.1 Config paths

| Path | Purpose |
|---|---|
| `~/.codex/config.toml` | user config (default; `CODEX_HOME` overrides the dir) |
| `~/.codex/<profile>.config.toml` | per-profile overlay, selected by `codex --profile <name>` |
| `.codex/config.toml` | project overlay — **only loaded when the project is trusted**; Codex walks root→cwd and the closest file wins |
| `~/.codex/AGENTS.md`, `~/.codex/AGENTS.override.md` | global instructions |
| `AGENTS.md` in repo dirs | project instructions |
| `~/.codex/skills` is **not** used | skills live in `.agents/skills` (see 2.4) |

`config.toml`, the Codex CLI, the ChatGPT desktop app, and the IDE extension **share** the MCP configuration.

### 2.2 `[mcp_servers.<name>]`

```toml
[mcp_servers.modelpick]
command = "npx"
args = ["-y", "modelpick-mcp@latest"]
env_vars = ["MODELPICK_API_KEY"]          # pass through from ambient env
startup_timeout_sec = 20                  # default 10
tool_timeout_sec = 60                     # default 60
enabled = true

[mcp_servers.modelpick.env]
MODELPICK_LOG_LEVEL = "info"
```

Remote / HTTP:

```toml
[mcp_servers.modelpick]
url = "https://api.example.com/mcp"
bearer_token_env_var = "MODELPICK_TOKEN"
http_headers = { "X-Region" = "us-east-1" }
enabled_tools = ["recommend", "connect_key"]
disabled_tools = ["dangerous_tool"]        # applied after enabled_tools
default_tools_approval_mode = "prompt"
required = true                            # fail startup if this server is missing
```

Per-tool overrides:

```toml
[mcp_servers.modelpick.tools.recommend]
approval_mode = "approve"
output_token_limit = 30000
```

OAuth (for `codex mcp login`):

```toml
[mcp_servers.example.oauth]
client_id = "my-client"
# client_secret = "..."   # keep this file out of version control
```

Global OAuth callback overrides: top-level `mcp_oauth_callback_port`, `mcp_oauth_callback_url`.

Python-style `[mcp_servers.x.env]` values are literal strings in TOML; there is no `${VAR}` interpolation — use `env_vars` for pass-through.

### 2.3 CLI

```bash
codex mcp add modelpick -- npx -y github:Leizhidong-creator/modelpick-mcp@latest
codex mcp add modelpick --env MODELPICK_API_KEY=sk-... -- npx -y github:Leizhidong-creator/modelpick-mcp@latest
codex mcp add example --url https://mcp.example.com --oauth-client-id my-client
codex mcp list
codex mcp --help
codex mcp login example
```

Order matters: `codex mcp add <name> [--env K=V ...] -- <stdio command…>`.

### 2.4 Skills

Codex reads **`SKILL.md`** folders from, in this order (official table):

| Scope | Location |
|---|---|
| REPO | `$CWD/.agents/skills` |
| REPO | `$CWD/../.agents/skills` (any ancestor up to repo root) |
| REPO | `$REPO_ROOT/.agents/skills` |
| USER | `$HOME/.agents/skills` |
| ADMIN | `/etc/codex/skills` |

Skill file:

```markdown
---
name: modelpick
description: Recommend the best model/API at each task node and connect keys. Use when choosing a model, comparing price/quality, or wiring an API key.
---

Instructions…
```

Enable/disable without deleting, in `~/.codex/config.toml`:

```toml
[[skills.config]]
path = "/abs/path/to/modelpick/SKILL.md"
enabled = false
```

Related keys: `skills.bundled.enabled` (default true), `skills.include_instructions` (default true), `skills.max_context_tokens` (default 2% of context, capped at 10000). Built-ins: `$skill-creator`, `$skill-installer`.

### 2.5 Plugins + marketplaces (Codex does have them)

`plugin.json` at the plugin root using the **Agent Plugins** schema (`https://agent-plugins.org/schemas/1.0.0/plugin.schema.json`), with `skills/` and `mcp.json`. The older `.codex-plugin/plugin.json` layout is still supported as a compatibility fallback.

```
modelpick/
├── plugin.json            # or .codex-plugin/plugin.json
├── skills/
│   └── modelpick/SKILL.md
├── mcp.json
└── .app.json              # optional
```

Marketplace catalog locations:

- repo: `$REPO_ROOT/.agents/plugins/marketplace.json`
- personal: `~/.agents/plugins/marketplace.json`
- legacy-compatible: `$REPO_ROOT/.claude-plugin/marketplace.json`

```json
{
  "name": "local-repo",
  "plugins": [
    { "name": "modelpick", "source": "./plugins/modelpick", "description": "Model picking" }
  ]
}
```

Registered in `config.toml` under `marketplaces.<name>.source_type` / `.source` / `.ref` / `.sparse_paths`, with `plugins."<plugin>@<marketplace>".enabled`.

CLI:

```bash
codex plugin marketplace add owner/repo
codex plugin marketplace add owner/repo --ref main
codex plugin marketplace add https://github.com/example/plugins.git --sparse .agents/plugins
codex plugin marketplace add ./local-marketplace-root
codex plugin marketplace list
codex plugin marketplace upgrade [name]
codex plugin marketplace remove name
```

In the TUI: `/plugins` opens the plugin browser; install, then **start a new session** before the plugin's skills/tools exist. The IDE extension does not support plugins.

### 2.6 AGENTS.md conventions

Precedence (verified):

1. **Global:** `~/.codex/AGENTS.override.md` if present, else `~/.codex/AGENTS.md` (first non-empty only).
2. **Project:** from project root down to cwd, per directory: `AGENTS.override.md` → `AGENTS.md` → `project_doc_fallback_filenames`. At most one file per directory.
3. Combined size capped by `project_doc_max_bytes` (**32 KiB default**); Codex stops adding files at the cap.

```toml
# ~/.codex/config.toml
project_doc_max_bytes = 65536
project_doc_fallback_filenames = ["TEAM_GUIDE.md", ".agents.md"]
```

### 2.7 Non-interactive / approval flags

```bash
codex exec "recommend a model for this diff"      # headless run
codex --ask-for-approval never "list instruction sources"   # documented in the AGENTS.md guide
codex --cd services/payments --ask-for-approval never "…"
CODEX_HOME=$(pwd)/.codex codex exec "…"           # isolate config
```

Config equivalents: `approval_policy = "on-request" | "never"`, `sandbox_mode = "workspace-write" | "danger-full-access"`. Docs also reference a `--yolo` full-access mode. Windows additionally has `sandbox = "elevated" | "unelevated"` (`elevated` is the legacy fallback). `approval_policy = "untrusted"` is **retired** — migrate it.

---

## 3. DeepSeek Harness (DSH)

Verified against the local install: `C:\Users\lenovo\AppData\Local\Programs\DeepSeek Harness\resources\app.asar`, runtime `@deepseek-ai/dsh-desktop-runtime` **0.2.1-rc.2**, and the package READMEs shipped inside it (extracted with `npx @electron/asar`). There is **no public docs site** that I could verify; the package READMEs are the authority. Treat DSH facts as version-pinned to 0.2.1-rc.2.

### 3.1 Skill discovery roots (rank order)

| Rank | Source | Path |
|---|---|---|
| 100 | `project-dsh` | `<projectRoot>/.dsh/skills` |
| 200 | `project-agents` | `<projectRoot>/.agents/skills` |
| 300 | `custom` | `Config.customSkillDirs` |
| 400 | `user-dsh` | `<dshHome>/skills` → **`~/.dsh/skills`** |
| 500 | `user-agents` | `<agentsHome>/skills` → **`~/.agents/skills`** |
| 600 | bundled | `bundledSkillDir` when configured |

- `projectRoot` = nearest ancestor containing `.git`; otherwise the supplied cwd.
- `<dshHome>` = `$DSH_HOME` or `~/.dsh`; its `.system` child is skipped. `<agentsHome>` = `$DSH_AGENTS_HOME` or `~/.agents`.
- A skill is either `<name>/SKILL.md` **or a flat `<name>.md`** at the top level of a scanned root. **Nested `**/SKILL.md` is deliberately not discovered** (unlike Cursor).
- `includeDefaultRoots: false` disables ranks 100/200/400/500; `watch` defaults to true (Chokidar) and invalidates the catalog on add/rename/delete or frontmatter edits — body edits are picked up on the next load regardless.

### 3.2 `SKILL.md` frontmatter

Required: `name`, `description`. Optional: `whenToUse`, `metadata`, `disable-model-invocation`, `user-invocable`.

```markdown
---
name: modelpick
description: Recommend the best model/API at each task node and help connect keys.
whenToUse: The user asks which model to use, compares cost/quality, or needs a key wired up.
metadata:
  version: 0.1.0
---

Instructions…
```

- `disable-model-invocation: true` → hidden from model-facing catalogs.
- `user-invocable: false` → hidden from human-facing slash commands.
- Booleans accept YAML booleans plus case-insensitive `true/false`, `yes/no`, `on/off`, `1/0`. A rejected spelling **drops the whole skill with a warning**.
- Catalog holds frontmatter only; the body is re-read on every load.
- Note: DSH writes `install` nothing under `~/.dsh/skills` by default — this machine has no such directory yet. Create it.

### 3.3 MCP configuration

DSH has **no `mcp.json`**. MCP servers are plugin rows in the profile's YAML, i.e. the same mechanism as every other capability:

```yaml
# ~/.dsh/profiles/<profile>/cordis.patch.yml
- id: mcp-modelpick
  name: '@deepseek-ai/dsh-mcp-client'
  config:
    serverName: modelpick
    transport: stdio
    command: npx
    args: ['-y', 'modelpick-mcp@latest']
    env:
      MODELPICK_API_KEY: !!js process.env.MODELPICK_API_KEY

- id: mcp-modelpick-http
  name: '@deepseek-ai/dsh-mcp-client'
  config:
    serverName: modelpick-http
    transport: streamable-http
    url: https://api.example.com/mcp
    headers:
      Authorization: !!js '`Bearer ${process.env.MODELPICK_TOKEN}`'
```

Fields: `transport` (`stdio` | `streamable-http`, required), `serverName` (`[A-Za-z0-9_-]{1,32}`, required), `command`/`args`/`env`/`cwd`, `url`/`headers`, `toolCallTimeoutMs` (60000), `maxInstructionBytes` (32768), `failOnStartupError` (false), `reconnect.{enabled,initialDelayMs,maxDelayMs,maxAttempts}`.

Tools appear to the model as **`mcp__<serverName>__<tool>`** — “the same naming shape Claude Code and Codex use”. Ambient env is scrubbed before spawn; only `env` is merged over it. stdio negotiation starts a **temporary probe process** before the serving process (so a `npx` cold start happens twice).

### 3.4 Profiles, plugin API, slash commands

- A profile directory holds `package.json` (deps + `dsh.profile.bundles`, an ordered list) and `cordis.patch.yml` (your patch layer). `cordis.yml` is an empty root — **do not edit it**.
- CLI: `dsh plugin --profile <name> <pnpm args>` manages a profile's plugins by forwarding to pnpm in the profile dir. `dsh web`, `dsh --profile headless "job"`, `dsh --profile acp`, `dsh --profile sdk`, `dsh --profile sdk-minimal`, `dsh --profile <name> --from-default-profile <template>`.
- The profile name **`desktop` is reserved** for the Electron-owned profile; the npm CLI rejects boot and plugin-management requests for it. The Desktop-installed command can manage it with that installation's runtime.
- Plugins are Cordis plugins: they receive `ctx` and `apply(ctx)`. They register tools on `ctx.tools`, MCP tools via `createMcpToolDefinition(ctx, options)`, and slash commands via:

```js
ctx.commands.register({
  name: 'pick',
  description: 'Choose a model for the current task',
  input: { hint: '<task>' },
  handler: ({ agent, rawInput }) => ({ kind: 'success', text: '…' }),
})
```

- Command syntax: a slash at byte zero, lowercase name with letters/digits/`_`/`-`, then end-of-input or whitespace; everything after the name (including separator whitespace) is the command's `rawInput`. Commands do **not** create a model message. Registering the same name twice in one scope throws. Agent-scoped registrations shadow globals of the same name.

### 3.5 Instructions files

`dsh-agent-instructions` (on by default in `dsh-base`, 65 536-byte budget) loads:

1. user-global: `$DSH_HOME/AGENTS.md` then `<agentsHome>/AGENTS.md`
2. project chain, root → cwd, candidates `AGENTS.md`, `CLAUDE.md` plus local overlays `AGENTS.local.md`, `CLAUDE.local.md`

Content-identical candidates render once (a `CLAUDE.md` duplicating `AGENTS.md` is not repeated). Editing files is picked up on later filesystem operations; session resume reconciles.

---

## 4. Cursor

### 4.1 MCP config

| Scope | Path |
|---|---|
| Global (all projects) | `~/.cursor/mcp.json` |
| Project | `.cursor/mcp.json` |

```json
{
  "mcpServers": {
    "modelpick": {
      "command": "npx",
      "args": ["-y", "modelpick-mcp@latest"],
      "env": { "MODELPICK_API_KEY": "value" }
    },
    "modelpick-remote": {
      "url": "https://api.example.com/mcp",
      "headers": { "Authorization": "Bearer ${env:MODELPICK_TOKEN}" }
    }
  }
}
```

Interpolation: `${env:NAME}` and `${workspaceFolder}` / `${workspaceFolderBasename}`. OAuth block supported under `"auth": {"CLIENT_ID": …, "CLIENT_SECRET": …, "scopes": [...]}`.

One-command install link (great for a landing page):

```
cursor://anysphere.cursor-deeplink/mcp/install?name=$NAME&config=$BASE64_ENCODED_CONFIG
```

### 4.2 Rules

- Project rules: `.cursor/rules/*.mdc` — **must** be `.mdc`; a plain `.md` in that folder is ignored (no frontmatter → not a rule).
- Frontmatter: `description`, `globs`, `alwaysApply` (the three fields interact to decide inclusion).
- `AGENTS.md` is supported at the project root **and in subdirectories**; nested files combine with parents, more specific wins.
- Create via `/create-rule` in Agent, or Customize → Rules → Add Rule.

### 4.3 Skills and plugins (both exist)

Skill roots (recursive; a nested `.cursor/skills/` anywhere in the repo is also picked up and auto-scoped to that subtree):

```
.agents/skills/<name>/SKILL.md          # portable
.cursor/skills/<name>/SKILL.md          # Cursor-native
~/.agents/skills/<name>/SKILL.md
~/.cursor/skills/<name>/SKILL.md        # only this one syncs to Cloud Agents
```

Plugins — two formats, same install flow:

- **Agent Plugin:** root `plugin.json` + `skills/` + `mcp.json` (portable, shared with Codex).
- **Cursor Plugin:** `.cursor-plugin/plugin.json`, can contribute rules, agents, commands, hooks, variables; multi-plugin catalog at `.cursor-plugin/marketplace.json`.

Install from Customize → *From GitHub Repository* (repo needs the marketplace file) or a team marketplace. Installation modes: Default Off / Default On / Required.

---

## 5. The others (brief but exact)

### 5.1 GitHub Copilot CLI

| Item | Path |
|---|---|
| User MCP config | `~/.copilot/mcp-config.json` |
| Project MCP | `.mcp.json` or `.github/mcp.json` (walked cwd → repo root; `.mcp.json` wins in the same dir; project wins over user) |
| Project skills | `.github/skills`, `.claude/skills`, `.agents/skills` |
| Personal skills | `~/.copilot/skills`, `~/.agents/skills` |

```json
{
  "mcpServers": {
    "modelpick": {
      "command": "npx",
      "args": ["-y", "modelpick-mcp@latest"],
      "tools": ["*"]
    }
  }
}
```

```bash
copilot mcp add modelpick -- npx -y github:Leizhidong-creator/modelpick-mcp@latest
copilot mcp add modelpick --env MODELPICK_API_KEY=sk-... -- npx -y github:Leizhidong-creator/modelpick-mcp@latest
copilot mcp add --transport http notion https://mcp.notion.com/mcp
copilot mcp add --transport http --header "Authorization: Bearer …" stripe https://mcp.stripe.com
copilot mcp list
```

Options: `--env K=V` (repeatable), `--header "H: V"`, `--transport stdio|http|sse`, `--tools` (`*`, CSV, or `""`), `--timeout MS`. Interactive: `/mcp`, `/mcp list|show|edit|delete|disable|enable|search`.

Plugins:

```bash
copilot plugin marketplace add OWNER/REPOSITORY
copilot plugin marketplace list | browse NAME | remove NAME
copilot plugin install PLUGIN@MARKETPLACE
copilot plugin list | update | uninstall | disable | enable
```

`awesome-copilot` is registered by default. **`.vscode/mcp.json` is not read by Copilot CLI** (it uses the unsupported top-level key `servers`).

### 5.2 VS Code agent mode

- Workspace MCP: `.vscode/mcp.json` — top-level key is **`servers`**, not `mcpServers` (confirmed indirectly: GitHub's CLI docs call `servers` “the unsupported top-level key” for the CLI).
- User-level MCP: `MCP: Open User Configuration`; add servers with `MCP: Add Server`, or `Chat: Open Customizations` → MCP Servers → **+**.
- It can import configs from other apps (`Add from another application`).
- Agents/instructions: `.github/copilot-instructions.md`, `AGENTS.md`, `.github/instructions/**/*.instructions.md`.
- `[UNVERIFIED]` the exact `servers` + `inputs` schema — the authoritative page (`code.visualstudio.com/docs/copilot/reference/mcp-configuration`) returned a TLS error from this machine; fetched page title only.

### 5.3 Windsurf → Devin Desktop (product renamed/merged)

docs.windsurf.com now serves **Devin** docs (Cognition). Current paths:

| Item | Path |
|---|---|
| Project MCP | `.devin/mcp_config.json` (committed) |
| Local override | `.devin/mcp_config.local.json` (gitignored) |
| User MCP | `~/.config/devin/mcp_config.json` |
| Project skills | `.devin/skills/<name>/` (`.agents/skills/` and legacy `.windsurf/skills/` also read) |
| User skills | `~/.config/devin/skills/<name>/` (`~/.agents/skills/` also read) |
| Hooks | `.devin/hooks.v1.json` |

Transports: stdio, Streamable HTTP, SSE, plus OAuth per server. Skills invoked automatically by description match or by `/skill-name`; plugins expose `/<plugin>:<skill>`. Legacy Windsurf path `~/.codeium/windsurf/mcp_config.json` `[UNVERIFIED — superseded by the Devin docs]`.

### 5.4 Cline

| Item | Path |
|---|---|
| CLI config | `~/.cline/data/settings/cline_mcp_settings.json` (override with `CLINE_MCP_SETTINGS_PATH`) |
| IDE extension | panel → MCP Servers → Configure → *Configure MCP Servers*; entries under `mcpServers` |

```json
{
  "mcpServers": {
    "modelpick": {
      "command": "npx",
      "args": ["-y", "modelpick-mcp@latest"],
      "env": { "MODELPICK_API_KEY": "value" }
    }
  }
}
```

Remote servers use `url` + transport Streamable HTTP (recommended) or SSE (legacy). `[UNVERIFIED]` the exact VS Code globalStorage path for the extension's JSON — the docs only route you through the UI.

### 5.5 Zed

MCP servers are `context_servers` in Zed's settings file (open with the `zed::OpenSettingsFile` action; also Settings → AI → MCP Servers → Add Server):

```json
{
  "context_servers": {
    "modelpick": {
      "command": "npx",
      "args": ["-y", "modelpick-mcp@latest"],
      "env": {}
    },
    "modelpick-remote": {
      "url": "https://api.example.com/mcp",
      "headers": { "Authorization": "Bearer <token>" }
    }
  }
}
```

No `Authorization` header + remote URL ⇒ Zed runs the MCP OAuth flow. A per-profile `"enable_all_context_servers": false` plus explicit `context_servers` tool toggles lets you expose *only* modelpick tools. Extensions can also ship MCP servers (`mcp-server-*`).

---

## 6. Universal fallback: AGENTS.md + `.agents/skills` + `npx`

For any agent without a plugin system, three files get you 90% of the way:

```
your-repo/
├── AGENTS.md                              # root instructions (Codex, Cursor, DSH, Copilot CLI)
├── .agents/skills/modelpick/SKILL.md      # portable skill (Codex, Cursor, Copilot CLI, Devin, DSH)
└── .mcp.json                              # project MCP (Claude Code, Copilot CLI)
```

`AGENTS.md` skeleton:

```markdown
# modelpick

When the user asks which model or API to use, or needs a provider key wired up,
run the `modelpick` skill / call the `modelpick` MCP tools before answering.

- Prefer `modelpick_recommend` over guessing prices or context limits.
- Never print key material; use `modelpick_connect` to store it.
```

Universal MCP invocation (stdio, all clients):

```json
{ "command": "npx", "args": ["-y", "modelpick-mcp@latest"] }
```

Windows variants:

```jsonc
// preferred: absolute node + script, no shim involved
{ "command": "node", "args": ["C:\\Users\\you\\AppData\\Roaming\\npm\\node_modules\\modelpick-mcp\\dist\\index.js"] }

// pragmatic shim workaround
{ "command": "cmd", "args": ["/c", "npx", "-y", "modelpick-mcp@latest"] }
```

Ship a `bin` entry in `package.json` so `npx modelpick-mcp` resolves without a global install, and keep startup under ~1 s — DSH cold-starts stdio servers twice (probe + serve) and Codex's `startup_timeout_sec` defaults to 10.

---

## 7. Compatibility matrix

| Agent | Portable skill (`.agents/skills`) | Native skill path | Instructions file | MCP config | MCP add command | Plugin install | Non-interactive |
|---|---|---|---|---|---|---|---|
| **Claude Code** | ✗ (not read) | `~/.claude/skills/`, `.claude/skills/`, plugin `skills/` | `CLAUDE.md` (AGENTS.md not documented) | `~/.claude.json` (local/user), `.mcp.json` (project) | `claude mcp add … -- cmd` | `/plugin marketplace add` + `/plugin install`; `claude plugin …` | `claude -p` (print mode) `*` |
| **Codex CLI** | ✓ | `.agents/skills` chain, `$HOME/.agents/skills`, `/etc/codex/skills` | `AGENTS.md` + `AGENTS.override.md` | `~/.codex/config.toml`, `.codex/config.toml` (trusted) | `codex mcp add <n> -- cmd` | `codex plugin marketplace add` + `/plugins` | `codex exec`, `--ask-for-approval never` |
| **DeepSeek Harness** | ✓ | `.dsh/skills`, `.agents/skills`, `~/.dsh/skills`, `~/.agents/skills` | `AGENTS.md`/`CLAUDE.md` chain + `~/.dsh/AGENTS.md` | profile `cordis.patch.yml` (`dsh-mcp-client` row) — **no mcp.json** | edit YAML | `dsh plugin --profile <n> <pnpm args>`; Web plugin manager | `dsh --profile headless "job"` |
| **Cursor** | ✓ | `.cursor/skills`, `.agents/skills`, `~/…` both | `.cursor/rules/*.mdc`, `AGENTS.md` (+ nested) | `~/.cursor/mcp.json`, `.cursor/mcp.json` | edit JSON / deeplink | Customize → GitHub repo / team marketplace | Agent CLI |
| **Copilot CLI** | ✓ | `.github/skills`, `.claude/skills`, `.agents/skills`, `~/.copilot/skills` | `AGENTS.md`, `.github/copilot-instructions.md` | `~/.copilot/mcp-config.json`, `.mcp.json`, `.github/mcp.json` | `copilot mcp add <n> -- cmd` | `copilot plugin marketplace add` + `install` | `copilot -p` |
| **VS Code agent** | ✗ | — | `AGENTS.md`, `.github/copilot-instructions.md` | `.vscode/mcp.json` (`servers`) | `MCP: Add Server` | plugin marketplace in Customize | — |
| **Windsurf/Devin** | ✓ | `.devin/skills`, `.agents/skills`, `.windsurf/skills` | `.devin/` rules + skills | `.devin/mcp_config.json`, `~/.config/devin/mcp_config.json` | edit JSON / Customize UI | `devin plugins` | Devin CLI |
| **Cline** | ✗ | — | `.clinerules` `*` | `~/.cline/data/settings/cline_mcp_settings.json` | UI / edit JSON | — | CLI MCP wizard |
| **Zed** | ✗ | — | `.rules` / rules library `*` | settings.json `context_servers` | Settings → AI → MCP Servers | MCP extensions | — |

Legend: ✓ = reads the portable path; ✗ = does not (needs its own copy). `*` = not re-verified in this pass; treat as pointer, confirm before shipping copy that depends on it.

---

## 8. Windows caveats (all clients)

1. **`npx` is `npx.cmd`.** Any client that spawns `command: "npx"` without a shell can fail with `ENOENT`. Three fixes, in order of preference: point at `node.exe` + the resolved script path; use `cmd /c npx …`; or install globally and reference the `.cmd` shim explicitly. **No official doc in this report documents `cmd /c`** — it is a field workaround `[UNVERIFIED]`.
2. **Paths.** `~` → `%USERPROFILE%`. `~/.dsh`, `~/.claude.json`, `~/.codex/config.toml`, `~/.cursor/mcp.json`, `~/.copilot/mcp-config.json` all work as `C:\Users\<you>\…`.
3. **JSON backslashes** must be escaped (`C:\\Users\\…`) in every `mcpServers`/`context_servers`/`mcp.json` snippet.
4. **Codex sandbox on Windows** has its own `sandbox = "elevated"` / `"unelevated"` switch, distinct from `sandbox_mode`.
5. **DSH** scrubs ambient env before spawning stdio servers — pass secrets explicitly in the row's `env` with `!!js process.env.X`.
6. **Long paths / spaces.** Quote `command`/`args` as separate array elements, never as one string; Claude Code validates that plugin manifest paths start with `./` and use forward slashes.

---

## 9. Sources

Claude Code
- https://code.claude.com/docs/en/plugins
- https://code.claude.com/docs/en/plugins/install
- https://code.claude.com/docs/en/plugins/create-marketplace
- https://code.claude.com/docs/en/plugins/plugins-reference
- https://code.claude.com/docs/en/plugins/components
- https://code.claude.com/docs/en/mcp
- https://code.claude.com/docs/en/skills
- https://code.claude.com/docs/en/settings
- https://code.claude.com/docs/en/hooks

Codex CLI
- https://developers.openai.com/codex/mcp
- https://developers.openai.com/codex/skills
- https://developers.openai.com/codex/config-basic
- https://developers.openai.com/codex/config-advanced
- https://developers.openai.com/codex/config-reference
- https://developers.openai.com/codex/guides/agents-md
- https://developers.openai.com/codex/plugins
- https://developers.openai.com/plugins/build/plugins
- https://github.com/openai/codex

DeepSeek Harness (local install, 0.2.1-rc.2)
- `…\resources\app.asar` → `dsh/node_modules/@deepseek-ai/dsh-skill-filesystem/README.md` (roots, frontmatter)
- `…/dsh-mcp-client/README.md` (MCP rows, `mcp__server__tool`)
- `…/dsh-commands/README.md` (slash commands)
- `…/dsh-agent-instructions/README.md` (AGENTS.md chain)
- `…/dsh-plugin-manager/README.md`, `…/@deepseek-ai/dsh/README.md` (profiles, `dsh plugin`)
- `~/.dsh/profiles/desktop/{package.json,cordis.yml,cordis.patch.yml}`

Cursor
- https://cursor.com/docs/context/mcp
- https://cursor.com/docs/context/rules
- https://cursor.com/docs/skills
- https://cursor.com/docs/plugins

Others
- https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-mcp-servers
- https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-skills
- https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/plugins-finding-installing
- https://code.visualstudio.com/docs/copilot/customization/mcp-servers
- https://docs.windsurf.com/windsurf/cascade/mcp (now serves Devin Desktop docs)
- https://docs.cline.bot/mcp/configuring-mcp-servers
- https://zed.dev/docs/assistant/mcp-servers
- https://github.com/zed-industries/zed/blob/main/docs/src/ai/mcp.md
