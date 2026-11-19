import { ModelPickError } from './errors.js';

function normalize(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasAsciiBoundary(text, phrase) {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, 'i');
  return re.test(text);
}

function isCjk(phrase) {
  return /[\u3400-\u9fff]/.test(phrase);
}

export function scoreTask(text, task) {
  const haystack = normalize(text);
  let score = 0;
  const matched = [];
  for (const [phrase, weight] of task.keywords) {
    const needle = normalize(phrase);
    if (!needle) continue;
    const hit = isCjk(needle) ? haystack.includes(needle) : hasAsciiBoundary(haystack, needle);
    if (hit) {
      score += weight;
      matched.push(phrase);
    }
  }
  return { score, matched };
}

/**
 * Rank tasks against a natural-language request.
 * Returns candidates even when confidence is low so the UI can ask one sharp question.
 */
export function detectTask(text, tasks, options = {}) {
  const minScore = options.minScore ?? 2;
  const scored = tasks
    .map((task) => ({ task, ...scoreTask(text, task) }))
    .filter((item) => item.score >= minScore)
    .sort((a, b) => b.score - a.score || a.task.id.localeCompare(b.task.id));

  if (!scored.length) {
    return { task: null, confidence: 0, candidates: [], reason: 'NO_MATCH' };
  }

  const top = scored[0];
  const second = scored[1];
  const ratio = second ? top.score / (top.score + second.score) : 1;
  const confidence = top.score >= 6 || ratio >= 0.72 ? 'high' : top.score >= 3 ? 'medium' : 'low';

  return {
    task: top.task,
    confidence,
    score: top.score,
    matched: top.matched,
    candidates: scored.slice(0, 4).map((item) => ({
      id: item.task.id,
      label: item.task.label,
      score: item.score,
      matched: item.matched
    })),
    reason: null
  };
}

export function findTask(catalog, key) {
  if (!key) return null;
  const cleaned = String(key).trim().toLowerCase();
  const exact =
    catalog.taskById.get(cleaned) ??
    catalog.tasks.find((task) => task.label.toLowerCase() === cleaned) ??
    catalog.tasks.find((task) => task.id.startsWith(cleaned)) ??
    catalog.tasks.find((task) => task.label.toLowerCase().includes(cleaned));
  if (exact) return exact;

  const detected = detectTask(key, catalog.tasks);
  return detected.task;
}

export function resolveTask(catalog, { task, query }) {
  if (task) {
    const found = findTask(catalog, task);
    if (!found) {
      throw new ModelPickError(`Unknown task: ${task}`, {
        code: 'ERR_UNKNOWN_TASK',
        hint: `Run \`modelpick tasks\` to see ${catalog.tasks.length} supported tasks.`
      });
    }
    return { task: found, detection: { task: found, confidence: 'explicit', matched: [], candidates: [] } };
  }

  if (!query) {
    throw new ModelPickError('Tell me what you are trying to do.', {
      code: 'ERR_MISSING_TASK',
      hint: 'Example: modelpick pick "generate a 3D game asset" — or pass --task 3d-gen'
    });
  }

  const detection = detectTask(query, catalog.tasks);
  if (!detection.task) {
    throw new ModelPickError(`I could not map this to a task: "${query}"`, {
      code: 'ERR_NO_TASK_MATCH',
      hint: `Pass --task explicitly. Run \`modelpick tasks\` for the list.`
    });
  }
  return { task: detection.task, detection };
}

/**
 * Pull explicit preferences out of natural language.
 * Only strong, unambiguous phrases change behaviour; everything else stays a question.
 */
export function parseIntent(text) {
  const haystack = normalize(text);
  const intent = {};
  if (/\b(cheapest|cheap|budget|save money|low cost)\b|省钱|便宜|低成本|性价比/.test(haystack)) intent.optimize = 'cost';
  if (/\b(fastest|fast|low latency|quick)\b|最快|低延迟|速度优先/.test(haystack)) intent.optimize = 'speed';
  if (/\b(best quality|highest quality|best possible|frontier)\b|最高质量|效果最好|最好的/.test(haystack)) intent.optimize = 'quality';
  if (/\b(open[ -]?source|open[ -]?weights|self[ -]?host|local)\b|开源|本地部署/.test(haystack)) intent.openWeights = true;

  const budget = haystack.match(/(?:under|below|max|budget(?:\s+of)?|少于|低于|预算)\s*\$?\s*(\d+(?:\.\d+)?)\s*(?:usd|dollars?|美元|块)?/);
  if (budget) intent.maxCost = Number(budget[1]);

  const exclude = haystack.match(/(?:without|avoid|exclude|不要|不用|排除)\s+(openai|anthropic|google|gemini|claude|gpt|deepseek|kimi|qwen|glm|minimax|mistral|xai|grok)/);
  if (exclude) {
    const map = {
      openai: 'openai', gpt: 'openai', anthropic: 'anthropic', claude: 'anthropic',
      google: 'google', gemini: 'google', deepseek: 'deepseek', kimi: 'moonshotai',
      qwen: 'alibaba', glm: 'zai', minimax: 'minimax', mistral: 'mistral', xai: 'xai', grok: 'xai'
    };
    intent.excludeProviders = [map[exclude[1]]];
  }
  return intent;
}

export function taskListText(catalog) {
  const byModality = new Map();
  for (const task of catalog.tasks) {
    if (!byModality.has(task.modality)) byModality.set(task.modality, []);
    byModality.get(task.modality).push(task);
  }
  const lines = [];
  for (const [modality, tasks] of byModality) {
    lines.push(`${modality.toUpperCase()}`);
    for (const task of tasks) {
      lines.push(`  ${task.id.padEnd(16)} ${task.label}`);
    }
  }
  return lines.join('\n');
}
