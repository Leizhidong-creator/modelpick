# Launch metrics

## 2026-11-19

- First product post on X: https://x.com/DurgaraoGa51557/status/2123360126975558084
- Status: pinned to the profile
- Content: product only; no unrelated or political posts
- Followers at post time: 0
- GitHub stars at post time: 1
- GitHub forks: 0
- Video: link to https://leizhidong-creator.github.io/modelpick/
- Image: `assets/social-preview.png`

Next check: 24h after the first reply-first session. Record profile clicks, repo clicks, installs, and any reply that contains a real counterexample.

Do not record star counts as the only success metric. A reply that says “your pick is wrong for this task” is more valuable than 10 empty stars.

- Design partner reply posted under the pinned post: 5 slots, eval file, no signup.
- Reply views at posting: 4; no external users yet.

## GitHub outreach

- Commented on DigiBanks99/lopen#51 (model routing design): https://github.com/DigiBanks99/lopen/issues/51#issuecomment-7007416128
- Commented on jim-at-jibba/agent-os#4 (planner/executor/verifier routing): https://github.com/jim-at-jibba/agent-os/issues/4#issuecomment-7007430751
- Both comments lead with a concrete design, disclose ModelPick, and do not ask for a star.

## More GitHub outreach

- michael-muir/software-factory#20 (model router epic): https://github.com/michael-muir/software-factory/issues/20#issuecomment-7007576626
- 8gi-foundation/8gent-code#73 (role-based routing): https://github.com/8gi-foundation/8gent-code/issues/73#issuecomment-7007577565

## Build-in-public calibration post

- https://x.com/DurgaraoGa51557/status/2123378270897107227
- Content: the two score reductions (Nano Banana Pro 96→91, Veo 3.1 95→89), 40 models / 20 nodes / 177 tests, repo link. Product only.

## Gemini 4 Neon reply

- https://x.com/DurgaraoGa51557/status/2123390704668102826
- Reply under Google AI's 94K-view Gemini 4 Neon launch post.
- Value-first: pricing, 1M context, no published benchmark, estimated-prior experiment, top-1 drop 100%→96.5%, 4 failed picks. One repo link.
- The model is deliberately **not** in the catalog until task-level evidence exists.

## GPT-6.2 Astra reply

- https://x.com/DurgaraoGa51557/status/2123391421210407419
- Reply under OpenAI's GPT-6.2 Astra launch post (1.1M views at posting).
- Value-first: official benchmark acknowledged, then workload-specific numbers: Astra $0.68/solved vs Sol $0.18 vs Fable 5.2 $0.64 at 80k/8k/60% cache; routing is per node.

## Claude Fable 5.2 reply

- https://x.com/DurgaraoGa51557/status/2123392183323762781
- Reply under Anthropic's Claude Fable 5.2 / Mythos 5.2 launch post.
- Value-first: 80k/8k/60% cache comparison, Fable $0.64 vs Astra $0.68 vs Sol $0.18; Fable wins hero coding, not every node.

## Directory submission

- Opened PR to Awesome MCP Servers (98.2k stars): https://github.com/punkpeye/awesome-mcp-servers/pull/20045
- Entry under Coding Agents; title includes the agent fast-track marker.
- State at submission: OPEN, MERGEABLE, no review comments.

## Official npm + launch post

- `modelpick@0.1.0` is live on the public npm registry: https://www.npmjs.com/package/modelpick
- Clean-project verification: `npm install modelpick` -> `0.1.0`; `modelpick verify` -> `ok: true`; VS Code setup dry-run works.
- npm showed the normal `0.0.0-stage` processing placeholder briefly; version `0.1.0` and `latest` are correct.
- Launch post: https://x.com/DurgaraoGa51557/status/2123398907225162026

## Targeted router reply

- https://x.com/DurgaraoGa51557/status/2123401451980611630
- Reply to a developer who routed 2,564 coding-agent requests through a local LLM router.
- Value-first: 184 read tokens per written token; cost per solved task with retries; invited the actual log to the CSV eval.

## Targeted routing-policy reply

- https://x.com/DurgaraoGa51557/status/2123401908903903331
- Reply to a post arguing support and financial agents need different routing policies.
- Value-first: policy boundary, hard constraints per node, cost per solved task.

## Targeted retry reply

- https://x.com/DurgaraoGa51557/status/2123402250181865903
- Reply to a benchmark post about a 63%-cheaper model.
- Value-first: one benchmark is not one solved task; 20% failure means 1.25 attempts; asked whether it still wins after retries.
