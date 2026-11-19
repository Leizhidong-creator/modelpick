/**
 * Provider connection metadata: where to send the request, which header to use,
 * and a copy-paste example. This is deliberately separate from the catalog so a
 * provider endpoint change does not require touching the scoring engine.
 *
 * `confidence` is `verified` when the base URL is documented by the provider or
 * universally used, `typical` when it is the common OpenAI-compatible path.
 */
const PROVIDERS = {
  anthropic: {
    baseUrl: 'https://api.anthropic.com/v1',
    platformUrl: 'https://console.anthropic.com',
    auth: 'x-api-key',
    api: 'Messages',
    sdk: '@anthropic-ai/sdk',
    docs: 'https://docs.anthropic.com/en/api/messages',
    example: (model) =>
      `curl https://api.anthropic.com/v1/messages \\\n  -H "x-api-key: $ANTHROPIC_API_KEY" \\\n  -H "anthropic-version: 2023-06-01" \\\n  -H "content-type: application/json" \\\n  -d '{"model":"${model}","max_tokens":256,"messages":[{"role":"user","content":"hello"}]}'`,
    confidence: 'verified'
  },
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    platformUrl: 'https://platform.openai.com',
    auth: 'bearer',
    api: 'Responses / Chat Completions',
    sdk: 'openai',
    docs: 'https://platform.openai.com/docs/api-reference',
    example: (model) =>
      `curl https://api.openai.com/v1/responses \\\n  -H "Authorization: Bearer $OPENAI_API_KEY" \\\n  -H "content-type: application/json" \\\n  -d '{"model":"${model}","input":"hello"}'`,
    confidence: 'verified'
  },
  google: {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    platformUrl: 'https://aistudio.google.com',
    auth: 'query-key',
    api: 'generateContent',
    sdk: '@google/genai',
    docs: 'https://ai.google.dev/gemini-api/docs',
    example: (model) =>
      `curl "https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=$GEMINI_API_KEY" \\\n  -H "content-type: application/json" \\\n  -d '{"contents":[{"parts":[{"text":"hello"}]}]}'`,
    confidence: 'verified'
  },
  'google-vertex': {
    baseUrl: 'https://{region}-aiplatform.googleapis.com/v1',
    platformUrl: 'https://console.cloud.google.com/vertex-ai',
    auth: 'gcloud',
    api: 'Vertex predict / generateContent',
    sdk: '@google-cloud/aiplatform',
    docs: 'https://cloud.google.com/vertex-ai/generative-ai/docs',
    example: (model) =>
      `# Vertex requires a project, region, and ADC:\n#   gcloud auth application-default login\ncurl -X POST "https://us-central1-aiplatform.googleapis.com/v1/projects/$GOOGLE_CLOUD_PROJECT/locations/us-central1/publishers/google/models/${model}:predict" \\\n  -H "Authorization: Bearer $(gcloud auth application-default print-access-token)" \\\n  -H "content-type: application/json" \\\n  -d '{"instances":[{"prompt":"hello"}]}'`,
    confidence: 'verified'
  },
  deepseek: {
    baseUrl: 'https://api.deepseek.com',
    platformUrl: 'https://platform.deepseek.com',
    auth: 'bearer',
    api: 'OpenAI-compatible chat',
    sdk: 'openai',
    docs: 'https://api-docs.deepseek.com',
    example: (model) =>
      `curl https://api.deepseek.com/chat/completions \\\n  -H "Authorization: Bearer $DEEPSEEK_API_KEY" \\\n  -H "content-type: application/json" \\\n  -d '{"model":"${model}","messages":[{"role":"user","content":"hello"}]}'`,
    confidence: 'verified'
  },
  moonshotai: {
    baseUrl: 'https://api.moonshot.ai/v1',
    platformUrl: 'https://platform.moonshot.ai',
    auth: 'bearer',
    api: 'OpenAI-compatible chat',
    sdk: 'openai',
    docs: 'https://platform.moonshot.ai/docs',
    example: (model) =>
      `curl https://api.moonshot.ai/v1/chat/completions \\\n  -H "Authorization: Bearer $MOONSHOT_API_KEY" \\\n  -H "content-type: application/json" \\\n  -d '{"model":"${model}","messages":[{"role":"user","content":"hello"}]}'`,
    confidence: 'verified'
  },
  alibaba: {
    baseUrl: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
    platformUrl: 'https://bailian.console.alibabacloud.com',
    auth: 'bearer',
    api: 'OpenAI-compatible chat',
    sdk: 'openai',
    docs: 'https://www.alibabacloud.com/help/en/model-studio',
    example: (model) =>
      `curl https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions \\\n  -H "Authorization: Bearer $DASHSCOPE_API_KEY" \\\n  -H "content-type: application/json" \\\n  -d '{"model":"${model}","messages":[{"role":"user","content":"hello"}]}'`,
    confidence: 'typical'
  },
  zai: {
    baseUrl: 'https://api.z.ai/api/paas/v4',
    platformUrl: 'https://z.ai',
    auth: 'bearer',
    api: 'OpenAI-compatible chat',
    sdk: 'openai',
    docs: 'https://docs.z.ai',
    example: (model) =>
      `curl https://api.z.ai/api/paas/v4/chat/completions \\\n  -H "Authorization: Bearer $ZAI_API_KEY" \\\n  -H "content-type: application/json" \\\n  -d '{"model":"${model}","messages":[{"role":"user","content":"hello"}]}'`,
    confidence: 'typical'
  },
  minimax: {
    baseUrl: 'https://api.minimax.io/v1',
    platformUrl: 'https://platform.minimaxi.com',
    auth: 'bearer',
    api: 'OpenAI-compatible chat',
    sdk: 'openai',
    docs: 'https://platform.minimaxi.com/docs',
    example: (model) =>
      `curl https://api.minimax.io/v1/chat/completions \\\n  -H "Authorization: Bearer $MINIMAX_API_KEY" \\\n  -H "content-type: application/json" \\\n  -d '{"model":"${model}","messages":[{"role":"user","content":"hello"}]}'`,
    confidence: 'typical'
  },
  xai: {
    baseUrl: 'https://api.x.ai/v1',
    platformUrl: 'https://console.x.ai',
    auth: 'bearer',
    api: 'OpenAI-compatible chat',
    sdk: 'openai',
    docs: 'https://docs.x.ai',
    example: (model) =>
      `curl https://api.x.ai/v1/chat/completions \\\n  -H "Authorization: Bearer $XAI_API_KEY" \\\n  -H "content-type: application/json" \\\n  -d '{"model":"${model}","messages":[{"role":"user","content":"hello"}]}'`,
    confidence: 'verified'
  },
  mistral: {
    baseUrl: 'https://api.mistral.ai/v1',
    platformUrl: 'https://console.mistral.ai',
    auth: 'bearer',
    api: 'Chat Completions',
    sdk: '@mistralai/mistralai',
    docs: 'https://docs.mistral.ai',
    example: (model) =>
      `curl https://api.mistral.ai/v1/chat/completions \\\n  -H "Authorization: Bearer $MISTRAL_API_KEY" \\\n  -H "content-type: application/json" \\\n  -d '{"model":"${model}","messages":[{"role":"user","content":"hello"}]}'`,
    confidence: 'verified'
  },
  fal: {
    baseUrl: 'https://queue.fal.run',
    platformUrl: 'https://fal.ai/dashboard',
    auth: 'key-header',
    api: 'Queue (async)',
    sdk: '@fal-ai/client',
    docs: 'https://fal.ai/docs',
    example: (model) =>
      `curl -X POST "https://queue.fal.run/${model}" \\\n  -H "Authorization: Key $FAL_KEY" \\\n  -H "content-type: application/json" \\\n  -d '{"prompt":"a stylized 3D sword"}'`,
    confidence: 'verified'
  },
  bytedance: {
    baseUrl: 'https://ark.ap-southeast.bytepluses.com/api/v3',
    platformUrl: 'https://console.byteplus.com',
    auth: 'bearer',
    api: 'Ark / OpenAI-compatible',
    sdk: 'REST',
    docs: 'https://docs.byteplus.com/en/docs/ModelArk',
    example: (model) =>
      `curl https://ark.ap-southeast.bytepluses.com/api/v3/chat/completions \\\n  -H "Authorization: Bearer $BYTEPLUS_API_KEY" \\\n  -H "content-type: application/json" \\\n  -d '{"model":"${model}","messages":[{"role":"user","content":"hello"}]}'`,
    confidence: 'typical'
  },
  tripo: {
    baseUrl: 'https://api.tripo3d.ai/v2/openapi',
    platformUrl: 'https://platform.tripo3d.ai',
    auth: 'bearer',
    api: 'Async task API',
    sdk: 'REST / MCP',
    docs: 'https://developers.tripo3d.ai/en/docs',
    example: (model) =>
      `# 1) create a task, 2) poll the task id\ncurl -X POST "https://api.tripo3d.ai/v2/openapi/task" \\\n  -H "Authorization: Bearer $TRIPO_API_KEY" \\\n  -H "content-type: application/json" \\\n  -d '{"type":"text_to_model","prompt":"a stylized sword"}'`,
    confidence: 'typical'
  },
  meshy: {
    baseUrl: 'https://api.meshy.ai/openapi/v2',
    platformUrl: 'https://www.meshy.ai',
    auth: 'bearer',
    api: 'Async task API',
    sdk: 'REST',
    docs: 'https://docs.meshy.ai/en/api/text-to-3d',
    example: (model) =>
      `curl -X POST "https://api.meshy.ai/openapi/v2/text-to-3d" \\\n  -H "Authorization: Bearer $MESHY_API_KEY" \\\n  -H "content-type: application/json" \\\n  -d '{"mode":"preview","prompt":"a stylized sword"}'`,
    confidence: 'typical'
  },
  elevenlabs: {
    baseUrl: 'https://api.elevenlabs.io/v1',
    platformUrl: 'https://elevenlabs.io',
    auth: 'xi-api-key',
    api: 'Text to Speech',
    sdk: '@elevenlabs/elevenlabs-js',
    docs: 'https://elevenlabs.io/docs',
    example: (model) =>
      `curl -X POST "https://api.elevenlabs.io/v1/text-to-speech/VOICE_ID" \\\n  -H "xi-api-key: $ELEVENLABS_API_KEY" \\\n  -H "content-type: application/json" \\\n  -d '{"text":"hello","model_id":"${model}"}' --output out.mp3`,
    confidence: 'verified'
  },
  openrouter: {
    baseUrl: 'https://openrouter.ai/api/v1',
    platformUrl: 'https://openrouter.ai',
    auth: 'bearer',
    api: 'OpenAI-compatible chat',
    sdk: 'openai',
    docs: 'https://openrouter.ai/docs',
    example: (model) =>
      `curl https://openrouter.ai/api/v1/chat/completions \\\n  -H "Authorization: Bearer $OPENROUTER_API_KEY" \\\n  -H "content-type: application/json" \\\n  -d '{"model":"${model}","messages":[{"role":"user","content":"hello"}]}'`,
    confidence: 'verified'
  }
};

