import test from 'node:test';
import assert from 'node:assert/strict';
import { loadCatalog } from '../../src/core/catalog.js';
import { adapterFor, estimateTokens, runTextModel } from '../../src/core/provider-run.js';
import { tempDir } from '../helpers.js';

const catalog = loadCatalog({ preferCache: false });
const bySlug = (slug) => catalog.models.find((model) => model.slug === slug);

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: { 'content-type': 'application/json' } });
}

function withEnv(names, fn) {
  const previous = {};
  for (const name of names) {
    previous[name] = process.env[name];
    delete process.env[name];
  }
  previous.MODELPICK_HOME = process.env.MODELPICK_HOME;
  process.env.MODELPICK_HOME = tempDir('provider-run-home-');
  return Promise.resolve()
    .then(fn)
    .finally(() => {
      for (const [name, value] of Object.entries(previous)) {
        if (value === undefined) delete process.env[name];
        else process.env[name] = value;
      }
    });
}

test('OpenAI adapter returns text, usage, and cost', () => withEnv(['OPENAI_API_KEY', 'OPENROUTER_API_KEY'], async () => {
  process.env.OPENAI_API_KEY = 'sk-openai';
  let captured;
  const result = await runTextModel({
    model: bySlug('gpt-6.2-sol'),
    prompt: 'hello',
    fetchImpl: async (url, init) => {
      captured = { url, init };
      return json({ choices: [{ message: { content: 'hi' } }], usage: { prompt_tokens: 1000, completion_tokens: 500 } });
    }
  });
  assert.match(captured.url, /api\.openai\.com\/v1\/chat\/completions/);
  assert.equal(result.output, 'hi');
  assert.equal(result.usage.inputTokens, 1000);
  assert.equal(result.usage.outputTokens, 500);
  assert.equal(result.cost, 0.007);
  assert.equal(result.keySource, 'OPENAI_API_KEY');
}));

test('Anthropic adapter uses the messages API and x-api-key', () => withEnv(['ANTHROPIC_API_KEY'], async () => {
  process.env.ANTHROPIC_API_KEY = 'sk-ant';
  let captured;
  const result = await runTextModel({
    model: bySlug('claude-fable-5.2'),
    prompt: 'hello',
    fetchImpl: async (url, init) => {
      captured = { url, init };
      return json({ content: [{ type: 'text', text: 'hi' }], usage: { input_tokens: 10, output_tokens: 5 } });
    }
  });
  assert.match(captured.url, /api\.anthropic\.com\/v1\/messages/);
  assert.equal(captured.init.headers['x-api-key'], 'sk-ant');
  assert.equal(result.output, 'hi');
  assert.equal(result.cost, 0.00028);
}));

test('Gemini adapter uses generateContent and header auth', () => withEnv(['GEMINI_API_KEY', 'GOOGLE_API_KEY'], async () => {
  process.env.GEMINI_API_KEY = 'g-key';
  let captured;
  const result = await runTextModel({
    model: bySlug('gemini-4-carbon'),
    prompt: 'hello',
    fetchImpl: async (url, init) => {
      captured = { url, init };
      return json({
        candidates: [{ content: { parts: [{ text: 'hi' }] } }],
        usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5 }
      });
    }
  });
  assert.match(captured.url, /generativelanguage\.googleapis\.com\/v1beta\/models\/gemini-4-carbon:generateContent/);
  assert.equal(captured.init.headers['x-goog-api-key'], 'g-key');
  assert.equal(result.output, 'hi');
  assert.equal(result.cost, 0.00007);
}));

test('DeepSeek adapter is OpenAI-compatible', () => withEnv(['DEEPSEEK_API_KEY'], async () => {
  process.env.DEEPSEEK_API_KEY = 'ds-key';
  let captured;
  const result = await runTextModel({
    model: bySlug('deepseek-v4.1-flash'),
    prompt: 'hello',
    fetchImpl: async (url, init) => {
      captured = { url, init };
      return json({ choices: [{ message: { content: 'hi' } }], usage: { prompt_tokens: 10, completion_tokens: 5 } });
    }
  });
  assert.match(captured.url, /api\.deepseek\.com\/chat\/completions/);
  assert.equal(result.output, 'hi');
}));

test('OpenRouter is a text fallback when the direct key is missing', () => withEnv(['OPENAI_API_KEY', 'OPENROUTER_API_KEY'], async () => {
  process.env.OPENROUTER_API_KEY = 'or-key';
  let captured;
  const result = await runTextModel({
    model: bySlug('gpt-6.2-sol'),
    prompt: 'hello',
    fetchImpl: async (url, init) => {
      captured = { url, init };
      return json({ choices: [{ message: { content: 'or' } }], usage: { prompt_tokens: 1, completion_tokens: 1 } });
    }
  });
  assert.match(captured.url, /openrouter\.ai\/api\/v1\/chat\/completions/);
  assert.equal(result.adapter, 'openrouter');
  assert.equal(result.output, 'or');
}));

test('OpenRouter can carry Anthropic and Google text models when direct keys are absent', () => withEnv(['ANTHROPIC_API_KEY', 'GEMINI_API_KEY', 'GOOGLE_API_KEY', 'OPENROUTER_API_KEY'], async () => {
  process.env.OPENROUTER_API_KEY = 'or-key';
  for (const slug of ['claude-fable-5.2', 'gemini-4-carbon']) {
    let captured;
    const result = await runTextModel({
      model: bySlug(slug),
      prompt: 'hello',
      fetchImpl: async (url, init) => {
        captured = { url, init };
        return json({ choices: [{ message: { content: 'or' } }], usage: { prompt_tokens: 1, completion_tokens: 1 } });
      }
    });
    assert.equal(result.adapter, 'openrouter');
    assert.match(captured.url, /openrouter\.ai/);
  }
}));

