# Changelog

All notable changes to ModelPick are documented here. The format follows Keep a Changelog; versions follow SemVer.

## [0.1.0] — 2026-11-19

### Added

- Zero-dependency CLI (`pick`, `plan`, `compare`, `models`, `tasks`, `setup`, `mcp`, `keys`, `doctor`, `update`, `bench`).
- 41-model catalog across 18 providers: text, image, video, 3D, and audio.
- 20 task nodes with English/Chinese detection, capability filters, quality floors, and cost anchors.
- **Cost per solved task**: cache-aware price × expected attempts, with transparent retry model.
- MCP server with 7 tools: `pick_model`, `get_decision_packet`, `plan_workflow`, `compare_models`, `get_setup`, `list_models`, `explain_task`.
- Agent installers: Claude Code, Codex CLI, Cursor, DeepSeek Harness, Copilot CLI, generic MCP.
- Portable `SKILL.md`, Claude Code plugin, marketplace manifests, and `.agents` skill copy.
- Data-driven policy (`catalog/policy.json`) and private model overrides (`~/.modelpick/overrides.json`).
- 95 tests: unit, data integrity, integration, end-to-end, security, performance.
- 39-scenario development benchmark (115 runs) and 12-scenario held-out benchmark (35 runs).
- README, landing page, architecture/data/test docs, social preview, terminal renders, charts.
- CI matrix: Ubuntu/Windows/macOS × Node 20/22/24.

### Known limitations

- Not yet published to npm; install from GitHub.
- No live provider calls in the decision path.
- Media quality scores are priors, not independent measurements.
- Veo requires a Vertex project; Sora 2 is discontinued and intentionally absent.
- Windows MCP configs default to an absolute `node` path; portable configs use `cmd /c npx`.
