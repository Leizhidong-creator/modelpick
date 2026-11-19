The role split is the right frame, but I would treat the three roles as three different **constraint sets**, not three model names:

- **Planner**: long context + tools + high quality. Subscription-billed, so budget in turns/tokens and rate-limit windows, not dollars.
- **Executor**: cheap, tool use, cost per solved task. Measure attempts, not just first-token price.
- **Verifier**: must be a different family from the executor; strict JSON; quality over speed.

For the subscription-vs-API accounting:

- Log `turn.completed` usage per run.
- Keep a separate ledger for subscription turns/tokens and API dollars.
- Set a hard stop on whichever limit binds first (turns/day or rate-limit), not a synthetic dollar conversion.

For validation, use a pass/fail file per role and report Wilson intervals, not a single pass rate. I built ModelPick around this (`modelpick eval`); the format and caveats are public: https://github.com/Leizhidong-creator/modelpick/blob/main/docs/EVALS.md. The useful part is the role→node→constraint mapping, not the specific model list.
