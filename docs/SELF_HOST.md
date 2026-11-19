# Self-hosting ModelPick

ModelPick is a local CLI and a stdio MCP server. It has **zero runtime npm dependencies**, no telemetry, no gateway, and no ModelPick-hosted service in the decision path.

You can run it from a cloned repo, a GitHub release tarball, or an internal mirror.

## Requirements

- Node.js **18+** (CI covers 20, 22, and 24)
- No Python, Docker, database, or background worker
- Network only when you choose to run `modelpick update`; picking a model is offline

## Install without npm

```bash
# From the release tarball
npm install https://github.com/Leizhidong-creator/modelpick/releases/download/v0.1.0/modelpick-0.1.0.tgz

# Or from a clone
git clone https://github.com/Leizhidong-creator/modelpick
cd modelpick
node bin/modelpick.js pick "3D sword for Unity"
```

Pin the tarball by SHA-256 from the release's `.tgz.sha256` asset. Verify the catalog after install:

```bash
npx modelpick verify
```

`verify` checks the catalog checksums, benchmark evidence, package version, and the install receipt. It exits non-zero on tampering or a broken package.

## Run the MCP server

```bash
npx modelpick mcp
```

It speaks JSON-RPC 2.0 over stdio with protocol `2025-06-18`. Seven tools: `pick_model`, `get_decision_packet`, `plan_workflow`, `compare_models`, `get_setup`, `list_models`, `explain_task`.

Wire it into an agent with one command:

```bash
npx modelpick setup claude-code
npx modelpick setup codex --global --write
npx modelpick setup cursor
npx modelpick setup dsh --global --write
npx modelpick setup copilot
npx modelpick setup vscode
```

## No data leaves the machine

- The router reads `catalog/*.json` from the installed package.
- API keys are read from the environment at call time; ModelPick does not write them to disk.
- There is no analytics endpoint, account, or license check.
- `modelpick update` fetches a new **catalog snapshot** from GitHub, not new code; if you are air-gapped, skip it and pin a release tarball.

The agent may call a provider after a pick. That call is made by the agent or your code, not by ModelPick.

## Private and self-hosted models

Add an internal endpoint without forking the catalog:

```bash
modelpick add-model my-model.json
modelpick pick "internal code review" --available --json
```

`add-model` writes to `~/.modelpick/overrides.json`, validates the schema, and merges the model into future picks. Set `MODELPICK_HOME` to redirect that state (for example, on a read-only home directory).

## Air-gapped operation

1. Download the release tarball and `.tgz.sha256` on a connected machine.
2. Verify the hash, copy both to the isolated machine.
3. `npm install ./modelpick-0.1.0.tgz`
4. Run `modelpick verify`; do not run `modelpick update`.
5. Add any internal models with `modelpick add-model`.

The decision path never needs the network. The only outbound calls in normal use are provider API calls made by the agent after a decision; `modelpick update` optionally fetches the public catalog from GitHub.

## Operational checks

```bash
modelpick doctor
modelpick verify
modelpick bench --json
modelpick eval evals.json
```

- `doctor` checks Node, catalog, agent config, and key availability.
- `verify` is the integrity gate; run it in CI before deployment.
- `bench` replays the decision benchmark locally.
- `eval` analyzes your own pass/fail runs.

## Uninstall

```bash
npm uninstall modelpick
rm -rf ~/.modelpick
```

Remove the MCP block from the agent config you installed into. `setup` writes a marked block; delete the `modelpick` server entry to remove it.

## Security model

- Treat the catalog as code: review changes and run `verify` after updates.
- Do not commit provider keys. Use your agent's secret store or environment.
- The MCP server has no network listener and no shell tool. It only reads the catalog and returns recommendations.
- The judge/decision packet is a **prompt**, not an executed call. Send it to a model you trust; never paste secrets into it.

See [`SECURITY.md`](../SECURITY.md) for reporting a vulnerability.
