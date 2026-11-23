import http from 'node:http';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { URL } from 'node:url';
import { ModelPickError } from '../core/errors.js';
import { getSecret, removeSecret, secretStatus, setSecret } from '../core/secrets.js';
import { checkOllama, validateKey } from '../core/key-check.js';

const MAX_BODY = 64 * 1024;
const IDLE_MS = 15 * 60 * 1000;

function esc(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function knownEnvSet(providers) {
  return new Set(providers.flatMap((provider) => provider.env));
}

function statusRows(providers, ollama = null) {
  return providers.map((provider) => {
    const env = (provider.env ?? []).map((name) => secretStatus(name));
    return {
      id: provider.id,
      name: provider.name,
      keysUrl: provider.keysUrl ?? null,
      docsUrl: provider.docsUrl ?? null,
      models: provider.models?.length ?? 0,
      local: (provider.env ?? []).length === 0 || provider.id === 'ollama',
      configured: env.some((entry) => entry.configured),
      ollama: provider.id === 'ollama' ? ollama : undefined,
      env
    };
  });
}

function json(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff'
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(new ModelPickError('Request body too large.', { code: 'ERR_BODY_TOO_LARGE' }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'));
      } catch {
        reject(new ModelPickError('Invalid JSON body.', { code: 'ERR_INVALID_JSON' }));
      }
    });
    req.on('error', reject);
  });
}

function auth(req, url, token) {
  const header = req.headers['x-modelpick-token'];
  const query = url.searchParams.get('token');
  return header === token || query === token;
}

