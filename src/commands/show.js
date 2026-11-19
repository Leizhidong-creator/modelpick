import { loadCatalog, findModel } from '../core/catalog.js';
import { connectionFor } from '../core/connect.js';
import { ModelPickError } from '../core/errors.js';

function money(value) {
  if (value == null) return '—';
  if (value < 0.01) return `$${value.toFixed(4)}`;
  if (value < 1) return `$${value.toFixed(3)}`;
  return `$${value.toFixed(2)}`;
}

export async function runShow(ctx) {
  const key = ctx.positionals[0] ?? ctx.options.model;
  if (!key) {
    throw new ModelPickError('Which model?', {
      code: 'ERR_MISSING_MODEL',
      hint: 'Example: modelpick show tripo-h3.1'
    });
  }
  const catalog = loadCatalog({ preferCache: !ctx.flags['no-cache'] });
  const model = findModel(catalog, key);
  if (!model) {
    throw new ModelPickError(`Unknown model: ${key}`, {
      code: 'ERR_UNKNOWN_MODEL',
      hint: 'Run `modelpick models` to list the catalog.'
    });
  }
  const connection = connectionFor(model, { useOpenRouter: Boolean(ctx.flags.openrouter) });

  if (ctx.json) {
    console.log(
      JSON.stringify(
        {
          schemaVersion: '1.0',
          kind: 'model',
          model: {
            slug: model.slug,
            name: model.name,
            provider: model.provider,
            modality: model.modality,
            contextWindow: model.contextWindow,
            pricing: model.pricing,
            quality: model.quality,
            capabilities: model.capabilities,
            tags: model.tags,
            notes: model.notes,
            sources: model.sources
          },
          connection
        },
        null,
        2
      )
    );
    return;
  }

  const s = ctx.style;
  console.log(`\n  ${s.bold(model.name)} ${s.dim('·')} ${model.provider.name} ${s.dim('·')} ${model.modality}`);
  console.log(`  ${s.dim('slug')} ${model.slug}`);
  if (model.contextWindow) console.log(`  ${s.dim('context')} ${model.contextWindow.toLocaleString('en-US')} tokens`);
  if (model.pricing.unit === 'mtok') {
    console.log(`  ${s.dim('price')} $${model.pricing.input}/$${model.pricing.output} per 1M tokens ${s.dim('(cache $' + (model.pricing.cachedInput ?? '—') + ')')}`);
  } else {
    console.log(`  ${s.dim('price')} ${money(model.pricing.amount)} per ${model.pricing.unit} ${s.dim(model.pricing.confidence === 'estimated' ? '(estimated)' : '')}`);
  }
  console.log(`  ${s.dim('quality')} overall ${model.quality.overall}`);
  console.log(`\n  ${s.cyan('CONNECT')}`);
  console.log(`  ${s.dim('endpoint')} ${connection.baseUrl ?? '—'}`);
  console.log(`  ${s.dim('model id')} ${connection.apiModel ?? '—'}`);
  console.log(`  ${s.dim('auth')} ${connection.auth ?? '—'} ${s.dim('·')} env ${connection.env?.join(', ') || '—'}`);
  if (connection.platformUrl) console.log(`  ${s.dim('platform')} ${connection.platformUrl}`);
  if (connection.docsUrl) console.log(`  ${s.dim('docs')}     ${connection.docsUrl}`);
  if (connection.sdk) console.log(`  ${s.dim('sdk')}      ${connection.sdk}`);
  if (connection.note) console.log(`  ${s.dim('note')}     ${connection.note}`);
  if (connection.example) {
    console.log(`\n  ${s.dim('example')}`);
    for (const line of connection.example.split('\n')) console.log(`  ${line}`);
  }
  if (connection.confidence === 'typical') {
    console.log(`\n  ${s.yellow('!')} Endpoint is the provider's common path, not re-verified today. Check the docs link.`);
  }
  if (model.sources?.length) {
    console.log(`\n  ${s.dim('evidence')}`);
    for (const source of model.sources) console.log(`  ${s.dim('·')} ${source.name} — ${source.url}`);
  }
  console.log('');
}
