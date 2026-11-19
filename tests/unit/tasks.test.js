import test from 'node:test';
import assert from 'node:assert/strict';
import { loadCatalog } from '../../src/core/catalog.js';
import { detectTask, parseIntent, findTask, resolveTask } from '../../src/core/tasks.js';
import { ModelPickError } from '../../src/core/errors.js';

const catalog = loadCatalog();

const cases = [
  ['implement OAuth login across the Next.js app', 'coding-agent'],
  ['review this 600-line PR for security issues', 'code-review'],
  ['refactor the billing service out of the monorepo', 'refactor'],
  ['fix this race condition from the stack trace', 'debugging'],
  ['plan the architecture for a multi-tenant product', 'planning'],
  ['read this 400-page document in one pass', 'long-context'],
  ['deep research the EU AI Act compliance market', 'research'],
  ['write a launch post for our developer tool', 'writing'],
  ['translate the onboarding flow into Japanese', 'translation'],
  ['extract line items from 5,000 invoices into JSON', 'extraction'],
  ['classify 2 million support tickets by urgency', 'classification'],
  ['analyze this 2GB CSV and find churn drivers', 'data-analysis'],
  ['automate this browser checkout flow', 'computer-use'],
  ['generate a hero image for a landing page', 'image-gen'],
  ['remove the background from this product photo', 'image-edit'],
  ['animate this product photo into a 5 second clip', 'video-gen'],
  ['create a stylized 3D sword for a Unity game', '3d-gen'],
  ['narrate this 60 second script with a warm voice', 'tts'],
  ['transcribe this 45 minute podcast', 'stt'],
  ['generate a lo-fi background track', 'music'],
  ['帮我生成一个3D游戏资产', '3d-gen'],
  ['生成一张产品海报', 'image-gen'],
  ['把这段视频翻译成日语并配音', 'translation'],
  ['重构这个大型代码库', 'refactor'],
  ['做一个30秒的产品宣传片', 'video-gen']
];

for (const [query, expected] of cases) {
  test(`detects ${expected}: ${query}`, () => {
    const result = detectTask(query, catalog.tasks);
    assert.equal(result.task?.id, expected, `got ${result.task?.id} matched ${result.matched}`);
    assert.notEqual(result.confidence, 'low');
  });
}

test('unknown text returns no task', () => {
  const result = detectTask('what is the weather in Shanghai', catalog.tasks);
  assert.equal(result.task, null);
  assert.equal(result.reason, 'NO_MATCH');
});

test('ambiguous text exposes runner-up candidates', () => {
  const result = detectTask('generate a video from this image', catalog.tasks);
  assert.equal(result.task.id, 'video-gen');
  assert.ok(result.candidates.length >= 1);
});

test('parseIntent extracts cost, open weights, budget and exclusions', () => {
  assert.equal(parseIntent('cheapest option please').optimize, 'cost');
  assert.equal(parseIntent('最高质量').optimize, 'quality');
  assert.equal(parseIntent('open source only').openWeights, true);
  assert.equal(parseIntent('under $0.05 per image').maxCost, 0.05);
  assert.deepEqual(parseIntent('without OpenAI').excludeProviders, ['openai']);
});

test('findTask accepts ids, labels and prefixes', () => {
  assert.equal(findTask(catalog, '3d-gen').id, '3d-gen');
  assert.equal(findTask(catalog, '3D asset generation').id, '3d-gen');
  assert.equal(findTask(catalog, 'coding').id, 'coding-agent');
});

test('resolveTask throws actionable errors', () => {
  assert.throws(() => resolveTask(catalog, { query: 'qqq zzz' }), (error) => {
    assert.ok(error instanceof ModelPickError);
    assert.equal(error.code, 'ERR_NO_TASK_MATCH');
    assert.ok(error.hint.includes('--task'));
    return true;
  });
  assert.throws(() => resolveTask(catalog, { task: 'nope' }), /Unknown task/);
});
