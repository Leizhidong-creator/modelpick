#!/usr/bin/env node
/**
 * Build catalog/models.json from models.dev + curated quality scores.
 * Network is only needed at maintainer time; the published catalog is a snapshot.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const quality = JSON.parse(fs.readFileSync(path.join(root, 'catalog/quality.json'), 'utf8'));
const manual = JSON.parse(fs.readFileSync(path.join(root, 'catalog/manual-models.json'), 'utf8'));

const PROVIDERS = {
  anthropic: {
    name: 'Anthropic',
    env: ['ANTHROPIC_API_KEY'],
    keysUrl: 'https://console.anthropic.com/settings/keys',
    docsUrl: 'https://docs.anthropic.com/en/api/getting-started',
    sdk: 'npm i @anthropic-ai/sdk'
  },
  openai: {
    name: 'OpenAI',
    env: ['OPENAI_API_KEY'],
    keysUrl: 'https://platform.openai.com/api-keys',
    docsUrl: 'https://platform.openai.com/docs',
    sdk: 'npm i openai'
  },
  google: {
    name: 'Google',
    env: ['GEMINI_API_KEY', 'GOOGLE_API_KEY'],
    keysUrl: 'https://aistudio.google.com/apikey',
    docsUrl: 'https://ai.google.dev/gemini-api/docs',
    sdk: 'npm i @google/genai'
  },
  deepseek: {
    name: 'DeepSeek',
    env: ['DEEPSEEK_API_KEY'],
    keysUrl: 'https://platform.deepseek.com/api_keys',
    docsUrl: 'https://api-docs.deepseek.com',
    sdk: 'npm i openai'
  },
  moonshotai: {
    name: 'Moonshot AI',
    env: ['MOONSHOT_API_KEY'],
    keysUrl: 'https://platform.moonshot.ai/console/api-keys',
    docsUrl: 'https://platform.moonshot.ai/docs',
    sdk: 'npm i openai'
  },
  alibaba: {
    name: 'Alibaba Cloud',
    env: ['DASHSCOPE_API_KEY'],
    keysUrl: 'https://bailian.console.alibabacloud.com/?apiKey=1',
    docsUrl: 'https://www.alibabacloud.com/help/en/model-studio',
    sdk: 'npm i openai'
  },
  zai: {
    name: 'Z.ai',
    env: ['ZAI_API_KEY', 'ZHIPU_API_KEY'],
    keysUrl: 'https://z.ai/manage-apikey/apikey-list',
    docsUrl: 'https://docs.z.ai',
    sdk: 'npm i openai'
  },
  minimax: {
    name: 'MiniMax',
    env: ['MINIMAX_API_KEY'],
    keysUrl: 'https://platform.minimaxi.com/user-center/basic-information/interface-key',
    docsUrl: 'https://platform.minimaxi.com/docs',
    sdk: 'npm i openai'
  },
  xai: {
    name: 'xAI',
    env: ['XAI_API_KEY'],
    keysUrl: 'https://console.x.ai',
    docsUrl: 'https://docs.x.ai',
    sdk: 'npm i openai'
  },
  mistral: {
    name: 'Mistral AI',
    env: ['MISTRAL_API_KEY'],
    keysUrl: 'https://console.mistral.ai/api-keys',
    docsUrl: 'https://docs.mistral.ai',
    sdk: 'npm i @mistralai/mistralai'
  }
};

const cost = (m) => ({
  input: m.cost?.input ?? null,
  output: m.cost?.output ?? null,
  cachedInput: m.cost?.cache_read ?? null,
  cacheWrite: m.cost?.cache_write ?? null
});

function canonical(id) {
  return id;
}

function build() {
  const snapshotPath = process.env.MODELS_DEV_SNAPSHOT;
  if (!snapshotPath) {
    console.error('Set MODELS_DEV_SNAPSHOT to a cached models.dev api.json (or run scripts/sync-catalog.js --fetch).');
    process.exit(1);
  }
  const db = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
  const models = [];

  for (const entry of quality.models) {
    const [providerId, ...rest] = entry.id.split('/');
    const upstreamId = rest.join('/');
    const provider = db[providerId];
    const m = provider?.models?.[upstreamId];
    if (!m) {
      console.error(`! missing in models.dev: ${entry.id}`);
      continue;
    }
    const p = PROVIDERS[providerId];
    if (!p) {
      console.error(`! no provider metadata: ${providerId}`);
      continue;
    }
    const outputModalities = m.modalities?.output ?? ['text'];
    models.push({
      id: entry.id,
      slug: entry.slug,
      name: m.name,
      provider: {
        id: providerId,
        name: p.name,
        env: p.env,
        keysUrl: p.keysUrl,
        docsUrl: p.docsUrl,
        sdk: p.sdk
      },
      modality: outputModalities.includes('image') ? 'image' : outputModalities.includes('video') ? 'video' : outputModalities.includes('audio') ? 'audio' : 'text',
      contextWindow: m.limit?.context ?? null,
      maxOutput: m.limit?.output ?? null,
      pricing: { unit: 'mtok', ...cost(m), currency: 'USD' },
      quality: entry.quality,
      speed: entry.speed,
      tags: entry.tags,
      openWeights: Boolean(m.open_weights),
      releaseDate: m.release_date ?? null,
      knowledge: m.knowledge ?? null,
      capabilities: {
        tools: Boolean(m.tool_call),
        reasoning: Boolean(m.reasoning),
        vision: (m.modalities?.input ?? []).includes('image'),
        audioInput: (m.modalities?.input ?? []).includes('audio'),
        videoInput: (m.modalities?.input ?? []).includes('video'),
        pdf: (m.modalities?.input ?? []).includes('pdf'),
        structuredOutput: Boolean(m.structured_output),
        promptCache: m.cost?.cache_read != null,
        openWeights: Boolean(m.open_weights)
      },
      access: {
        apiModel: m.id,
        openrouter: entry.id,
        openrouterModel: entry.id
      },
      notes: entry.notes,
      sources: [
        { name: 'models.dev', url: 'https://models.dev/api.json', readAt: quality.readAt },
        { name: 'OpenRouter', url: `https://openrouter.ai/${entry.id}`, readAt: quality.readAt }
      ]
    });
  }

  models.push(...manual.models);
  models.sort((a, b) => a.name.localeCompare(b.name));

  const catalog = {
    schemaVersion: 1,
    catalogVersion: '2026.11.19',
    updatedAt: '2026-11-19T00:00:00Z',
    currency: 'USD',
    disclaimer:
      'Prices and model IDs are a snapshot. Provider prices change; run `modelpick update` or check the linked source before committing budget.',
    models
  };
  fs.writeFileSync(path.join(root, 'catalog/models.json'), JSON.stringify(catalog, null, 2) + '\n');
  console.log(`wrote catalog/models.json with ${models.length} models`);
}

build();
