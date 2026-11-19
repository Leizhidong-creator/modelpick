Adds **ModelPick**, a public GitHub-repo MCP server for coding agents.

- Picks the best-value model per task node (coding, image, video, 3D, audio) and prices decisions in **cost per solved task**.
- Returns the provider, env var, endpoint, and a key-aware fallback.
- CLI + stdio MCP; 40 models, 20 nodes, 18 providers.
- Install: `npx -y github:Leizhidong-creator/modelpick pick "3D sword for Unity"`.
- Repo: https://github.com/Leizhidong-creator/modelpick

Verification: 179 tests, 90.02% line coverage, 28/28 adversarial cases, 3 live endpoints, and a public test form:
https://leizhidong-creator.github.io/modelpick/test-form.html

The official npm package is pending account 2FA; the GitHub install above is tested. A static registry is also available:
`npm install modelpick --registry=https://leizhidong-creator.github.io/modelpick/npm/`

No paid placement; MIT.
