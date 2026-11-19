import readline from 'node:readline';
import { loadCatalog, catalogStats, findModel } from '../core/catalog.js';
import { recommend, plan, compare } from '../core/recommend.js';
import { detectTask } from '../core/tasks.js';
import { ModelPickError } from '../core/errors.js';

const PROTOCOL_VERSION = '2025-06-18';
const SERVER_INFO = { name: 'modelpick', version: '0.1.0' };

const TOOLS = [
  {
    name: 'pick_model',
    description:
      'Choose the best model for ONE workflow node (coding, image, video, 3D, audio). Returns a ranked recommendation with cost per solved task, quality, latency, why, and the exact key/env setup. Call this before choosing a model or quoting a price. Example: {"query":"generate a 3D game asset","optimize":"balanced"}',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'What the agent is trying to do, in natural language.' },
        task: { type: 'string', description: 'Optional task id (coding-agent, image-gen, 3d-gen, video-gen, tts...).' },
        optimize: { type: 'string', enum: ['balanced', 'quality', 'cost', 'speed', 'privacy'] },
        max_cost: { type: 'number', description: 'Budget in USD per solved task.' },
        min_quality: { type: 'number', description: 'Quality floor 0-100.' },
        open_weights: { type: 'boolean', description: 'Only open-weight / self-hostable models.' },
        context_tokens: { type: 'integer', description: 'Input tokens the task needs.' },
        exclude_providers: { type: 'array', items: { type: 'string' } },
        top_k: { type: 'integer', minimum: 1, maximum: 5, default: 3 }
      },
      required: ['query']
    }
  },
  {
    name: 'plan_workflow',
    description:
      'Plan a multi-step creative or engineering workflow and pick the best model for every step (e.g. concept image -> 3D asset, or script -> keyframes -> video -> voice). Use when the user asks for a deliverable, not a single call.',
    inputSchema: {
      type: 'object',
      properties: {
        goal: { type: 'string', description: 'The deliverable, e.g. "30s product launch video".' },
        optimize: { type: 'string', enum: ['balanced', 'quality', 'cost', 'speed', 'privacy'] },
        max_cost: { type: 'number' }
      },
      required: ['goal']
    }
  },
  {
    name: 'compare_models',
    description: 'Compare two or more models on the same task using cost per solved task, not list price.',
    inputSchema: {
      type: 'object',
      properties: {
        models: { type: 'array', items: { type: 'string' }, minItems: 2 },
        task: { type: 'string' }
      },
      required: ['models', 'task']
    }
  },
  {
    name: 'get_setup',
    description: 'Get the API key env var, key URL, docs, and model id needed to call a recommended model.',
    inputSchema: {
      type: 'object',
      properties: { model: { type: 'string', description: 'Model slug, e.g. tripo-3.0 or nano-banana-2.1.' } },
      required: ['model']
    }
  },
  {
    name: 'list_models',
    description: 'List catalog models, optionally filtered by modality or task, with prices and quality.',
    inputSchema: {
      type: 'object',
      properties: {
        modality: { type: 'string', enum: ['text', 'image', 'video', '3d', 'audio'] },
        task: { type: 'string' },
        open_weights: { type: 'boolean' },
        limit: { type: 'integer', minimum: 1, maximum: 100, default: 40 }
      }
    }
  },
  {
    name: 'explain_task',
    description: 'Map a natural-language request to a ModelPick task node when you are unsure which task id to use.',
    inputSchema: {
      type: 'object',
      properties: { query: { type: 'string' } },
      required: ['query']
    }
  }
];

function textResult(payload) {
  return {
    content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
    structuredContent: payload
  };
}

function toolError(message, hint) {
  return {
    content: [{ type: 'text', text: JSON.stringify({ error: 'TOOL_ERROR', message, hint }) }],
    isError: true
  };
}

/** Keep MCP responses small: agents pay for every token of tool output. */
function compactRecommendation(result) {
  return {
    schemaVersion: result.schemaVersion,
    task: result.task,
    catalog: { version: result.catalog.version, updatedAt: result.catalog.updatedAt, stale: result.catalog.stale },
    recommendation: result.recommendation
      ? {
          slug: result.recommendation.slug,
          name: result.recommendation.name,
          provider: result.recommendation.provider,
          quality: result.recommendation.quality,
          costPerTask: result.recommendation.costPerTask,
          expectedAttempts: result.recommendation.expectedAttempts,
          latencySec: result.recommendation.latencySec,
          score: result.recommendation.score,
          why: result.recommendation.why,
          tradeoffs: result.recommendation.tradeoffs,
          setup: result.recommendation.setup,
          priceConfidence: result.recommendation.priceConfidence
        }
      : null,
    alternatives: (result.alternatives ?? []).map((alt) => ({
      slug: alt.slug,
      name: alt.name,
      quality: alt.quality,
      costPerTask: alt.costPerTask,
      score: alt.score,
      why: alt.why
    })),
    picks: result.picks
      ? {
          quality: result.picks.quality?.slug ?? null,
          value: result.picks.value?.slug ?? null,
          fastest: result.picks.fastest?.slug ?? null,
          cheapest: result.picks.cheapest?.slug ?? null
        }
      : null,
    savings: result.savings ?? null,
    assumptions: result.assumptions,
    error: result.error ?? null,
    message: result.message ?? null
  };
}