test('missing key returns setup details and never calls fetch', () => withEnv(['OPENAI_API_KEY', 'OPENROUTER_API_KEY'], async () => {
  let called = false;
  await assert.rejects(
    () => runTextModel({ model: bySlug('gpt-6.2-sol'), prompt: 'hello', fetchImpl: async () => { called = true; return json({}); } }),
    (error) => {
      assert.equal(error.code, 'ERR_MISSING_KEY');
      assert.equal(error.details.env, 'OPENAI_API_KEY');
      assert.match(error.details.command, /modelpick keys set/);
      assert.equal(error.details.needsUserAction, true);
      return true;
    }
  );
  assert.equal(called, false);
}));

test('provider HTTP failures are classified and do not leak the key', () => withEnv(['OPENAI_API_KEY'], async () => {
  process.env.OPENAI_API_KEY = 'sk-secret-value';
  await assert.rejects(
    () => runTextModel({ model: bySlug('gpt-6.2-sol'), prompt: 'x', fetchImpl: async () => json({ error: { message: 'bad key' } }, 401) }),
    (error) => {
      assert.equal(error.code, 'ERR_PROVIDER_AUTH');
      assert.ok(!error.message.includes('sk-secret-value'));
      return true;
    }
  );
  await assert.rejects(
    () => runTextModel({ model: bySlug('gpt-6.2-sol'), prompt: 'x', fetchImpl: async () => json({ error: { message: 'slow down' } }, 429) }),
    (error) => {
      assert.equal(error.code, 'ERR_PROVIDER_RATE_LIMIT');
      return true;
    }
  );
  await assert.rejects(
    () => runTextModel({ model: bySlug('gpt-6.2-sol'), prompt: 'x', fetchImpl: async () => json({ choices: [] }, 200) }),
    /returned no text/
  );
}));

test('messages, system, and context are formatted per provider', () => withEnv(['ANTHROPIC_API_KEY', 'OPENAI_API_KEY'], async () => {
  process.env.ANTHROPIC_API_KEY = 'a';
  process.env.OPENAI_API_KEY = 'o';
  let anthropic;
  await runTextModel({
    model: bySlug('claude-fable-5.2'),
    system: 'be terse',
    messages: [
      { role: 'user', content: 'first' },
      { role: 'assistant', content: 'ok' },
      { role: 'user', content: 'second' }
    ],
    context: 'file.ts',
    fetchImpl: async (url, init) => { anthropic = { url, init }; return json({ content: [{ type: 'text', text: 'yes' }], usage: {} }); }
  });
  const body = JSON.parse(anthropic.init.body);
  assert.equal(body.system, 'be terse');
  assert.equal(body.messages[0].content, 'Context:\nfile.ts\n\nfirst');
  assert.equal(body.messages.length, 3);
  let openai;
  await runTextModel({
    model: bySlug('gpt-6.2-sol'),
    system: 'be terse',
    prompt: 'last',
    fetchImpl: async (url, init) => { openai = { url, init }; return json({ choices: [{ message: { content: 'ok' } }], usage: {} }); }
  });
  const openaiBody = JSON.parse(openai.init.body);
  assert.equal(openaiBody.messages[0].role, 'system');
  assert.equal(openaiBody.messages[0].content, 'be terse');
  assert.equal(openaiBody.messages[1].content, 'last');
}));

test('context budget fails instead of silently truncating', () => withEnv(['OPENAI_API_KEY'], async () => {
  process.env.OPENAI_API_KEY = 'sk';
  const model = { ...bySlug('gpt-6.2-sol'), contextWindow: 1000 };
  const huge = 'x'.repeat(10000);
  await assert.rejects(
    () => runTextModel({ model, prompt: huge, maxTokens: 4096, fetchImpl: async () => json({}) }),
    (error) => {
      assert.equal(error.code, 'ERR_CONTEXT_TOO_LARGE');
      assert.equal(error.details.model, model.slug);
      assert.ok(error.details.estimatedInputTokens > 0);
      return true;
    }
  );
}));

test('JSON output is parsed and validated against a schema', () => withEnv(['OPENAI_API_KEY'], async () => {
  process.env.OPENAI_API_KEY = 'sk';
  const result = await runTextModel({
    model: bySlug('gpt-6.2-sol'),
    prompt: 'return a fix',
    output: { format: 'json', schema: { type: 'object', required: ['fix'], properties: { fix: { type: 'string' } } } },
    fetchImpl: async () => json({ choices: [{ message: { content: '{"fix":"ok"}' } }], usage: {} })
  });
  assert.equal(result.data.fix, 'ok');
  await assert.rejects(
    () => runTextModel({
      model: bySlug('gpt-6.2-sol'),
      prompt: 'return a fix',
      output: { format: 'json', schema: { type: 'object', required: ['fix'], properties: { fix: { type: 'string' } } } },
      fetchImpl: async () => json({ choices: [{ message: { content: '{"nope":1}' } }], usage: {} })
    }),
    (error) => error.code === 'ERR_OUTPUT_SCHEMA'
  );
}));

test('token estimator counts CJK and ASCII conservatively', () => {
  assert.ok(estimateTokens('hello world') >= 2);
  assert.ok(estimateTokens('你好世界') >= 4);
});

test('unsupported providers fail before a network call', () => withEnv([], async () => {
  const model = bySlug('tripo-h3.1');
  assert.throws(() => adapterFor(model), /text models only/);
}));
