// src/lib/quality-engine/optimizer-types.ts

/** Optimization aggressiveness mode */
export type OptimizationMode = 'concise' | 'balanced' | 'detailed';

/** Supported target LLM model definitions */
export interface TargetModel {
  id: string;
  name: string;
  provider: string;
  contextWindow: number;        // max input tokens
  maxOutput: number;             // max output tokens
  inputPricePerMillion: number;  // USD per 1M input tokens
  outputPricePerMillion: number; // USD per 1M output tokens
}

/** Record of a single transformation applied during optimization */
export interface TransformationRecord {
  type:
    | 'filler-removal'
    | 'redundancy-merge'
    | 'abbreviation'
    | 'stopword-trim'
    | 'whitespace-normalize'
    | 'sentence-restructure'
    | 'verbose-phrase';
  original: string;
  replacement: string;
  description: string;
}

/** Full result of an optimization run */
export interface OptimizationResult {
  originalText: string;
  optimizedText: string;

  // Token metrics
  originalTokens: number;
  optimizedTokens: number;
  reductionPercent: number;

  // Character / word metrics
  originalChars: number;
  optimizedChars: number;
  originalWords: number;
  optimizedWords: number;

  // Cost estimation (USD)
  originalCostInput: number;
  optimizedCostInput: number;
  costSavings: number;

  // Transformations applied
  transformations: TransformationRecord[];
  transformationCount: number;

  // Meta
  mode: OptimizationMode;
  modelId: string;
  timestamp: number;
}

/** Token statistics for live counter display */
export interface TokenStats {
  chars: number;
  words: number;
  sentences: number;
  tokens: number;
  estimatedCost: number;
}
