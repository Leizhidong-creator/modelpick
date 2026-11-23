import { findModel } from './catalog.js';
import { recommend } from './recommend.js';
import { ModelPickError } from './errors.js';
import { runTextModel } from './provider-run.js';

export function chooseRunModel(catalog, { prompt, model, task, provider } = {}) {
  if (model) {
    const found = findModel(catalog, model);
    if (!found) throw new ModelPickError(`Unknown model: ${model}`, { code: 'ERR_UNKNOWN_MODEL', hint: 'Run `modelpick models`.' });
    return found;
  }
  if (provider) {
    const candidates = catalog.models
      .filter((entry) => entry.provider.id === provider && entry.modality === 'text')
      .sort((a, b) => b.quality.overall - a.quality.overall);
    if (!candidates.length) {
      throw new ModelPickError(`No text model for provider: ${provider}`, { code: 'ERR_UNKNOWN_PROVIDER' });
    }
    return candidates[0];
  }
  const result = recommend(catalog, { query: prompt, task, optimize: 'balanced', topK: 3 });
  if (result.error) {
    throw new ModelPickError(result.message ?? 'No eligible model.', { code: result.error, hint: 'Relax the constraints or pass --model.' });
  }
  const best = result.availability?.bestAvailable?.slug;
  const slug = best ?? result.recommendation?.slug;
  if (!slug) throw new ModelPickError('No model recommendation.', { code: 'ERR_NO_MODEL' });
  const found = findModel(catalog, slug);
  if (!found) throw new ModelPickError(`Recommended model not in catalog: ${slug}`, { code: 'ERR_UNKNOWN_MODEL' });
  return found;
}

export async function runRecommended({ catalog, prompt, messages, system, context, output, model, task, provider, fetchImpl, maxTokens } = {}) {
  const chosen = chooseRunModel(catalog, { prompt, model, task, provider });
  const result = await runTextModel({ model: chosen, prompt, messages, system, context, output, fetchImpl, maxTokens });
  return result;
}
