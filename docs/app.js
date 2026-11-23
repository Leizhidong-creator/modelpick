(() => {
  const AGENTS = {
    claude: {
      name: "Claude Code",
      note: "Global MCP config + skill. Run once; works across projects. Restart and approve with /mcp.",
      file: "~/.claude.json",
      kind: "global",
      command: "modelpick setup claude-code --global --write",
      restart: "Restart Claude Code, then run /mcp. Approve modelpick once.",
      code: `{
  "mcpServers": {
    "modelpick": {
      "type": "stdio",
      "command": "modelpick",
      "args": ["mcp"]
    }
  }
}`
    },
    codex: {
      name: "Codex CLI",
      note: "Global MCP row + skill. Run once; works across projects.",
      file: "~/.codex/config.toml",
      kind: "global",
      command: "modelpick setup codex --global --write\ncodex mcp list",
      restart: "Restart Codex. modelpick should show enabled in codex mcp list.",
      code: `[mcp_servers.modelpick]
command = "modelpick"
args = ["mcp"]`
    },
    cursor: {
      name: "Cursor",
      note: "Global MCP config + skill. Run once; works across projects.",
      file: "~/.cursor/mcp.json",
      kind: "global",
      command: "modelpick setup cursor --global --write",
      restart: "Restart Cursor → Settings → MCP. modelpick should show connected.",
      code: `{
  "mcpServers": {
    "modelpick": {
      "command": "modelpick",
      "args": ["mcp"]
    }
  }
}`
    },
    dsh: {
      name: "DeepSeek Harness",
      note: "DSH loads MCP servers as Cordis rows in the profile patch. Run once per profile.",
      file: "~/.dsh/profiles/desktop/cordis.patch.yml",
      kind: "profile",
      command: "modelpick setup dsh --global --write --profile desktop",
      restart: "Restart DSH. The row is appended once; the profile is backed up first.",
      code: `- id: mcp-modelpick
  name: '@deepseek-ai/dsh-mcp-client'
  config:
    serverName: modelpick
    transport: stdio
    command: modelpick
    args: ["mcp"]`
    },
    copilot: {
      name: "Copilot CLI",
      note: "Project MCP config + skill + AGENTS.md block. Run inside the repo.",
      file: ".mcp.json",
      kind: "project",
      command: "modelpick setup copilot",
      restart: "Run copilot mcp list. modelpick should show connected.",
      code: `{
  "mcpServers": {
    "modelpick": {
      "command": "modelpick",
      "args": ["mcp"]
    }
  }
}`
    },
    vscode: {
      name: "VS Code / Copilot agent mode",
      note: "Project config using VS Code's servers schema. Run inside the repo.",
      file: ".vscode/mcp.json",
      kind: "project",
      command: "modelpick setup vscode",
      restart: "VS Code → MCP: List Servers → start modelpick.",
      code: `{
  "servers": {
    "modelpick": {
      "type": "stdio",
      "command": "modelpick",
      "args": ["mcp"]
    }
  }
}`
    }
  };

  const tabs = [...document.querySelectorAll(".agent[data-agent]")];
  const fields = {
    name: document.getElementById("agent-name"),
    note: document.getElementById("agent-note"),
    file: document.getElementById("agent-file"),
    kind: document.getElementById("agent-kind"),
    command: document.getElementById("agent-command"),
    restart: document.getElementById("agent-restart"),
    code: document.getElementById("agent-code")
  };

  function showAgent(id) {
    const agent = AGENTS[id];
    if (!agent) return;
    for (const tab of tabs) {
      const active = tab.dataset.agent === id;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", String(active));
    }
    fields.name.textContent = agent.name;
    fields.note.textContent = agent.note;
    fields.file.textContent = agent.file;
    fields.kind.textContent = agent.kind;
    fields.command.textContent = agent.command;
    fields.restart.textContent = agent.restart;
    fields.code.textContent = agent.code;
  }

  for (const tab of tabs) {
    tab.addEventListener("click", () => showAgent(tab.dataset.agent));
  }
  if (tabs.length) showAgent(tabs[0].dataset.agent);

  document.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-copy]");
    if (!button) return;
    const target = document.querySelector(button.dataset.copy);
    if (!target) return;
    const text = target.textContent.trim();
    try {
      await navigator.clipboard.writeText(text);
      const previous = button.textContent;
      button.textContent = "copied";
      button.style.color = "#3fb950";
      setTimeout(() => {
        button.textContent = previous;
        button.style.color = "";
      }, 1400);
    } catch {
      button.textContent = "select";
    }
  });

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.12 }
  );
  document.querySelectorAll(".reveal").forEach((node) => observer.observe(node));

  const typed = document.getElementById("typed");
  if (typed && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const full = typed.textContent;
    typed.textContent = "";
    let index = 0;
    const tick = () => {
      typed.textContent = full.slice(0, index);
      index += 1;
      if (index <= full.length) setTimeout(tick, 18 + Math.random() * 22);
    };
    setTimeout(tick, 420);
  }
})();
