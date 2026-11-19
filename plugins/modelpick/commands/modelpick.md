---
description: Pick the best model for a task, with cost per solved task
argument-hint: <what you are building or generating>
allowed-tools: Bash
---

Before choosing a model, run ModelPick for this task:

```bash
npx -y github:Leizhidong-creator/modelpick pick "$ARGUMENTS" --json
```

Read the JSON and reply with:

1. the recommended model and provider,
2. `costPerTask` (not the token price) and the number of expected attempts,
3. the exact env var from `recommendation.setup.direct.env` and the key URL,
4. one cheaper alternative and the quality trade-off.

If the task has multiple stages, use `plan` instead:

```bash
npx -y github:Leizhidong-creator/modelpick plan "$ARGUMENTS" --json
```
