import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { mcpSession, toolResult } from '../helpers.js';

const init = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '1.0.0' } }
};

test('MCP initializes with tools capability and instructions', async () => {
  const { responses } = await mcpSession([init, { jsonrpc: '2.0', id: 2, method: 'tools/list' }]);
  const initialized = responses.get(1).result;
  assert.equal(initialized.protocolVersion, '2025-06-18');
  assert.equal(initialized.serverInfo.name, 'modelpick');
  assert.ok(initialized.instructions.includes('pick_model'));
  const tools = responses.get(2).result.tools;
  assert.equal(tools.length, 6);
  assert.deepEqual(
    tools.map((tool) => tool.name).sort(),
    ['compare_models', 'explain_task', 'get_setup', 'list_models', 'pick_model', 'plan_workflow']
  );
  assert.ok(tools.every((tool) => tool.inputSchema.type === 'object'));
});

test('pick_model returns a compact, useful payload', async () => {
  const { responses } = await mcpSession([
    init,
    {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: { name: 'pick_model', arguments: { query: 'create a 3D game asset', optimize: 'cost' } }
    }
  ]);
  const payload = toolResult(responses.get(3));
  assert.equal(payload.task.id, '3d-gen');
  assert.ok(payload.recommendation.slug);
  assert.ok(payload.recommendation.costPerTask > 0);
  assert.ok(payload.recommendation.setup.direct.env.length > 0);
  assert.ok(JSON.stringify(payload).length < 12000, 'MCP payload should stay small');
});

test('plan_workflow returns every step and a total', async () => {
  const { responses } = await mcpSession([
    init,
    {
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: { name: 'plan_workflow', arguments: { goal: '30s product launch video' } }
    }
  ]);
  const payload = toolResult(responses.get(4));
  assert.ok(payload.steps.length >= 4);
  assert.ok(payload.estimate.totalCost > 0);
});

test('get_setup and list_models work', async () => {
  const { responses } = await mcpSession([
    init,
    { jsonrpc: '2.0', id: 5, method: 'tools/call', params: { name: 'get_setup', arguments: { model: 'tripo-h3.1' } } },
    { jsonrpc: '2.0', id: 6, method: 'tools/call', params: { name: 'list_models', arguments: { modality: 'image' } } }
  ]);
  const setup = toolResult(responses.get(5));
  assert.equal(setup.slug, 'tripo-h3.1');
  assert.ok(setup.provider.env.includes('TRIPO_API_KEY'));
  const list = toolResult(responses.get(6));
  assert.ok(list.count >= 4);
  assert.ok(list.models.every((model) => model.modality === 'image'));
});

test('unknown tool returns a JSON-RPC error, not a crash', async () => {
  const { responses } = await mcpSession([
    init,
    { jsonrpc: '2.0', id: 7, method: 'tools/call', params: { name: 'nope', arguments: {} } }
  ]);
  assert.equal(responses.get(7).error.code, -32602);
});

test('explain_task maps natural language', async () => {
  const { responses } = await mcpSession([
    init,
    { jsonrpc: '2.0', id: 8, method: 'tools/call', params: { name: 'explain_task', arguments: { query: 'make a 3D character' } } }
  ]);
  const payload = toolResult(responses.get(8));
  assert.equal(payload.task.id, '3d-gen');
  assert.equal(payload.confidence, 'high');
});

test('server keeps stdout clean JSON and logs to stderr', async () => {
  const { stderr } = await mcpSession([init]);
  assert.ok(stderr.includes('[modelpick]'));
});
