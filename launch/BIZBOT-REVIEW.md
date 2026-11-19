# BizBot review

I read the repository and the deployment model. I did **not** deploy it, and I would not run its automated outreach against ModelPick's behalf without a human in the loop.

## What it is

- Repo: https://github.com/xnx3/bizbot
- License: Apache-2.0
- Seven GitHub stars at review time
- Linux/Ubuntu deployment (1 vCPU / 2 GB RAM)
- Scans public sources for people/companies that might be interested, then runs automated conversations; exposes an API/CRM integration

## What is worth borrowing

1. **Intent signals, not a generic email list.** Search for people already asking the question.
2. **A queue with a score.** Source, reason, last touch, next step.
3. **CRM handoff.** Keep the conversation and the outcome in one place.
4. **Follow-up discipline.** One follow-up, then stop.

## What I will not do

- Run unsolicited automated DMs/emails at volume.
- Let an agent make product claims or pricing promises without review.
- Scrape private contact data.
- Use the tool as a substitute for a real design partner conversation.

Those are not “marketing growth”; they are how the domain, the X account, and the GitHub account get restricted.

## Compliant pilot instead

- 20 targets/week from explicit public intent.
- One human-written message per target.
- One follow-up maximum.
- Track: reply, install, eval file, counterexample.
- Kill a channel after 20 touches with no qualified reply.

## Actual intent queries

```text
"model routing" is:issue is:open
"model picker" LLM is:issue
"cost per task" LLM is:issue
"agent cost" MCP is:issue
"which model" "Claude Code" is:issue
```

Public examples worth reading (not auto-replying):

- https://github.com/awslabs/mcp/issues/4772 — RFC for an agent-cost MCP server; overlaps with ModelPick’s cost-per-task framing.
- https://github.com/flisk-sh/flisk/issues/4056 — cost-per-task gateway feature.
- https://github.com/InftyAI/Awesome-LLMOps/issues/665 — LLM Cost per Task project submission (not a user request).
- https://github.com/yaalalabs/agent-kernel/issues/969 — agent cost management epic.

## Verdict

BizBot’s **signal → queue → CRM** idea is useful. Its **automated mass conversation** part is the part I will not use. The compliant version is smaller, slower, and more likely to produce a real design partner.
