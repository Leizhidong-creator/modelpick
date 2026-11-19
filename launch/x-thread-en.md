# X thread — English

Post 1 at 07:00 PT / 23:00 CST. Link only in post 9. Quote-post post 1 with the terminal GIF 20 minutes later.

---

**1/**
Your coding agent picks one model for everything.

A frontier model to classify a ticket. A frontier model to generate a barrel prop. A frontier model to draft a thumbnail.

I measured what each node actually costs per **solved** task. The cheap model won some nodes and lost badly on others. 🧵
**2/**
Price per token is not cost.

cost  = tokens × price
COST  = tokens × price × attempts_to_pass

Most tools optimize the first line. Your bill lives on the second.

**3/**
Same coding task, 80k in / 8k out, 60% cache:

Fable 5.2   $0.59 raw · 92.3 quality · **$0.64/solved**
Gemini Carbon $0.15 raw · 87.3 quality · **$0.17/solved**
DeepSeek V4.1 Flash $0.010 raw · 70.7 quality · **$0.015/solved**
Haiku 5.5 $0.008 raw · 68.8 quality · **$0.012/solved**

The cheap model is 53× cheaper and 23.5 points worse. The interesting row is the third.

**4/**
So I built **ModelPick**: a CLI + MCP server that picks a model per node.

20 nodes. 40 models. 18 providers.
text · image · video · 3D · audio.

`npx -y github:Leizhidong-creator/modelpick pick "3D sword for a Unity game"`

No API key needed to decide.

**5/**
The output is not a leaderboard. It is a decision:

→ best model for this task
→ cost per usable output (retries included)
→ why, and what you give up
→ the env var + key URL to connect

[terminal-pick.png]

**6/**
The part nobody covers: creative nodes.

Same math, different unit:
· $0.59 per 3D asset (Hunyuan3D 3.1 Pro)
· $0.21 per 3D asset (Tripo H3.1)
· $0.035 per image (Nano Banana 2.1)
· $0.60 per 5s clip (Veo 3.1 Fast)

Your agent should not use a hero-image model for a favicon.

**7/**
It is not a proxy.

No keys stored. No traffic through my server. No SaaS.
It emits a plan; Claude Code, Codex, Cursor, or DeepSeek Harness executes it.

One command writes the MCP config + skill:
`modelpick setup claude-code`

**8/**
Honest limits:

· It is a decision benchmark, not a model-output benchmark.
· Media quality scores are priors, not independent measurements.
· Expected attempts is a transparent model, not measured pass@1.
· The catalog is a dated snapshot; `modelpick update` refreshes it.

All of this is in the repo.

**9/**
Repo + full benchmark + raw failures:

https://github.com/Leizhidong-creator/modelpick

`npx -y github:Leizhidong-creator/modelpick pick "your task"`

Which node do you think is most overpayed in your stack? #MCP #AIAgents