export function createMcpServer({ input = process.stdin, output = process.stdout, catalog } = {}) {
  const cat = catalog ?? loadCatalog();
  const rl = readline.createInterface({ input, terminal: false });

  const send = (message) => {
    output.write(`${JSON.stringify(message)}\n`);
  };
  const reply = (id, result) => send({ jsonrpc: '2.0', id, result });
  const fail = (id, code, message, data) => send({ jsonrpc: '2.0', id, error: { code, message, data } });

  async function callTool(name, args) {
    switch (name) {
      case 'pick_model': {
        const result = recommend(cat, {
          query: args.query,
          task: args.task,
          optimize: args.optimize,
          maxCost: args.max_cost,
          minQuality: args.min_quality,
          openWeights: args.open_weights,
          contextTokens: args.context_tokens,
          excludeProviders: args.exclude_providers,
          topK: args.top_k ?? 3
        });
        return textResult(compactRecommendation(result));
      }
      case 'plan_workflow': {
        const result = plan(cat, args.goal, { optimize: args.optimize, maxCost: args.max_cost });
        return textResult({
          schemaVersion: result.schemaVersion,
          goal: result.goal,
          plan: result.plan,
          steps: result.steps.map((step) => ({
            id: step.id,
            task: step.task,
            brief: step.brief,
            optional: step.optional,
            pick: step.pick
              ? {
                  slug: step.pick.slug,
                  name: step.pick.name,
                  costPerTask: step.pick.costPerTask,
                  quality: step.pick.quality,
                  setup: step.pick.setup
                }
              : null,
            alternative: step.alternative?.slug ?? null
          })),
          estimate: result.estimate
        });
      }
      case 'compare_models': {
        const result = compare(cat, args.models, { task: args.task });
        return textResult(result);
      }
      case 'get_setup': {
        const model = findModel(cat, args.model);
        if (!model) return toolError(`Unknown model: ${args.model}`, 'Call list_models first.');
        return textResult({
          slug: model.slug,
          name: model.name,
          modality: model.modality,
          provider: model.provider,
          access: model.access,
          pricing: model.pricing,
          docs: model.sources
        });
      }
      case 'list_models': {
        let models = cat.models;
        if (args.modality) models = models.filter((model) => model.modality === args.modality);
        if (args.open_weights) models = models.filter((model) => model.openWeights);
        if (args.task) {
          const task = cat.taskById.get(args.task);
          if (!task) return toolError(`Unknown task: ${args.task}`);
          models = models.filter(
            (model) =>
              model.modality === task.modality &&
              (task.requires ?? []).every((cap) => Boolean(model.capabilities?.[cap]))
          );
          models = models.sort((a, b) => (b.quality[task.qualityMix ? Object.keys(task.qualityMix)[0] : 'overall'] ?? 0) - (a.quality[task.qualityMix ? Object.keys(task.qualityMix)[0] : 'overall'] ?? 0));
        }
        return textResult({
          count: models.length,
          models: models.slice(0, args.limit ?? 40).map((model) => ({
            slug: model.slug,
            name: model.name,
            provider: model.provider.name,
            modality: model.modality,
            quality: model.quality.overall,
            pricing: model.pricing,
            openWeights: model.openWeights
          }))
        });
      }
      case 'explain_task': {
        const detection = detectTask(args.query, cat.tasks);
        return textResult({
          task: detection.task ? { id: detection.task.id, label: detection.task.label, modality: detection.task.modality } : null,
          confidence: detection.confidence,
          candidates: detection.candidates
        });
      }
      default:
        return null;
    }
  }

  async function handle(message) {
    if (!message || message.jsonrpc !== '2.0') return;
    const { id, method, params } = message;
    if (method === 'initialize') {
      reply(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions:
          'ModelPick is a task-level model router. Before choosing a model, quoting a price, or starting a generation step, call pick_model. Use plan_workflow for multi-step deliverables. Never invent prices; cite costPerTask from the tool.'
      });
      return;
    }
    if (method === 'notifications/initialized' || method === 'initialized') return;
    if (method === 'ping') {
      reply(id, {});
      return;
    }
    if (method === 'tools/list') {
      reply(id, { tools: TOOLS });
      return;
    }
    if (method === 'tools/call') {
      const name = params?.name;
      const args = params?.arguments ?? {};
      try {
        const result = await callTool(name, args);
        if (!result) {
          fail(id, -32602, `Unknown tool: ${name}`);
          return;
        }
        reply(id, result);
      } catch (error) {
        if (error instanceof ModelPickError) {
          reply(id, toolError(error.message, error.hint));
        } else {
          reply(id, toolError(error.message ?? 'Unexpected tool error'));
        }
      }
      return;
    }
    if (method === 'resources/list') {
      reply(id, { resources: [] });
      return;
    }
    fail(id, -32601, `Method not found: ${method}`);
  }

  rl.on('line', (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    let message;
    try {
      message = JSON.parse(trimmed);
    } catch {
      fail(null, -32700, 'Parse error');
      return;
    }
    handle(message).catch((error) => {
      process.stderr.write(`[modelpick] handler error: ${error.stack ?? error.message}\n`);
    });
  });

  return { rl, stats: catalogStats(cat) };
}

export function startMcpServer(options = {}) {
  const server = createMcpServer(options);
  process.stderr.write('[modelpick] MCP server ready on stdio\n');
  return server;
}
