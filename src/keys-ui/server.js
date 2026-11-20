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

function statusRows(providers) {
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

function page(providers, token) {
  const data = JSON.stringify(statusRows(providers).map((row) => ({
    id: row.id,
    name: row.name,
    keysUrl: row.keysUrl,
    docsUrl: row.docsUrl,
    models: row.models,
    local: row.local,
    configured: row.configured,
    env: row.env.map((entry) => ({ name: entry.name, configured: entry.configured, source: entry.source, last4: entry.last4 }))
  }))).replace(/</g, '\\u003c');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>ModelPick · Connections</title>
<style>
:root{--bg:#090d10;--panel:#11181d;--line:#23313a;--ink:#e8f2f5;--muted:#94a7af;--teal:#5eead4;--red:#fb7185;--amber:#fbbf24}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
.wrap{width:min(980px,92vw);margin:0 auto;padding:36px 0 70px}.top{display:flex;justify-content:space-between;align-items:center;gap:16px;border-bottom:1px solid var(--line);padding-bottom:18px}
.brand{font-weight:800;letter-spacing:-.03em;font-size:20px}.brand span{color:var(--teal)}.sub{color:var(--muted);font-size:13px}
h1{font-size:clamp(28px,4vw,42px);letter-spacing:-.04em;margin:38px 0 10px;line-height:1.05}p.lede{color:var(--muted);max-width:720px;margin:0 0 26px}
.card{background:var(--panel);border:1px solid var(--line);border-radius:14px;overflow:hidden}.row{display:grid;grid-template-columns:1.4fr 1fr;gap:18px;padding:18px;border-bottom:1px solid var(--line);align-items:start}
.row:last-child{border-bottom:0}.name{font-weight:700}.meta{color:var(--muted);font-size:12px;margin-top:4px}.env{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px;color:var(--muted);margin-top:8px}
.state{font-size:12px;font-weight:700;color:var(--teal)}.missing{color:var(--amber)}.local{color:var(--teal)}
input{width:100%;padding:10px 11px;border-radius:8px;border:1px solid var(--line);background:#0a1115;color:var(--ink);font:13px ui-monospace,Consolas,monospace}
button{border:1px solid var(--line);background:#18242b;color:var(--ink);border-radius:8px;padding:9px 12px;font-weight:700;cursor:pointer}button.primary{background:var(--teal);color:#041014;border-color:var(--teal)}button.danger{color:var(--red)}
button:disabled{opacity:.5;cursor:wait}.actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:9px}a{color:var(--teal);font-size:12px;text-decoration:none}.hint{color:var(--muted);font-size:12px;margin-top:8px}
.notice{border:1px solid var(--line);background:#0c1418;border-radius:12px;padding:14px;margin:22px 0;color:var(--muted);font-size:13px}
.footer{display:flex;justify-content:space-between;gap:12px;margin-top:22px;color:var(--muted);font-size:12px;flex-wrap:wrap}.toast{position:fixed;right:20px;bottom:20px;background:#132027;border:1px solid var(--line);padding:12px 14px;border-radius:10px;color:var(--ink);font-size:13px;display:none;max-width:360px}
@media(max-width:700px){.row{grid-template-columns:1fr}}
</style></head>
<body><main class="wrap">
<div class="top"><div class="brand"><span>MP</span> ModelPick</div><div class="sub">Local connections · 127.0.0.1</div></div>
<h1>Connect the models<br>your agent can actually run.</h1>
<p class="lede">Keys stay on this machine. They are never sent to ModelPick. They are only sent to the provider you choose when you run a model.</p>
<div class="notice">This page is served from <strong>127.0.0.1</strong> with a one-time token. Close it when you are done. The file is <code>~/.modelpick/secrets.json</code> with mode <code>0600</code>.</div>
<div id="providers" class="card"></div>
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
function statusText(row) { return row.configured ? 'configured' : row.local ? 'local · no key' : 'missing'; }
function render(rows) {
  const root = document.getElementById('providers'); root.innerHTML = '';
  for (const row of rows) {
    const wrap = el('div', 'row');
    const left = el('div');
    left.append(el('div', 'name', row.name));
    left.append(el('div', 'meta', row.local ? 'Local runtime · no API key' : row.models + ' models'));
    if (row.local) {
      left.append(el('div', 'env', 'Install: ollama pull qwen2.5:0.5b'));
    } else {
      left.append(el('div', 'env', row.env.map((e) => e.name + (e.configured ? ' ✓ ' + (e.last4 || '') : '')).join(' · ')));
    }
    if (row.keysUrl) { const a = el('a', '', 'Get key ↗'); a.href = row.keysUrl; a.target = '_blank'; a.rel = 'noreferrer noopener'; left.append(a); }
    const right = el('div');
    const state = el('div', 'state', statusText(row)); if (!row.configured && !row.local) state.classList.add('missing'); if (row.local) state.classList.add('local'); right.append(state);
    if (!row.local && row.env[0]) {
      const input = el('input'); input.type = 'password'; input.placeholder = row.env[0].name; input.autocomplete = 'off'; right.append(input);
      const actions = el('div', 'actions');
      const save = el('button', 'primary', 'Save & test');
      save.onclick = async () => { try { save.disabled = true; const out = await api('/api/key', { env: row.env[0].name, value: input.value, test: true }); input.value = ''; toast(out.validation?.message || 'Saved'); render((await api('/api/status')).providers); } catch (e) { toast(e.message); save.disabled = false; } };
      actions.append(save);
      if (row.configured) { const rm = el('button', 'danger', 'Remove'); rm.onclick = async () => { try { await api('/api/remove', { env: row.env[0].name }); render((await api('/api/status')).providers); toast('Removed'); } catch (e) { toast(e.message); } }; actions.append(rm); }
      right.append(actions);
    }
    wrap.append(left, right); root.append(wrap);
  }
}
document.getElementById('close').onclick = async () => { try { await api('/api/close', {}); document.body.innerHTML = '<main class="wrap"><h1>Closed.</h1><p class="lede">You can close this tab.</p></main>'; } catch (e) { toast(e.message); } };
api('/api/status').then((data) => render(data.providers)).catch((e) => { document.getElementById('providers').textContent = e.message; });
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
      const body = page(providers, token);
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-frame-options': 'DENY', 'referrer-policy': 'no-referrer' });
      res.end(body);
      return;
    }
    if (req.method === 'GET' && url.pathname === '/api/status') return json(res, 200, { providers: statusRows(providers) });
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
