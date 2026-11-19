# Security policy

## What ModelPick does not do

- It does not proxy model requests or hold API keys.
- It does not read, print, or transmit the value of any environment variable.
- It does not phone home, collect telemetry, or include analytics.
- It does not execute model output or task text as shell commands.

## Reporting a vulnerability

Open a private security advisory at:

https://github.com/Leizhidong-creator/modelpick/security/advisories/new

Please include a reproduction and the affected version. Do not open a public issue for a live vulnerability.

We aim to acknowledge within 72 hours and ship a fix within 14 days for high-severity issues.

## Threat model

| Surface | Risk | Mitigation |
|---|---|---|
| `modelpick keys` | leaking secret values | reads presence only; never prints values; tests assert it |
| `modelpick setup` | clobbering agent config | validates JSON; backs up; refuses invalid files; idempotent blocks |
| MCP server | prompt injection via tool output | task text is data; no shell interpolation; tool errors are structured |
| Catalog update | poisoned remote snapshot | schema validation; cache only used if version is newer; bundled snapshot is fallback |
| User overrides | malformed model data | full validation before use |
| CLI JSON | terminal escape injection | output is plain JSON; no ANSI in `--json` mode |

## Supported versions

| Version | Supported |
|---|---|
| 0.1.x | yes |
| < 0.1 | no |

## Dependencies

Runtime dependencies: **zero**. Dev tooling is Node's built-in test runner and Python/Pillow only for regenerating images. This removes the supply-chain surface that a typical CLI inherits.
