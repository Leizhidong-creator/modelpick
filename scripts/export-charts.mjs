import fs from 'node:fs';
import { loadCatalog } from '../src/core/catalog.js';
import { rankModels } from '../src/core/score.js';

const catalog = loadCatalog({ preferCache: false });
const tasks = ['coding-agent', 'image-gen', 'video-gen', '3d-gen'];
const out = { catalogVersion: catalog.catalogVersion, series: {} };
for (const taskId of tasks) {
  const task = catalog.taskById.get(taskId);
  const ranked = rankModels(catalog, task, { limit: 50, constraints: { minQuality: 0 } });
  out.series[taskId] = {
    label: task.label,
    modality: task.modality,
    points: ranked.all.map((item) => ({
      slug: item.slug,
      name: item.name,
      provider: item.provider,
      quality: item.quality,
      cost: item.costPerTask,
      score: item.score,
      attempts: item.attempts
    }))
  };
}
fs.writeFileSync('assets/chart-data.json', `${JSON.stringify(out, null, 2)}\n`);
console.log('wrote assets/chart-data.json');
