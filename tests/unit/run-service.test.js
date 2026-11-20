import test from 'node:test';
import assert from 'node:assert/strict';
import { loadCatalog } from '../../src/core/catalog.js';
import { chooseRunModel, runRecommended } from '../../src/core/run-service.js';

const catalog = loadCatalog({ preferCache: false });

test('chooseRunModel resolves explicit, provider, and automatic choices', () => {
  assert.equal(chooseRunModel(catalog, { model: 'gpt-6.2-sol' }).slug, 'gpt-6.2-sol');
  assert.equal(chooseRunModel(catalog, { prompt: 'x', provider: 'openai' }).provider.id, 'openai');
  const auto = chooseRunModel(catalog, { prompt: 'refactor this function', task: 'coding-agent' });
  assert.equal(auto.modality, 'text');
  assert.throws(() => chooseRunModel(catalog, { model: 'nope' }), /Unknown model/);
  assert.throws(() => chooseRunModel(catalog, { prompt: 'x', provider: 'nope' }), /No text model/);
});

test('runRecommended returns the adapter payload with an injected transport', async () => {
  process.env.OPENAI_API_KEY = 'sk-test-service';
  try {
    const result = await runRecommended({
      catalog,
      model: 'gpt-6.2-sol',
      prompt: 'hello',
      fetchImpl: async () => new Response(JSON.stringify({
        choices: [{ message: { content: 'ok' } }],
        usage: { prompt_tokens: 10, completion_tokens: 2 }
      }), { status: 200 })
    });
    assert.equal(result.output, 'ok');
    assert.equal(result.model, 'gpt-6.2-sol');
    assert.ok(result.cost > 0);
  } finally {
    delete process.env.OPENAI_API_KEY;
  }
});
