#!/usr/bin/env node
/**
 * Collect Hugging Face dataset metadata used as the public substrate for the
 * quality evidence. We do not re-run closed models; this records the provenance,
 * size class, and freshness of the datasets behind the benchmark families.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATASETS = [
  { id: 'SWE-bench/SWE-bench_Verified', role: 'agentic coding (verified subset)' },
  { id: 'ScaleAI/SWE-bench_Pro', role: 'agentic coding, harder held-out subset' },
  { id: 'SWE-bench/SWE-bench_Multilingual', role: 'multilingual coding' },
  { id: 'MMMU/MMMU', role: 'multimodal reasoning' },
  { id: 'lmarena-ai/arena-human-preference-55k', role: 'human preference (LMArena)' },
  { id: 'open-llm-leaderboard/results', role: 'open-weight model evaluation results' },
  { id: 'Vchitect/VBench_sampled_video', role: 'video generation quality' }
];

async function get(url) {
  const response = await fetch(url, { headers: { accept: 'application/json', 'user-agent': 'modelpick-research' } });
  if (!response.ok) return { error: `HTTP ${response.status}` };
  return response.json();
}

const rows = [];
for (const dataset of DATASETS) {
  const meta = await get(`https://huggingface.co/api/datasets/${dataset.id}`);
  const size = await get(`https://datasets-server.huggingface.co/size?dataset=${encodeURIComponent(dataset.id)}`);
  rows.push({
    ...dataset,
    url: `https://huggingface.co/datasets/${dataset.id}`,
    downloads: meta.downloads ?? null,
    lastModified: meta.lastModified ?? null,
    license: meta.cardData?.license ?? null,
    rows: size?.size?.dataset?.num_rows ?? null,
    sizeBytes: size?.size?.dataset?.num_bytes_original_files ?? null,
    readAt: new Date().toISOString().slice(0, 10),
    error: meta.error ?? null
  });
  console.log(`${dataset.id}: ${meta.downloads ?? '?'} downloads, ${size?.size?.dataset?.num_rows ?? '?'} rows`);
}

const result = {
  schemaVersion: '1.0',
  readAt: new Date().toISOString().slice(0, 10),
  note:
    'Metadata only. Closed frontier models cannot be re-run on these datasets from this repo; the catalog uses published benchmark results and labels the confidence.',
  datasets: rows
};
fs.mkdirSync(path.join(ROOT, 'research'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'research', 'hf-evidence.json'), `${JSON.stringify(result, null, 2)}\n`);
console.log('wrote research/hf-evidence.json');
