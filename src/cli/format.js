import { createStyler, displayWidth, pad, symbols, truncate } from '../util/ansi.js';

const S = symbols();

export function makeStyle(enabled) {
  return createStyler(enabled);
}

export function money(value) {
  if (value == null || !Number.isFinite(value)) return '—';
  if (value === 0) return '$0';
  if (value < 0.01) return `$${value.toFixed(4)}`;
  if (value < 1) return `$${value.toFixed(3)}`;
  if (value < 100) return `$${value.toFixed(2)}`;
  return `$${Math.round(value).toLocaleString('en-US')}`;
}

export function num(value, digits = 1) {
  if (value == null || !Number.isFinite(value)) return '—';
  return value.toFixed(digits).replace(/\.0$/, '');
}

export function wrap(text, width = 76, indent = '') {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (displayWidth(candidate) > width && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines.map((item) => indent + item).join('\n');
}

export function bulletList(items, { width = 76, indent = '  ', style, marker = S.bullet } = {}) {
  const lines = [];
  for (const item of items) {
    const wrapped = wrap(item, width - 4, '');
    const parts = wrapped.split('\n');
    lines.push(`${indent}${style ? style.dim(marker) : marker} ${parts[0]}`);
    for (const extra of parts.slice(1)) lines.push(`${indent}  ${extra}`);
  }
  return lines.join('\n');
}

export function rule(width = 76, style) {
  const line = S.line.repeat(Math.max(10, width));
  return style ? style.dim(line) : line;
}

function scoreBar(value, width = 10, style) {
  const filled = Math.round((Math.max(0, Math.min(100, value)) / 100) * width);
  const bar = '█'.repeat(filled) + '░'.repeat(width - filled);
  if (!style) return bar;
  return value >= 80 ? style.green(bar) : value >= 60 ? style.cyan(bar) : style.yellow(bar);
}

function confidenceLabel(confidence, style) {
  if (confidence === 'explicit') return style.green('explicit task');
  if (confidence === 'high') return style.green('high confidence');
  if (confidence === 'medium') return style.yellow('medium confidence');
  return style.yellow('low confidence');
}

export function renderHeader({ version, catalogVersion, updatedAt }, { style, width = 76 }) {
  const left = `${style.bold(style.cyan(`${S.spark} modelpick`))} ${style.dim(`v${version}`)}`;
  const right = style.dim(`catalog ${catalogVersion ?? '—'}`);
  const gap = Math.max(2, width - displayWidth(left) - displayWidth(right));
  return `${left}${' '.repeat(gap)}${right}\n`;
}

function renderTaskLine(result, style) {
  const task = result.task;
  return [
    `  ${style.bold(task.label)} ${style.dim(S.dot)} ${style.dim(task.modality)} ${style.dim(S.dot)} ${confidenceLabel(task.confidence, style)}`,
    `  ${style.dim(truncate(result.query ?? task.blurb ?? '', 74))}`
  ].join('\n');
}

function renderSetupBlock(candidate, { style, width }) {
  const setup = candidate.setup;
  const env = setup.direct?.env?.[0] ?? 'MODELPICK_KEY';
  const lines = [];
  lines.push(`  ${style.dim('connect')}  ${style.cyan(`export ${env}=...`)}`);
  if (setup.direct?.keysUrl) lines.push(`  ${style.dim('key')}      ${setup.direct.keysUrl}`);
  if (setup.openrouter?.model) {
    lines.push(
      `  ${style.dim('or')}       ${style.cyan('OPENROUTER_API_KEY')} ${style.dim(S.arrow)} ${setup.openrouter.model}`
    );
  }
  return lines.join('\n');
}

export function renderCandidate(candidate, { rank = 1, task, style, width = 76, explain = false } = {}) {
  const lines = [];
  const label = rank === 1 ? style.bold(style.cyan('RECOMMENDATION')) : style.bold(`ALTERNATIVE ${rank}`);
  lines.push(`  ${label}`);

  const title = `${style.bold(candidate.name)} ${style.dim(S.dot)} ${candidate.provider}`;
  lines.push(`  ${title}`);
  lines.push(`  ${rule(width - 2, style)}`);
  lines.push(
    `  ${style.dim('quality')} ${style.bold(num(candidate.quality))}  ${scoreBar(candidate.quality, 10, style)}   ` +
      `${style.dim('score')} ${style.bold(num(candidate.score))}/100   ` +
      `${style.dim('fit')} ${candidate.score >= 80 ? style.green('excellent') : candidate.score >= 65 ? style.cyan('good') : style.yellow('ok')}`
  );

  const unit = task.modality === 'text' ? 'solved task' : `usable ${task.workload?.unit ?? 'asset'}`;
  const approx = candidate.priceConfidence === 'estimated' ? '~' : '';
  lines.push(
    `  ${style.dim('cost')}    ${style.bold(`${approx}${money(candidate.costPerTask)}`)} ${style.dim(`/ ${unit}`)}   ` +
      `${style.dim('raw')} ${money(candidate.unitCost)}   ${style.dim('attempts')} ${num(candidate.attempts, 2)}   ` +
      `${style.dim('time')} ~${num(candidate.latencySec, candidate.latencySec < 10 ? 1 : 0)}s`
  );

  if (task.modality === 'text' && candidate.contextWindow) {
    const ctx = candidate.contextWindow >= 1e6 ? `${num(candidate.contextWindow / 1e6, 2)}M` : `${Math.round(candidate.contextWindow / 1000)}K`;
    lines.push(`  ${style.dim('context')} ${ctx} tokens`);
  }

  if (candidate.why?.length) {
    lines.push('');
    lines.push(...bulletList(candidate.why, { style, width }).split('\n'));
  }
  if (candidate.tradeoffs?.length) {
    lines.push('');
    lines.push(`  ${style.dim('trade-offs')}`);
    lines.push(...bulletList(candidate.tradeoffs, { style, width, marker: S.cross }).split('\n'));
  }
  if (candidate.notes) {
    lines.push('');
    lines.push(`  ${style.dim('note')} ${wrap(candidate.notes, width - 8).trim()}`);
  }

  lines.push('');
  lines.push(renderSetupBlock(candidate, { style, width }));

  if (explain) {
    lines.push('');
    lines.push(`  ${style.dim('math')}`);
    lines.push(
      `  ${style.dim('quality')} = weighted mix of benchmark scores for ${task.label.toLowerCase()}`
    );
    lines.push(
      `  ${style.dim('cost/task')} = ${money(candidate.unitCost)} raw × ${num(candidate.attempts, 2)} expected attempts`
    );
    lines.push(
      `  ${style.dim('weights')} = quality ${Math.round((task.weights.quality ?? 0) * 100)}% · cost ${Math.round((task.weights.cost ?? 0) * 100)}% · speed ${Math.round((task.weights.speed ?? 0) * 100)}%`
    );
    if (candidate.evidence?.length) {
      lines.push(`  ${style.dim('evidence')} ${candidate.evidence.map((e) => e.name).join(', ')}`);
    }
  }
  return lines.join('\n');
}

export function renderRecommendation(result, options = {}) {
  const style = options.style ?? makeStyle(false);
  const width = options.width ?? 76;
  const lines = [];
  lines.push(renderTaskLine(result, style));
  lines.push('');

  if (result.error) {
    lines.push(`  ${style.yellow('No eligible model.')} ${result.message ?? ''}`);
    if (result.nearMisses?.length) {
      lines.push('');
      lines.push(`  ${style.dim('Closest options and why they were rejected:')}`);
      for (const miss of result.nearMisses) {
        lines.push(`  ${style.bold(miss.name)} ${style.dim(miss.reasons.join(', '))}`);
      }
    }
    return lines.join('\n');
  }

  lines.push(renderCandidate(result.recommendation, { rank: 1, task: result.task, style, width, explain: options.explain }));
  if (result.alternatives?.length) {
    lines.push('');
    const unit = result.task.modality === 'text' ? 'task' : `usable ${result.task.workload?.unit ?? 'asset'}`;
    for (let i = 0; i < result.alternatives.length; i += 1) {
      const alt = result.alternatives[i];
      const approx = alt.priceConfidence === 'estimated' ? '~' : '';
      lines.push(
        `  ${style.dim(`#${i + 2}`)} ${style.bold(alt.name)} ${style.dim(S.dot)} ${approx}${money(alt.costPerTask)} ${style.dim(`/ ${unit}`)} ${style.dim(S.dot)} quality ${num(alt.quality)} ${style.dim(S.dot)} score ${num(alt.score)}`
      );
    }
  }

  lines.push('');
  const picks = result.picks ?? {};
  const chips = [];
  if (picks.value?.slug !== result.recommendation?.slug) chips.push(`value ${style.cyan(picks.value?.name)} ${style.dim(money(picks.value?.costPerTask))}`);
  if (picks.quality?.slug !== result.recommendation?.slug) chips.push(`max quality ${style.cyan(picks.quality?.name)}`);
  if (picks.fastest?.slug !== result.recommendation?.slug) chips.push(`fastest ${style.cyan(picks.fastest?.name)}`);
  if (chips.length) lines.push(`  ${style.dim('also')}  ${chips.join(`   ${style.dim(S.dot)}   `)}`);

  if (result.savings?.ratio && result.savings.ratio > 1.05) {
    lines.push(
      `  ${style.green(`saves ${num(result.savings.ratio, 1)}×`)} vs ${result.savings.baseline} on cost per solved task ` +
        `${style.dim(`(quality ${result.savings.qualityDelta >= 0 ? '+' : ''}${num(result.savings.qualityDelta)})`)}`
    );
  }

  if (result.catalog?.stale) {
    lines.push(`  ${style.yellow('!')} catalog is ${result.catalog.ageDays} days old — run ${style.cyan('modelpick update')}`);
  }

  lines.push('');
  lines.push(`  ${style.dim('JSON for agents:')} ${style.cyan('modelpick pick "..." --json')}`);
  return lines.join('\n');
}

export function renderPlan(result, options = {}) {
  const style = options.style ?? makeStyle(false);
  const lines = [];
  lines.push(`  ${style.bold(result.plan.label)} ${style.dim(S.dot)} ${result.estimate ? money(result.estimate.totalCost) : ''} ${style.dim('estimated per run')}`);
  lines.push(`  ${style.dim(result.plan.blurb)}`);
  lines.push('');
  const width = 76;
  lines.push(`  ${pad(style.dim('#'), 3)}${pad(style.dim('step'), 18)}${pad(style.dim('model'), 28)}${pad(style.dim('cost'), 10)}${style.dim('quality')}`);
  lines.push(`  ${rule(width - 2, style)}`);
  for (const step of result.steps) {
    const pick = step.pick;
    if (!pick) {
      lines.push(`  ${pad(String(step.index + 1), 3)}${pad(step.id, 18)}${style.yellow('no eligible model')}`);
      continue;
    }
    lines.push(
      `  ${pad(String(step.index + 1), 3)}${pad(truncate(step.task.label, 17), 18)}${pad(truncate(pick.name, 27), 28)}${pad(money(pick.costPerTask), 10)}${num(pick.quality)}`
    );
    lines.push(`  ${' '.repeat(3)}${style.dim(truncate(step.brief, 68))}`);
  }
  lines.push('');
  lines.push(`  ${style.dim('Total')} ${style.bold(money(result.estimate.totalCost))} ${style.dim('per run · retries included')}`);
  lines.push(`  ${style.dim('Machine-readable plan:')} ${style.cyan('modelpick plan "..." --json')}`);
  return lines.join('\n');
}

export function renderCompare(result, options = {}) {
  const style = options.style ?? makeStyle(false);
  const lines = [];
  lines.push(`  ${style.bold('Comparison')} ${style.dim(S.dot)} ${result.task}`);
  lines.push('');
  lines.push(
    `  ${pad(style.dim('model'), 30)}${pad(style.dim('quality'), 9)}${pad(style.dim('cost/task'), 12)}${pad(style.dim('attempts'), 10)}${style.dim('context')}`
  );
  lines.push(`  ${rule(74, style)}`);
  for (const model of result.models) {
    const ctx = model.contextWindow ? (model.contextWindow >= 1e6 ? `${num(model.contextWindow / 1e6, 2)}M` : `${Math.round(model.contextWindow / 1000)}K`) : '—';
    lines.push(
      `  ${pad(truncate(model.name, 29), 30)}${pad(num(model.quality), 9)}${pad(money(model.costPerTask), 12)}${pad(num(model.attempts, 2), 10)}${ctx}`
    );
  }
  return lines.join('\n');
}

export function renderModels(models, options = {}) {
  const style = options.style ?? makeStyle(false);
  const lines = [];
  lines.push(`  ${style.bold(`${models.length} models`)} ${style.dim('in catalog')}`);
  lines.push('');
  lines.push(`  ${pad(style.dim('slug'), 26)}${pad(style.dim('provider'), 14)}${pad(style.dim('quality'), 9)}${pad(style.dim('price'), 18)}${style.dim('ctx')}`);
  lines.push(`  ${rule(76, style)}`);
  for (const model of models) {
    const price = model.pricing.unit === 'mtok'
      ? `$${model.pricing.input}/$${model.pricing.output} Mtok`
      : `${money(model.pricing.amount ?? model.pricing.variants?.[0]?.amount)}/${model.pricing.unit}`;
    const ctx = model.contextWindow ? (model.contextWindow >= 1e6 ? `${num(model.contextWindow / 1e6, 1)}M` : `${Math.round(model.contextWindow / 1000)}K`) : '—';
    lines.push(`  ${pad(truncate(model.slug, 25), 26)}${pad(truncate(model.provider.name, 13), 14)}${pad(num(model.quality.overall), 9)}${pad(price, 18)}${ctx}`);
  }
  return lines.join('\n');
}
