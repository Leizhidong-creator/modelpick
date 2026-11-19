# Design partners: 5 slots

ModelPick needs something a benchmark cannot give it: **your task, your fail/pass definition, your actual API costs**.

I am looking for five coding-agent teams to run `modelpick eval` on 20–50 real runs. In exchange:

- I run the analysis with you and publish what the router got wrong.
- You get a named “design partner” credit if you want it.
- No signup, no sales call, no data upload. The eval file stays on your machine.

## What you run

```bash
modelpick eval evals.json --json
```

Input:

```json
{
  "task": "coding-agent",
  "runs": [
    { "model": "claude-fable-5.2", "passed": true,  "cost": 0.59, "attempts": 1 },
    { "model": "gemini-4-carbon",  "passed": false, "cost": 0.15, "attempts": 1 },
    { "model": "gpt-6.2-sol",      "passed": true,  "cost": 0.26, "attempts": 2 }
  ]
}
```

You can redact prompts and outputs. Only the model slug, pass/fail, cost, attempts, and an optional 0–100 quality score matter.

## What I will do

1. Compare observed cost per solved task with the router's prediction.
2. Report the Wilson interval so a 5-run difference is not a ranking claim.
3. If the router picked the wrong model, add a scenario and a regression test.
4. Publish the anonymized counterexample in `docs/EVALS.md` or a launch post.

## Who this is for

- You already use Claude Code, Codex, Cursor, DSH, Copilot, or VS Code agent mode.
- You have at least one paid model key and some failed runs.
- You care about cost per finished task, not token price.
- You are willing to say “this pick is wrong” with the data.

## Who this is not for

- “Please give me 5 stars.”
- “Run this on 1,000 synthetic prompts and tell me it is good.”
- “Send me your API keys.” Never.

## Open a slot

Use the **Design partner** issue template:

https://github.com/Leizhidong-creator/modelpick/issues/new?template=design_partner.yml

Or reply to the pinned post on X:

https://x.com/DurgaraoGa51557/status/2123360126975558084

Slots: **5**. When they are full, the form stays open but the response time is weekly, not same-day.

## Why this matters

The current benchmark is expert-authored. The current media scores are priors. The current retry curve is a model. A design partner with real runs is the only thing that can turn those into evidence.

If you are not one of the five, you can still run `eval` and open an issue with the result. A reproducible counterexample is worth more than a star.
