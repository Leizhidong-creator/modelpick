# X thread — 中文（原生写作，不是翻译）

第 1 条 07:00 PT / 23:00 CST 发；链接只放第 9 条；20 分钟后 quote 第 1 条并附图。

---

**1/**
你的编程 Agent 选模型，基本靠感觉。

同一个任务，有人用最贵的模型跑分类，有人用生图模型做 3D 道具。

我把「解决一个任务到底多少钱」算出来了：同一个节点，最便宜和最贵差 53 倍；但便宜 23.5 个质量分。🧵

**2/**
单价不是成本。

成本 = token × 单价
真实成本 = token × 单价 × 一次通过所需次数

大部分工具只算第一行。账单的大头在第二行。

**3/**
同一个编程任务（输入 80k / 输出 8k / 缓存 60%）：

Fable 5.2：$0.59 → **$0.64/解决**（92.3 分）
Gemini 4 Carbon：$0.15 → **$0.17/解决**（87.3 分）
DeepSeek V4.1 Flash：$0.010 → **$0.015/解决**（70.7 分）
Claude Haiku 5.5：$0.008 → **$0.012/解决**（68.8 分）

便宜 53 倍，质量低 23.5 分。真正值得看的是第三行。

**4/**
所以我做了 **ModelPick**：一个 CLI + MCP server，按「节点」选模型。

20 个节点、40 个模型、18 家供应商。
文本 · 图片 · 视频 · 3D · 音频。

`npx -y github:Leizhidong-creator/modelpick pick "给 Unity 做一个 3D 剑"`

不用 API key 就能得到推荐。

**5/**
它给你的不是排行榜，而是一个可执行决策：

→ 这个任务用哪个模型
→ 每个可用产物的成本（含重试）
→ 为什么，以及你放弃了什么
→ 环境变量、申请 key 的链接

[terminal-pick.png]

**6/**
没人覆盖的部分：多模态节点。

同一套算法，不同的计价单位：
· 3D 资产 $0.59/个（Hunyuan3D 3.1 Pro）
· 3D 资产 $0.21/个（Tripo H3.1）
· 图片 $0.035/张（Nano Banana 2.1）
· 5 秒视频 $0.60/条（Veo 3.1 Fast）

做 favicon 不该用 hero image 的模型。

**7/**
它不是代理。

不存 key、不过我的服务器、不是 SaaS。
它输出一份计划，由 Claude Code、Codex、Cursor、DeepSeek Harness 执行。

一条命令写好 MCP 配置 + skill：
`modelpick setup claude-code`

**8/**
诚实说明：

· 这是「决策 benchmark」，不是模型输出 benchmark。
· 媒体质量分是先验，不是独立实测。
· 预期尝试次数是透明模型，不是实测 pass@1。
· 目录是带日期的快照，`modelpick update` 可刷新。

全部写在 repo 里。

**9/**
Repo + benchmark + 原始失败记录：

https://github.com/Leizhidong-creator/modelpick

`npx -y github:Leizhidong-creator/modelpick pick "你的任务"`

你觉得你技术栈里最被高估的节点是哪个？#MCP #AIAgents