export function connectionFor(model, { useOpenRouter = false } = {}) {
  if (useOpenRouter && model.access?.openrouter) {
    const provider = PROVIDERS.openrouter;
    return {
      provider: 'OpenRouter',
      env: ['OPENROUTER_API_KEY'],
      platformUrl: provider.platformUrl,
      docsUrl: provider.docs,
      baseUrl: provider.baseUrl,
      apiModel: model.access.openrouter,
      auth: provider.auth,
      sdk: provider.sdk,
      example: provider.example(model.access.openrouter),
      confidence: provider.confidence,
      note: 'One key covers every text model in the catalog.'
    };
  }
  const provider = PROVIDERS[model.provider.id];
  if (!provider) {
    return {
      provider: model.provider.name,
      env: model.provider.env,
      platformUrl: model.provider.keysUrl ?? null,
      docsUrl: model.provider.docsUrl ?? null,
      baseUrl: null,
      apiModel: model.access?.apiModel ?? null,
      confidence: 'unknown',
      example: null,
      note: 'No connection template yet; use the provider docs.'
    };
  }
  const apiModel = model.access?.apiModel ?? model.name;
  let example = provider.example(apiModel);
  if (model.provider.id === 'openai' && model.modality === 'image') {
    example = `curl https://api.openai.com/v1/images/generations \\\n  -H "Authorization: Bearer $OPENAI_API_KEY" \\\n  -H "content-type: application/json" \\\n  -d '{"model":"${apiModel}","prompt":"a product photo on marble","size":"1024x1024","quality":"medium"}'`;
  }
  if (model.provider.id === 'google' && model.modality === 'image') {
    example = `curl "https://generativelanguage.googleapis.com/v1beta/models/${apiModel}:generateContent?key=$GEMINI_API_KEY" \\\n  -H "content-type: application/json" \\\n  -d '{"contents":[{"parts":[{"text":"a product photo on marble"}]}],"generationConfig":{"responseModalities":["IMAGE"]}}'`;
  }
  return {
    provider: model.provider.name,
    env: model.provider.env,
    platformUrl: provider.platformUrl,
    docsUrl: provider.docs,
    baseUrl: provider.baseUrl,
    apiModel,
    auth: provider.auth,
    sdk: provider.sdk,
    example,
    confidence: model.access?.apiModelNote ? 'typical' : provider.confidence,
    note: model.access?.apiModelNote ?? null
  };
}

export function providerConnection(providerId) {
  return PROVIDERS[providerId] ?? null;
}
