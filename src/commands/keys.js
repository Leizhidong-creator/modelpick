import { loadCatalog } from '../core/catalog.js';

function uniqueProviders(catalog) {
  const map = new Map();
  for (const model of catalog.models) {
    const key = model.provider.id;
    if (!map.has(key)) {
      map.set(key, {
        id: key,
        name: model.provider.name,
        env: model.provider.env,
        keysUrl: model.provider.keysUrl,
        docsUrl: model.provider.docsUrl,
        models: []
      });
    }
    map.get(key).models.push(model.slug);
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export async function runKeys(ctx) {
  const catalog = loadCatalog({ preferCache: !ctx.flags['no-cache'] });
  const providers = uniqueProviders(catalog);
  const rows = providers.map((provider) => ({
    ...provider,
    present: provider.env.map((name) => ({ name, set: Boolean(process.env[name]) }))
  }));

  if (ctx.json) {
    console.log(JSON.stringify({ schemaVersion: '1.0', kind: 'keys', providers: rows }, null, 2));
    return;
  }

  const style = ctx.style;
  console.log(`\n  ${style.bold('Provider keys')} ${style.dim('— presence only, values are never read or printed')}\n`);
  for (const provider of rows) {
    const state = provider.present
      .map((entry) => `${entry.set ? style.green('✓') : style.dim('·')} ${entry.name}`)
      .join('  ');
    console.log(`  ${provider.name.padEnd(20)} ${state}`);
    if (provider.keysUrl) console.log(`  ${''.padEnd(20)} ${style.dim(provider.keysUrl)}`);
  }
  const set = rows.filter((provider) => provider.present.some((entry) => entry.set)).length;
  console.log(`\n  ${style.dim(`${set}/${rows.length} providers have at least one key in this shell.`)}`);
  console.log(`  ${style.dim('Set one with:')} ${style.cyan('export OPENROUTER_API_KEY=...')} ${style.dim('(one key covers every text model)')}\n`);
}