function page(providers, token, ollama = null) {
  const data = JSON.stringify(statusRows(providers, ollama).map((row) => ({
    id: row.id,
    name: row.name,
    keysUrl: row.keysUrl,
    docsUrl: row.docsUrl,
    models: row.models,
    local: row.local,
    configured: row.configured,
    ollama: row.ollama ?? null,
    env: row.env.map((entry) => ({ name: entry.name, configured: entry.configured, source: entry.source, last4: entry.last4 }))
  }))).replace(/</g, '\\u003c');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>ModelPick · Connections</title>
<style>
:root{--bg:#080c0f;--panel:#10171c;--panel2:#0c1317;--line:#22313a;--ink:#eef6f8;--muted:#9aadb5;--teal:#5eead4;--green:#34d399;--amber:#fbbf24;--red:#fb7185}
*{box-sizing:border-box}body{margin:0;background:radial-gradient(900px 500px at 50% -180px,#123039 0,var(--bg) 62%);color:var(--ink);font:15px/1.55 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
.wrap{width:min(1040px,94vw);margin:0 auto;padding:26px 0 64px}
.top{display:flex;justify-content:space-between;align-items:center;gap:16px;padding-bottom:16px;border-bottom:1px solid var(--line)}
.brand{font-weight:800;letter-spacing:-.03em;font-size:19px}.brand span{color:var(--teal)}.sub{color:var(--muted);font-size:12px}
.hero{padding:34px 0 8px}.eyebrow{color:var(--teal);font-size:11px;font-weight:800;letter-spacing:.16em;text-transform:uppercase}
h1{font-size:clamp(30px,4.4vw,48px);letter-spacing:-.045em;margin:8px 0 10px;line-height:1.02}p.lede{color:var(--muted);max-width:760px;margin:0 0 18px}
.steps{display:flex;gap:10px;flex-wrap:wrap;margin:18px 0 0}.step{border:1px solid var(--line);background:var(--panel2);border-radius:999px;padding:7px 12px;color:var(--muted);font-size:12px}.step b{color:var(--ink)}
.progress{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:22px 0 14px;padding:12px 14px;border:1px solid var(--line);border-radius:12px;background:var(--panel2);font-size:13px}.progress strong{color:var(--teal)}
.toolbar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:14px 0}.search{flex:1 1 260px;padding:11px 13px;border-radius:10px;border:1px solid var(--line);background:var(--panel2);color:var(--ink);font:14px inherit}
.filters{display:flex;gap:6px;background:var(--panel2);border:1px solid var(--line);border-radius:10px;padding:3px}.filter{border:0;background:transparent;color:var(--muted);padding:8px 11px;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer}.filter.active{background:#1b2a31;color:var(--ink)}
.card{background:var(--panel);border:1px solid var(--line);border-radius:16px;overflow:hidden}
.row{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(300px,.9fr);gap:22px;padding:18px;border-bottom:1px solid var(--line);align-items:start}.row:last-child{border-bottom:0}.row.local{background:linear-gradient(90deg,rgba(94,234,212,.05),transparent 58%)}
.name{font-weight:750;font-size:16px}.meta{color:var(--muted);font-size:12px;margin-top:3px}.env{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:11px;color:var(--muted);margin-top:7px;overflow-wrap:anywhere}
.pill{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:800;border-radius:999px;padding:4px 9px;border:1px solid var(--line);color:var(--muted)}.pill.ok{color:var(--green);border-color:rgba(52,211,153,.35);background:rgba(52,211,153,.06)}.pill.warn{color:var(--amber);border-color:rgba(251,191,36,.3);background:rgba(251,191,36,.06)}.pill.local{color:var(--teal);border-color:rgba(94,234,212,.35);background:rgba(94,234,212,.06)}
input{width:100%;padding:10px 11px;border-radius:9px;border:1px solid var(--line);background:#080f12;color:var(--ink);font:13px ui-monospace,Consolas,monospace}input:focus{outline:2px solid rgba(94,234,212,.35);outline-offset:1px}
button{border:1px solid var(--line);background:#18252c;color:var(--ink);border-radius:9px;padding:9px 12px;font-size:13px;font-weight:700;cursor:pointer}button.primary{background:var(--teal);color:#041014;border-color:var(--teal)}button.danger{color:var(--red)}button:disabled{opacity:.55;cursor:wait}
.actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:9px}.linkrow{display:flex;gap:10px;flex-wrap:wrap;margin-top:8px}a{color:var(--teal);font-size:12px;text-decoration:none}a:hover{text-decoration:underline}
.hint{color:var(--muted);font-size:12px;margin-top:8px}.command{font-family:ui-monospace,Consolas,monospace;background:#080f12;border:1px solid var(--line);border-radius:8px;padding:7px 9px;color:var(--muted);font-size:11px;display:inline-block;margin-top:7px;overflow-wrap:anywhere}
.notice{border:1px solid var(--line);background:var(--panel2);border-radius:12px;padding:12px 14px;margin:18px 0;color:var(--muted);font-size:12px}
.footer{display:flex;justify-content:space-between;gap:12px;margin-top:20px;color:var(--muted);font-size:12px;flex-wrap:wrap}
.empty{display:none;padding:32px 18px;text-align:center;color:var(--muted)}
.toast{position:fixed;right:18px;bottom:18px;background:#122028;border:1px solid var(--line);padding:12px 14px;border-radius:10px;color:var(--ink);font-size:13px;display:none;max-width:380px;box-shadow:0 18px 50px rgba(0,0,0,.4)}
@media(max-width:760px){.wrap{padding-top:18px}.row{grid-template-columns:1fr;gap:12px}.filters{width:100%;justify-content:space-between}.filter{flex:1}}
</style></head>
<body><main class="wrap">
<div class="top"><div class="brand"><span>MP</span> ModelPick</div><div class="sub">Local connections · 127.0.0.1</div></div>
<section class="hero">
<div class="eyebrow">Local connections</div>
<h1>Connect a model.</h1>
<p class="lede">Pick a provider, paste its API key, and test it. The key stays on this machine. It is only sent to the provider when you run a model.</p>
<div class="steps"><span class="step"><b>1</b> Choose provider</span><span class="step"><b>2</b> Get a key</span><span class="step"><b>3</b> Paste &amp; test</span></div>
</section>
<div class="progress"><span><strong id="ready">0</strong> <span id="readyText">keys connected</span></span><span id="localText"></span></div>
<div class="toolbar">
<input id="search" class="search" type="search" placeholder="Search provider or env var..." aria-label="Search providers">
<div class="filters" id="filters">
<button class="filter active" data-filter="all">All</button>
<button class="filter" data-filter="missing">Needs key</button>
<button class="filter" data-filter="ready">Connected</button>
</div>
</div>
<div id="providers" class="card"></div>
<div id="empty" class="empty">No provider matches that search.</div>
<div style="text-align:center;margin:14px 0"><button id="toggleAll" class="filter" style="border:1px solid var(--line);background:var(--panel2);padding:9px 14px">Show all providers</button></div>
<div class="notice">Served from <strong>127.0.0.1</strong> with a one-time token. Stored in <code>~/.modelpick/secrets.json</code> with mode <code>0600</code>. Close this page when you are done.</div>
<div class="footer"><span>No telemetry. No proxy. No key in MCP arguments.</span><button id="close" class="danger">Close server</button></div>
<div id="toast" class="toast"></div>
</main>
<script>
const TOKEN = ${JSON.stringify(token)};
const PROVIDERS = ${data};
const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
function toast(message) { const t = document.getElementById('toast'); t.textContent = message; t.style.display = 'block'; setTimeout(() => { t.style.display = 'none'; }, 3500); }
async function api(path, body) {
  const res = await fetch(path, { method: body ? 'POST' : 'GET', headers: { 'content-type': 'application/json', 'x-modelpick-token': TOKEN }, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.error || 'Request failed');
  return data;
}
const state = { q: '', filter: 'all', expanded: false };
let ALL = PROVIDERS;
const $ = (id) => document.getElementById(id);
function readyCount(rows) { return rows.filter((row) => row.configured).length; }
function visible(rows) {
  const q = state.q.trim().toLowerCase();
  return rows.filter((row) => {
    if (state.filter === 'missing' && (row.configured || row.local)) return false;
    if (state.filter === 'ready' && !(row.configured || row.local)) return false;
    if (!q) return true;
    return (row.name + ' ' + row.env.map((entry) => entry.name).join(' ')).toLowerCase().includes(q);
  }).sort((a, b) => {
    if (a.local !== b.local) return a.local ? -1 : 1;
    if (a.configured !== b.configured) return a.configured ? -1 : 1;
    const priority = ['openai', 'anthropic', 'google', 'deepseek', 'openrouter', 'tripo', 'fal', 'minimax', 'moonshotai'];
    const ai = priority.indexOf(a.id); const bi = priority.indexOf(b.id);
    if (ai !== bi) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    return a.name.localeCompare(b.name);
  });
}
function pill(cls, text) { return el('span', 'pill ' + cls, text); }
function card(row) {
  const wrap = el('div', 'row' + (row.local ? ' local' : ''));
  const left = el('div');
  left.append(el('div', 'name', row.name));
  left.append(el('div', 'meta', row.local ? 'Local runtime · no API key' : row.models + ' models'));
  if (row.local) {
    left.append(el('div', 'env', 'No key. Runs on 127.0.0.1:11434.'));
    const command = el('span', 'command', 'ollama pull qwen2.5:0.5b');
    const copy = el('button', '', 'Copy command');
    copy.style.marginLeft = '8px';
    copy.onclick = async () => { try { await navigator.clipboard.writeText(command.textContent); toast('Command copied'); } catch { toast(command.textContent); } };
    left.append(document.createElement('br'), command, copy);
  } else {
    left.append(el('div', 'env', row.env.map((entry) => entry.name + (entry.configured ? ' · ' + (entry.last4 || 'set') : '')).join(' · ')));
  }
  if (row.keysUrl) {
    const a = el('a', '', row.local ? 'Install Ollama ↗' : 'Get a key ↗');
    a.href = row.keysUrl; a.target = '_blank'; a.rel = 'noreferrer noopener';
    left.append(document.createElement('br'), a);
  }
  const right = el('div');
  if (row.local) {
    right.append(pill(row.ollama && row.ollama.running ? 'ok' : 'warn', row.ollama && row.ollama.running ? 'running' : 'not detected'));
    right.append(el('div', 'hint', row.ollama && row.ollama.models && row.ollama.models.length ? 'Models: ' + row.ollama.models.join(', ') : 'Install Ollama, then pull a model.'));
  } else if (row.env[0]) {
    const configured = row.configured;
    right.append(pill(configured ? 'ok' : 'warn', configured ? 'connected' : 'needs key'));
    const input = el('input');
    input.type = 'password'; input.placeholder = configured ? 'Replace key...' : row.env[0].name; input.autocomplete = 'off';
    input.setAttribute('aria-label', row.env[0].name);
    right.append(input);
    const actions = el('div', 'actions');
    const save = el('button', 'primary', 'Save & test');
    save.onclick = async () => {
      if (!input.value.trim()) { toast('Paste a key first'); input.focus(); return; }
      try {
        save.disabled = true; save.textContent = 'Testing...';
        const out = await api('/api/key', { env: row.env[0].name, value: input.value, test: true });
        input.value = '';
        toast(out.validation && out.validation.message ? out.validation.message : 'Saved and tested');
        await refresh();
      } catch (e) {
        toast(e.message); save.disabled = false; save.textContent = 'Save & test';
      }
    };
    actions.append(save);
    if (configured) {
      const remove = el('button', 'danger', 'Remove');
      remove.onclick = async () => {
        try { await api('/api/remove', { env: row.env[0].name }); toast('Removed'); await refresh(); }
        catch (e) { toast(e.message); }
      };
      actions.append(remove);
    }
    right.append(actions);
  }
  wrap.append(left, right);
  return wrap;
}
function draw() {
  const root = $('providers'); root.innerHTML = '';
  const rows = visible(ALL);
  const collapsed = state.filter === 'all' && !state.q && !state.expanded;
  const shown = collapsed ? rows.slice(0, 8) : rows;
  const connected = readyCount(ALL);
  $('ready').textContent = String(connected);
  $('readyText').textContent = connected === 1 ? 'key connected' : 'keys connected';
  const local = ALL.find((row) => row.local);
  $('localText').textContent = local ? (local.ollama && local.ollama.running ? 'Ollama running' : 'Ollama not detected') : '';
  if (!rows.length) { $('empty').style.display = 'block'; $('toggleAll').style.display = 'none'; return; }
  $('empty').style.display = 'none';
  for (const row of shown) root.append(card(row));
  $('toggleAll').style.display = rows.length > 8 ? 'inline-block' : 'none';
  $('toggleAll').textContent = collapsed ? 'Show all ' + rows.length + ' providers' : 'Show fewer';
}
async function refresh() {
  try { ALL = (await api('/api/status')).providers; draw(); }
  catch (e) { toast(e.message); }
}
document.querySelectorAll('.filters .filter').forEach((button) => {
  button.onclick = () => {
    document.querySelectorAll('.filter').forEach((item) => item.classList.toggle('active', item === button));
    state.filter = button.dataset.filter; draw();
  };
});
$('search').addEventListener('input', (event) => { state.q = event.target.value; draw(); });
$('toggleAll').onclick = () => { state.expanded = !state.expanded; draw(); };
document.getElementById('close').onclick = async () => { try { await api('/api/close', {}); document.body.innerHTML = '<main class="wrap"><h1>Closed.</h1><p class="lede">You can close this tab.</p></main>'; } catch (e) { toast(e.message); } };
draw();
refresh();
</script></body></html>`;
}

export function createKeysUiServer({ providers, token, onClose } = {}) {
  if (!token) throw new Error('A UI token is required.');
  const known = knownEnvSet(providers);
  let closed = false;
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    if (!auth(req, url, token)) return json(res, 401, { error: 'unauthorized', message: 'Invalid or missing token.' });
    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/keys')) {
      const body = page(providers, token, await checkOllama());
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-frame-options': 'DENY', 'referrer-policy': 'no-referrer' });
      res.end(body);
      return;
    }
    if (req.method === 'GET' && url.pathname === '/api/status') return json(res, 200, { providers: statusRows(providers, await checkOllama()) });
    if (req.method === 'GET' && url.pathname === '/api/ollama') {
      const result = await checkOllama();
      return json(res, 200, result);
    }
    if (req.method === 'POST' && url.pathname === '/api/key') {
      try {
        const body = await readBody(req);
        if (!body.env || !known.has(body.env)) return json(res, 400, { error: 'unknown_env', message: 'Unknown provider key name.' });
        const status = setSecret(body.env, body.value);
        const validation = body.test === false ? null : await validateKey(body.env, getSecret(body.env));
        return json(res, 200, { status, validation });
      } catch (error) {
        return json(res, 400, { error: error.code || 'ERR_KEY', message: error.message });
      }
    }
    if (req.method === 'POST' && url.pathname === '/api/remove') {
      try {
        const body = await readBody(req);
        if (!body.env || !known.has(body.env)) return json(res, 400, { error: 'unknown_env' });
        return json(res, 200, { removed: removeSecret(body.env) });
      } catch (error) {
        return json(res, 400, { error: error.code || 'ERR_KEY', message: error.message });
      }
    }
    if (req.method === 'POST' && url.pathname === '/api/test') {
      try {
        const body = await readBody(req);
        if (!body.env || !known.has(body.env)) return json(res, 400, { error: 'unknown_env' });
        const value = getSecret(body.env);
        if (!value) return json(res, 400, { error: 'missing_key', message: 'Not configured.' });
        return json(res, 200, await validateKey(body.env, value));
      } catch (error) {
        return json(res, 400, { error: error.code || 'ERR_KEY', message: error.message });
      }
    }
    if (req.method === 'POST' && url.pathname === '/api/close') {
      json(res, 200, { closed: true });
      close();
      return;
    }
    return json(res, 404, { error: 'not_found' });
  });
  const close = () => {
    if (closed) return;
    closed = true;
    server.close();
    onClose?.();
  };
  server.on('close', () => { if (!closed) { closed = true; onClose?.(); } });
  return { server, close, statusRows: () => statusRows(providers) };
}

function openBrowser(url) {
  try {
    if (process.platform === 'win32') {
      spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' }).unref();
    } else if (process.platform === 'darwin') {
      spawn('open', [url], { detached: true, stdio: 'ignore' }).unref();
    } else {
      spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref();
    }
  } catch {
    // The URL is printed; the user can open it manually.
  }
}

export async function runKeysUi({ ctx, providers }) {
  const token = crypto.randomBytes(24).toString('hex');
  let resolveClosed;
  const closed = new Promise((resolve) => { resolveClosed = resolve; });
  const ui = createKeysUiServer({ providers, token, onClose: resolveClosed });
  await new Promise((resolve, reject) => {
    ui.server.once('error', reject);
    ui.server.listen(0, '127.0.0.1', resolve);
  });
  const address = ui.server.address();
  const url = `http://127.0.0.1:${address.port}/keys?token=${token}`;
  const s = ctx.style;
  console.log(`\n  ${s.bold('ModelPick keys')} ${s.dim('— localhost only')}`);
  console.log(`  ${s.cyan(url)}\n`);
  console.log(`  ${s.dim('Keys stay on this machine; close the page or press Ctrl+C when done.')}\n`);
  if (!ctx.flags['no-open']) openBrowser(url);
  const timer = setTimeout(() => ui.close(), IDLE_MS);
  const onSignal = () => { ui.close(); };
  process.once('SIGINT', onSignal);
  try {
    await closed;
  } finally {
    clearTimeout(timer);
    process.removeListener('SIGINT', onSignal);
    ui.close();
  }
}
