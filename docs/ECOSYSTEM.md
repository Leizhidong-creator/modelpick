# Ecosystem and embedding

ModelPick is designed to be embedded, not to become another destination. This page is the integration matrix: what ships today, how each agent loads it, and what is still missing.

## Integration matrix

| Platform | MCP | Native skill | Plugin / marketplace | Status |
|---|---|---|---|---|
| **Claude Code** | `.mcp.json` | `.claude/skills/modelpick/` | `.claude-plugin/marketplace.json` + plugin | **Shipped** |
| **OpenAI Codex CLI** | `~/.codex/config.toml` `[mcp_servers.modelpick]` | `.agents/skills/modelpick/` | `plugin.json` + `.agents/plugins/marketplace.json` | **Shipped** |
| **Cursor** | `.cursor/mcp.json` | `.cursor/skills/` + `.agents/skills/` | `.cursor-plugin/marketplace.json` (template only) | **Shipped (MCP + skill)** |
| **DeepSeek Harness** | profile `cordis.patch.yml` via `@deepseek-ai/dsh-mcp-client` | `.dsh/skills/`, `.agents/skills/` | DSH plugin row | **Shipped (skill + MCP row)** |
| **GitHub Copilot CLI** | `.mcp.json` / `~/.copilot/mcp-config.json` | `.github/skills/` | `copilot plugin marketplace add` | **Shipped (MCP + skill)** |
| **Windsurf / Devin Desktop** | `.devin/mcp_config.json` | `.agents/skills/` | — | Generic MCP; adapter pending |
| **Cline** | `cline_mcp_settings.json` | `.agents/skills/` | — | Generic MCP; adapter pending |
| **Zed** | `context_servers` in settings | — | — | Generic MCP; adapter pending |
| **VS Code agent mode** | `.vscode/mcp.json` (`servers`) | — | — | Generic MCP; adapter pending |
| **Any MCP client** | stdio JSON-RPC | portable `SKILL.md` | — | **Shipped** |

## One command per agent

```bash
modelpick setup claude-code
modelpick setup codex
modelpick setup cursor
modelpick setup dsh
modelpick setup copilot
modelpick setup generic
```

`--dry-run` prints the files and changes without writing. `--global` targets user-level config. `--portable` emits an `npx` command instead of an absolute Node path.

### Verified on this machine (2026-11-19)

| Check | Version / result |
|---|---|
| `claude plugin validate .` | Claude Code **2.1.170** — **Validation passed** |
| `claude mcp add ...` | wrote a valid project `.mcp.json`; health is "pending approval" in headless mode (expected) |
| `codex mcp add modelpick -- …` | codex-cli **0.166.0** — server registered, `codex mcp list` shows `enabled` |
| DSH profile | `~/.dsh/profiles/desktop/cordis.patch.yml` present; `setup dsh --global --dry-run` renders the exact row |
| Copilot CLI | not installed on this machine; config path verified from docs only |

Full command/output log: [`tests/results/agent-cli-verification.md`](../tests/results/agent-cli-verification.md).

### DeepSeek Harness, specifically

DSH has **no `mcp.json`**. MCP servers are Cordis plugin rows in a profile's `cordis.patch.yml`, and tools appear as `mcp__<serverName>__<tool>`:

```yaml
- id: mcp-modelpick
  name: '@deepseek-ai/dsh-mcp-client'
  config:
    serverName: modelpick
    transport: stdio
    command: node
    args: ['C:\\path\\to\\modelpick\\bin\\modelpick.js', 'mcp']
```

Write it automatically (backs up the profile file first):

```bash
modelpick setup dsh --global --write --profile desktop
```

DSH also reads the portable skill from `.dsh/skills`, `.agents/skills`, `~/.dsh/skills`, and `~/.agents/skills`. The skill tells the agent when to call `pick_model` and how to report `costPerTask`. Without MCP, the same agent can run `modelpick pick "..." --json`.

**Not shipped yet:** a DSH slash command (`/pick`) packaged as a Cordis plugin. The MCP row and the skill are sufficient for the tool loop; a slash command is a UX nicety for v0.2.

## MCP contract

Six tools, stdio, no keys required for recommendations:

| Tool | Input | Output |
|---|---|---|
| `pick_model` | query, task, optimize, max_cost, min_quality, open_weights, available_only, context_tokens, exclude_providers, top_k, optional `verdict` | ranked model, cost per solved task, why, setup, availability, best runnable fallback, judge decision |
| `plan_workflow` | goal, optimize, max_cost | steps, model per step, total estimate |
| `compare_models` | models[], task | quality, cost, attempts, availability |
| `get_setup` | model | endpoint, auth, env, SDK, curl, docs |
| `list_models` | modality, task, open_weights, available_only, limit | compact catalog |
| `explain_task` | query | task, confidence, candidates |

Every response is compact (<12 KB for a pick) and includes a schema version. MCP logs go to stderr; stdout is JSON-RPC only.

## Distribution surfaces

| Surface | What is needed | Status |
|---|---|---|
| GitHub release | public repo + tag | **live** (`v0.1.0`) |
| Claude Code marketplace | `.claude-plugin/marketplace.json` in repo | **live** (self-hosted; `/plugin marketplace add Leizhidong-creator/modelpick`) |
| Codex marketplace | `.agents/plugins/marketplace.json` | **live** (template) |
| Cursor plugin | `.cursor-plugin/marketplace.json` | template pending |
| npm | publish `modelpick` | **blocked on npm auth** |
| MCP Registry | npm package + `server.json` | pending npm |
| Glama / mcp.so / Smithery / PulseMCP | listing + install command | pending npm |
| Homebrew | formula | not started |

The npm gap is the main distribution blocker. Until it is closed, every install path uses GitHub:

```bash
npx -y github:Leizhidong-creator/modelpick pick "your task"
```

## Why embed instead of becoming a gateway

A gateway sees traffic and can charge a margin; it also owns the keys, the failure domain, and the latency. ModelPick only needs the task and the catalog. That makes it small enough to live inside an agent, an IDE, or a CI job — and it can recommend a gateway without competing with it.

## Adding an adapter

1. Add a branch to `installAgent()` in `src/integrations/index.js`.
2. Reuse `mergeMcpFile`, `upsertBlock`, `copySkill`, or `writeDshMcp`.
3. Support `--dry-run`; back up before writing; never overwrite invalid JSON.
4. Add an integration test with a temp cwd.
5. Add a row to the matrix above.
