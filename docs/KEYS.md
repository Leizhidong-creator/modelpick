# Keys and connections

ModelPick separates **recommendation** from **execution**.

- `pick`, `plan`, `compare`, `show`, `decide`: no key required.
- To run a model, configure the provider key locally.

## Entry points

### Windows, one command

```bat
npm install -g modelpick
modelpick keys --ui
```

No admin rights? Use:

```bat
npx --yes --package=modelpick@latest modelpick keys --ui
```

Or double-click:

https://leizhidong-creator.github.io/modelpick/install.html

CMD does not understand bash comments. Do not paste lines starting with `#`.

### macOS / Linux

```bash
npm install -g modelpick
modelpick keys --ui

# no install
npx --yes --package=modelpick@latest modelpick keys --ui
```

### CLI wizard

```bash
modelpick keys
```

Lists providers, opens a numbered picker, reads the key with hidden input, saves it to `~/.modelpick/secrets.json` with mode `0600`, then runs a live validation when the provider supports one.

### Localhost page

```bash
modelpick keys --ui
```

Prints and opens:

```text
http://127.0.0.1:<random-port>/keys?token=<one-time-token>
```

- Binds to `127.0.0.1` only.
- Random port and one-time token.
- “Get key” links go to the provider’s own page.
- The page can save, test, and remove keys.
- The server closes after 15 minutes or when you press **Close server**.
- <kbd>Ctrl</kbd>+<kbd>C</kbd> also closes it.

It is not a remote service. If ModelPick runs on a remote host, use the CLI or SSH port-forward; do not expose the port publicly.

### Non-interactive

```bash
modelpick keys set OPENAI_API_KEY --stdin --no-test
```

`--stdin` is for secure piping. Do not put a secret in a command-line argument; it will land in shell history.

## Storage

```text
~/.modelpick/secrets.json
```

```json
{
  "schemaVersion": 1,
  "updatedAt": "2026-11-20T...",
  "keys": {
    "OPENAI_API_KEY": { "value": "...", "updatedAt": "..." }
  }
}
```

- File mode `0600` on POSIX.
- Environment variables win over the file.
- `MODELPICK_HOME` changes the directory for tests or isolated installs.
- Values are never printed by `keys list`, `doctor`, logs, or MCP responses.
- `keys list` shows only the last four characters, e.g. `…1234`.
- No telemetry, no proxy, no key in an MCP tool argument.

## Commands

```bash
modelpick keys
modelpick keys list
modelpick keys list --json
modelpick keys set OPENAI_API_KEY
modelpick keys test OPENAI_API_KEY
modelpick keys remove OPENAI_API_KEY
modelpick keys --ui
```

## Validation

`keys set` and the page’s **Save & test** make a cheap provider call:

| Provider | Check |
|---|---|
| OpenAI | `GET /v1/models` |
| Anthropic | `GET /v1/models` |
| Google Gemini | `GET /v1beta/models` |
| DeepSeek | `GET /models` |
| OpenRouter | `GET /api/v1/key` |
| Venice | `GET /api/v1/models?type=decision` |
| Tripo / fal / other media | Saved as unverified (no cheap check) |

Validation runs on the user’s machine, to the provider, with the user’s key. It is never sent to ModelPick.

## Local Ollama (no key)

Ollama is a **local runtime**, not “Llama” itself. It runs Llama, Qwen, DeepSeek distills, and other GGUF models on the user’s machine.

```bash
ollama pull qwen2.5:0.5b
ollama serve
modelpick keys list
modelpick doctor
```

- No API key.
- No API cost.
- Data stays local.
- Lower quality than cloud models.
- Text only in this release; it is not a 3D, video, or image provider.

ModelPick does **not** auto-download a model. The user chooses and pulls it.

Run the keyless path:

```bash
modelpick run "explain this function" --local
modelpick run --status
```

## For agents

`get_setup` returns:

```json
{
  "configured": false,
  "keyStatus": [{ "name": "TRIPO_API_KEY", "configured": false, "source": "none" }],
  "setupCommand": "modelpick keys set TRIPO_API_KEY",
  "setupUi": "modelpick keys --ui"
}
```

It never accepts or returns the key value. The host agent should show the command/URL to the user, not ask for the key in chat.

## What is implemented now

- Cloud **text** execution through `run_model` / `modelpick run` for OpenAI, Anthropic, Gemini, DeepSeek, and OpenRouter.
- Local Ollama text execution with no key.
- Image, video, 3D, and audio execution adapters are next.
- OS keychain storage is a later hardening step; the current file is local, atomic, and `0600`.
