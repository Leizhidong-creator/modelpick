import type { ModelPickError } from './src/core/errors.js';

export interface Pricing {
  unit: 'mtok' | 'image' | 'second' | 'asset' | 'kchar' | 'minute' | 'song';
  input?: number;
  output?: number;
  cachedInput?: number;
  cacheWrite?: number;
  amount?: number;
  currency?: string;
  confidence?: 'verified' | 'estimated';
  variants?: Array<{ label: string; amount: number; default?: boolean }>;
}

export interface Model {
  id?: string;
  slug: string;
  name: string;
  provider: {
    id: string;
    name: string;
    env: string[];
    keysUrl?: string;
    docsUrl?: string;
    sdk?: string;
  };
  modality: 'text' | 'image' | 'video' | '3d' | 'audio';
  contextWindow: number | null;
  maxOutput?: number | null;
  pricing: Pricing;
  quality: Record<string, number>;
  speed?: { outputTps?: number; ttftMs?: number; latencySec?: number };
  tags?: string[];
  openWeights: boolean;
  releaseDate?: string | null;
  capabilities?: Record<string, boolean | number>;
  access?: { apiModel?: string; apiModelNote?: string; openrouter?: string };
  notes?: string | null;
  sources: Array<{ name: string; url: string; readAt: string }>;
}

export interface Task {
  id: string;
  label: string;
  modality: 'text' | 'image' | 'video' | '3d' | 'audio';
  blurb: string;
  keywords: Array<[string, number]>;
  qualityMix: Record<string, number>;
  weights: { quality: number; cost: number; speed: number; context: number };
  workload: Record<string, number | string>;
  requires?: string[];
  defaults?: { qualityFloor?: number; costAnchor?: number };
}

export interface Catalog {
  schemaVersion: number;
  catalogVersion: string;
  updatedAt: string;
  models: Model[];
  tasks: Task[];
  bySlug: Map<string, Model>;
  byId: Map<string, Model>;
  byName: Map<string, Model>;
  taskById: Map<string, Task>;
}

export interface SetupBlock {
  direct: {
    provider: string;
    env: string[];
    keysUrl?: string;
    docsUrl?: string;
    apiModel?: string | null;
    apiModelNote?: string | null;
  };
  openrouter?: { env: string[]; model: string; baseUrl: string; keysUrl: string };
}

export interface Recommendation {
  slug: string;
  name: string;
  provider: string;
  quality: number;
  costPerTask: number;
  unitCost: number;
  attempts: number;
  expectedAttempts: number;
  latencySec: number;
  score: number;
  labels: string[];
  priceConfidence: 'verified' | 'estimated';
  why: string[];
  tradeoffs: string[];
  setup: SetupBlock;
  openWeights: boolean;
  contextWindow: number | null;
  evidence: Array<{ name: string; url: string; readAt: string }>;
}

export interface RecommendationResult {
  schemaVersion: string;
  kind: 'recommendation';
  query: string | null;
  task: { id: string; label: string; modality: string; confidence: string };
  catalog: { version: string; updatedAt: string; stale: boolean };
  recommendation: Recommendation | null;
  alternatives: Recommendation[];
  picks: Record<string, Recommendation | null>;
  assumptions: Record<string, unknown>;
  error: string | null;
}

export declare function recommend(
  catalog: Catalog,
  input: {
    query?: string;
    task?: string;
    optimize?: 'balanced' | 'quality' | 'cost' | 'speed' | 'privacy';
    maxCost?: number;
    minQuality?: number;
    openWeights?: boolean;
    contextTokens?: number;
    excludeProviders?: string[];
    topK?: number;
  }
): RecommendationResult;

export declare function loadCatalog(options?: {
  catalogFile?: string;
  tasksFile?: string;
  overridesFile?: string;
  preferCache?: boolean;
}): Catalog;

export declare function plan(catalog: Catalog, goal: string, options?: Record<string, unknown>): unknown;
export declare function compare(catalog: Catalog, slugs: string[], options?: Record<string, unknown>): unknown;
export declare function detectTask(text: string, tasks: Task[]): unknown;
export { ModelPickError };
