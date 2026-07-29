// src/lib/quality-engine/optimizer-engine.ts
//
// Client-side heuristic prompt optimization engine.
// Shortens prompts by removing filler, redundancy, and verbose phrasing
// while preserving semantic meaning. No LLM API calls — runs entirely
// in the browser.

import type {
  OptimizationMode,
  OptimizationResult,
  TargetModel,
  TokenStats,
  TransformationRecord,
} from './optimizer-types';

// ---------------------------------------------------------------------------
// Model Registry
// ---------------------------------------------------------------------------

export const MODEL_REGISTRY: TargetModel[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    contextWindow: 128_000,
    maxOutput: 16_384,
    inputPricePerMillion: 2.50,
    outputPricePerMillion: 10.00,
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'OpenAI',
    contextWindow: 128_000,
    maxOutput: 4_096,
    inputPricePerMillion: 10.00,
    outputPricePerMillion: 30.00,
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    contextWindow: 1_048_576,
    maxOutput: 65_536,
    inputPricePerMillion: 0.15,
    outputPricePerMillion: 0.60,
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    contextWindow: 1_048_576,
    maxOutput: 65_536,
    inputPricePerMillion: 1.25,
    outputPricePerMillion: 10.00,
  },
  {
    id: 'claude-opus-4',
    name: 'Claude Opus 4',
    provider: 'Anthropic',
    contextWindow: 200_000,
    maxOutput: 32_000,
    inputPricePerMillion: 15.00,
    outputPricePerMillion: 75.00,
  },
  {
    id: 'claude-sonnet-4',
    name: 'Claude Sonnet 4',
    provider: 'Anthropic',
    contextWindow: 200_000,
    maxOutput: 16_000,
    inputPricePerMillion: 3.00,
    outputPricePerMillion: 15.00,
  },
];

export function getModel(id: string): TargetModel {
  return MODEL_REGISTRY.find((m) => m.id === id) || MODEL_REGISTRY[0];
}

// ---------------------------------------------------------------------------
// Token Estimation
// ---------------------------------------------------------------------------

/**
 * Approximate token count using the ~4-chars-per-token heuristic.
 * This is intentionally an estimate — exact counts require model-specific
 * tokenizers (tiktoken for GPT, SentencePiece for Gemini/Claude).
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  // Average English text: ~4 characters per token (including spaces)
  // Code/structured text: ~3.5 chars per token
  // We use 4.0 as a conservative default
  return Math.ceil(text.length / 4);
}

/** Compute live token statistics for a piece of text */
export function computeTokenStats(text: string, model: TargetModel): TokenStats {
  const chars = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const sentences = text.trim()
    ? (text.match(/[.!?]+(?:\s|$)/g) || []).length || (text.trim() ? 1 : 0)
    : 0;
  const tokens = estimateTokens(text);
  const estimatedCost = (tokens / 1_000_000) * model.inputPricePerMillion;
  return { chars, words, sentences, tokens, estimatedCost };
}

// ---------------------------------------------------------------------------
// Filler Phrase Mappings
// ---------------------------------------------------------------------------

interface PhrasePair {
  pattern: RegExp;
  replacement: string;
  description: string;
}

const FILLER_PHRASES: PhrasePair[] = [
  // Verbose → concise substitutions
  { pattern: /\bin order to\b/gi, replacement: 'to', description: '"in order to" → "to"' },
  { pattern: /\bdue to the fact that\b/gi, replacement: 'because', description: '"due to the fact that" → "because"' },
  { pattern: /\bin the event that\b/gi, replacement: 'if', description: '"in the event that" → "if"' },
  { pattern: /\bat this point in time\b/gi, replacement: 'now', description: '"at this point in time" → "now"' },
  { pattern: /\bat the present time\b/gi, replacement: 'now', description: '"at the present time" → "now"' },
  { pattern: /\bfor the purpose of\b/gi, replacement: 'to', description: '"for the purpose of" → "to"' },
  { pattern: /\bwith regard to\b/gi, replacement: 'regarding', description: '"with regard to" → "regarding"' },
  { pattern: /\bwith respect to\b/gi, replacement: 'regarding', description: '"with respect to" → "regarding"' },
  { pattern: /\bin regard to\b/gi, replacement: 'regarding', description: '"in regard to" → "regarding"' },
  { pattern: /\bin reference to\b/gi, replacement: 'regarding', description: '"in reference to" → "regarding"' },
  { pattern: /\bon the other hand\b/gi, replacement: 'however', description: '"on the other hand" → "however"' },
  { pattern: /\bas a matter of fact\b/gi, replacement: 'in fact', description: '"as a matter of fact" → "in fact"' },
  { pattern: /\bit is important to note that\b/gi, replacement: 'notably,', description: '"it is important to note that" → "notably,"' },
  { pattern: /\bit should be noted that\b/gi, replacement: 'note:', description: '"it should be noted that" → "note:"' },
  { pattern: /\bit is worth mentioning that\b/gi, replacement: 'notably,', description: '"it is worth mentioning that" → "notably,"' },
  { pattern: /\bin light of the fact that\b/gi, replacement: 'since', description: '"in light of the fact that" → "since"' },
  { pattern: /\bhas the ability to\b/gi, replacement: 'can', description: '"has the ability to" → "can"' },
  { pattern: /\bis able to\b/gi, replacement: 'can', description: '"is able to" → "can"' },
  { pattern: /\bare able to\b/gi, replacement: 'can', description: '"are able to" → "can"' },
  { pattern: /\bin spite of the fact that\b/gi, replacement: 'although', description: '"in spite of the fact that" → "although"' },
  { pattern: /\bfor the reason that\b/gi, replacement: 'because', description: '"for the reason that" → "because"' },
  { pattern: /\bby means of\b/gi, replacement: 'by', description: '"by means of" → "by"' },
  { pattern: /\bin the near future\b/gi, replacement: 'soon', description: '"in the near future" → "soon"' },
  { pattern: /\ba large number of\b/gi, replacement: 'many', description: '"a large number of" → "many"' },
  { pattern: /\ba significant number of\b/gi, replacement: 'many', description: '"a significant number of" → "many"' },
  { pattern: /\bthe vast majority of\b/gi, replacement: 'most', description: '"the vast majority of" → "most"' },
  { pattern: /\bin the process of\b/gi, replacement: 'while', description: '"in the process of" → "while"' },
  { pattern: /\bhave a tendency to\b/gi, replacement: 'tend to', description: '"have a tendency to" → "tend to"' },
  { pattern: /\btake into consideration\b/gi, replacement: 'consider', description: '"take into consideration" → "consider"' },
  { pattern: /\btake into account\b/gi, replacement: 'consider', description: '"take into account" → "consider"' },
  { pattern: /\bmake a decision\b/gi, replacement: 'decide', description: '"make a decision" → "decide"' },
  { pattern: /\bcome to a conclusion\b/gi, replacement: 'conclude', description: '"come to a conclusion" → "conclude"' },
  { pattern: /\bgive an indication of\b/gi, replacement: 'indicate', description: '"give an indication of" → "indicate"' },
  { pattern: /\bprovide a description of\b/gi, replacement: 'describe', description: '"provide a description of" → "describe"' },
  { pattern: /\bconduct an analysis of\b/gi, replacement: 'analyze', description: '"conduct an analysis of" → "analyze"' },
  { pattern: /\bperform an evaluation of\b/gi, replacement: 'evaluate', description: '"perform an evaluation of" → "evaluate"' },
  { pattern: /\bin close proximity to\b/gi, replacement: 'near', description: '"in close proximity to" → "near"' },
  { pattern: /\bin the vicinity of\b/gi, replacement: 'near', description: '"in the vicinity of" → "near"' },
  { pattern: /\bat the end of the day\b/gi, replacement: 'ultimately', description: '"at the end of the day" → "ultimately"' },
  { pattern: /\bthe fact of the matter is\b/gi, replacement: '', description: 'Removed "the fact of the matter is"' },
  { pattern: /\bneedless to say\b/gi, replacement: '', description: 'Removed "needless to say"' },
  { pattern: /\ball things considered\b/gi, replacement: 'overall', description: '"all things considered" → "overall"' },
  { pattern: /\bby and large\b/gi, replacement: 'generally', description: '"by and large" → "generally"' },
  { pattern: /\bfirst and foremost\b/gi, replacement: 'first', description: '"first and foremost" → "first"' },
  { pattern: /\blast but not least\b/gi, replacement: 'finally', description: '"last but not least" → "finally"' },
  { pattern: /\beach and every\b/gi, replacement: 'every', description: '"each and every" → "every"' },
  { pattern: /\bany and all\b/gi, replacement: 'all', description: '"any and all" → "all"' },
  { pattern: /\bif and when\b/gi, replacement: 'when', description: '"if and when" → "when"' },
  { pattern: /\bunless and until\b/gi, replacement: 'until', description: '"unless and until" → "until"' },
  { pattern: /\bover and above\b/gi, replacement: 'beyond', description: '"over and above" → "beyond"' },
  { pattern: /\bone and the same\b/gi, replacement: 'the same', description: '"one and the same" → "the same"' },
  { pattern: /\bnull and void\b/gi, replacement: 'void', description: '"null and void" → "void"' },
];



// ---------------------------------------------------------------------------
// Hedge / Stopword Patterns
// ---------------------------------------------------------------------------

const HEDGE_WORDS: PhrasePair[] = [
  { pattern: /\bbasically\b,?\s*/gi, replacement: '', description: 'Removed "basically"' },
  { pattern: /\bessentially\b,?\s*/gi, replacement: '', description: 'Removed "essentially"' },
  { pattern: /\bactually\b,?\s*/gi, replacement: '', description: 'Removed "actually"' },
  { pattern: /\bliterally\b,?\s*/gi, replacement: '', description: 'Removed "literally"' },
  { pattern: /\bvirtually\b,?\s*/gi, replacement: '', description: 'Removed "virtually"' },
  { pattern: /\bsimply\b,?\s*/gi, replacement: '', description: 'Removed "simply"' },
  { pattern: /\bjust\b,?\s*/gi, replacement: '', description: 'Removed "just"' },
  { pattern: /\breally\b,?\s*/gi, replacement: '', description: 'Removed "really"' },
  { pattern: /\bvery\b\s+/gi, replacement: '', description: 'Removed "very"' },
  { pattern: /\bquite\b\s+/gi, replacement: '', description: 'Removed "quite"' },
  { pattern: /\brather\b\s+/gi, replacement: '', description: 'Removed "rather"' },
  { pattern: /\bsomewhat\b\s+/gi, replacement: '', description: 'Removed "somewhat"' },
  { pattern: /\bkind of\b\s*/gi, replacement: '', description: 'Removed "kind of"' },
  { pattern: /\bsort of\b\s*/gi, replacement: '', description: 'Removed "sort of"' },
  { pattern: /\bpretty much\b\s*/gi, replacement: '', description: 'Removed "pretty much"' },
  { pattern: /\bmore or less\b\s*/gi, replacement: '', description: 'Removed "more or less"' },
  { pattern: /\byou know\b,?\s*/gi, replacement: '', description: 'Removed "you know"' },
  { pattern: /\bI mean\b,?\s*/gi, replacement: '', description: 'Removed "I mean"' },
  { pattern: /\bso to speak\b,?\s*/gi, replacement: '', description: 'Removed "so to speak"' },
  { pattern: /\bas it were\b,?\s*/gi, replacement: '', description: 'Removed "as it were"' },
];

// ---------------------------------------------------------------------------
// Abbreviation Substitutions
// ---------------------------------------------------------------------------

const ABBREVIATIONS: PhrasePair[] = [
  { pattern: /\bfor example\b/gi, replacement: 'e.g.', description: '"for example" → "e.g."' },
  { pattern: /\bfor instance\b/gi, replacement: 'e.g.', description: '"for instance" → "e.g."' },
  { pattern: /\bthat is to say\b/gi, replacement: 'i.e.', description: '"that is to say" → "i.e."' },
  { pattern: /\bin other words\b/gi, replacement: 'i.e.', description: '"in other words" → "i.e."' },
  { pattern: /\band so on\b/gi, replacement: 'etc.', description: '"and so on" → "etc."' },
  { pattern: /\band so forth\b/gi, replacement: 'etc.', description: '"and so forth" → "etc."' },
  { pattern: /\betcetera\b/gi, replacement: 'etc.', description: '"etcetera" → "etc."' },
  { pattern: /\bversus\b/gi, replacement: 'vs.', description: '"versus" → "vs."' },
  { pattern: /\bapproximately\b/gi, replacement: '~', description: '"approximately" → "~"' },
  { pattern: /\bgenerate a(?:n)?\s+(?:brief\s+)?summary of(?:\s+the)?\b/gi, replacement: 'summarize', description: '"generate a summary of" → "summarize"' },
  { pattern: /\bprovide a(?:n)?\s+(?:brief\s+)?explanation of\b/gi, replacement: 'explain', description: '"provide an explanation of" → "explain"' },
  { pattern: /\bprovide a(?:n)?\s+(?:brief\s+)?overview of\b/gi, replacement: 'overview:', description: '"provide an overview of" → "overview:"' },
  { pattern: /\bwrite a(?:n)?\s+(?:detailed\s+)?description of\b/gi, replacement: 'describe', description: '"write a description of" → "describe"' },
];

// ---------------------------------------------------------------------------
// Verbose Instruction Patterns (prompt-specific)
// ---------------------------------------------------------------------------

const VERBOSE_INSTRUCTIONS: PhrasePair[] = [
  { pattern: /\bI would like you to\b/gi, replacement: 'Please', description: '"I would like you to" → "Please"' },
  { pattern: /\bI want you to\b/gi, replacement: '', description: 'Removed "I want you to"' },
  { pattern: /\bcan you please\b/gi, replacement: 'Please', description: '"can you please" → "Please"' },
  { pattern: /\bcould you please\b/gi, replacement: 'Please', description: '"could you please" → "Please"' },
  { pattern: /\bwould you be able to\b/gi, replacement: 'Please', description: '"would you be able to" → "Please"' },
  { pattern: /\bplease make sure to\b/gi, replacement: 'Ensure', description: '"please make sure to" → "Ensure"' },
  { pattern: /\bmake sure that\b/gi, replacement: 'Ensure', description: '"make sure that" → "Ensure"' },
  { pattern: /\bplease note that\b/gi, replacement: 'Note:', description: '"please note that" → "Note:"' },
  { pattern: /\bkeep in mind that\b/gi, replacement: 'Note:', description: '"keep in mind that" → "Note:"' },
  { pattern: /\bplease be aware that\b/gi, replacement: 'Note:', description: '"please be aware that" → "Note:"' },
  { pattern: /\bthe following is\b/gi, replacement: 'below is', description: '"the following is" → "below is"' },
  { pattern: /\bas mentioned (?:above|earlier|before|previously)\b/gi, replacement: '(see above)', description: 'Simplified "as mentioned above/earlier"' },
];

// ---------------------------------------------------------------------------
// Mode Configuration
// ---------------------------------------------------------------------------

interface ModeConfig {
  applyFillers: boolean;
  applyHedges: boolean;
  applyAbbreviations: boolean;
  applyVerboseInstructions: boolean;
  applyRedundancy: boolean;
  applyWhitespace: boolean;
}

const MODE_CONFIGS: Record<OptimizationMode, ModeConfig> = {
  concise: {
    applyFillers: true,
    applyHedges: true,
    applyAbbreviations: true,
    applyVerboseInstructions: true,
    applyRedundancy: true,
    applyWhitespace: true,
  },
  balanced: {
    applyFillers: true,
    applyHedges: false,
    applyAbbreviations: true,
    applyVerboseInstructions: true,
    applyRedundancy: true,
    applyWhitespace: true,
  },
  detailed: {
    applyFillers: true,
    applyHedges: false,
    applyAbbreviations: false,
    applyVerboseInstructions: false,
    applyRedundancy: false,
    applyWhitespace: true,
  },
};

// ---------------------------------------------------------------------------
// Core Optimization Pipeline
// ---------------------------------------------------------------------------

function applyPatterns(
  text: string,
  patterns: PhrasePair[],
  type: TransformationRecord['type'],
  transformations: TransformationRecord[]
): string {
  let result = text;
  for (const { pattern, replacement, description } of patterns) {
    if (!pattern) continue; // guard against missing pattern
    const matches = result.match(pattern);
    if (matches) {
      for (const match of matches) {
        transformations.push({
          type,
          original: match,
          replacement: replacement || '(removed)',
          description,
        });
      }
      result = result.replace(pattern, replacement);
    }
  }
  return result;
}

/**
 * Remove duplicate sentences (exact match after normalization).
 * Keeps the first occurrence of each sentence.
 */
function removeRedundantSentences(
  text: string,
  transformations: TransformationRecord[]
): string {
  // Split on sentence boundaries
  const sentences = text.split(/(?<=[.!?])\s+/);
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const sentence of sentences) {
    const normalized = sentence.trim().toLowerCase().replace(/\s+/g, ' ');
    if (normalized.length < 5) {
      unique.push(sentence);
      continue;
    }
    if (seen.has(normalized)) {
      transformations.push({
        type: 'redundancy-merge',
        original: sentence.trim(),
        replacement: '(removed duplicate)',
        description: 'Removed duplicate sentence',
      });
    } else {
      seen.add(normalized);
      unique.push(sentence);
    }
  }

  return unique.join(' ');
}

/** Normalize whitespace: collapse runs, trim lines, remove blank lines */
function normalizeWhitespace(
  text: string,
  transformations: TransformationRecord[]
): string {
  const original = text;
  let result = text;

  // Collapse multiple spaces to single
  result = result.replace(/ {2,}/g, ' ');

  // Collapse 3+ newlines to 2
  result = result.replace(/\n{3,}/g, '\n\n');

  // Trim each line
  result = result
    .split('\n')
    .map((line) => line.trim())
    .join('\n');

  // Trim overall
  result = result.trim();

  if (result !== original) {
    transformations.push({
      type: 'whitespace-normalize',
      original: `(${original.length - result.length} chars of whitespace)`,
      replacement: '(normalized)',
      description: 'Normalized whitespace and blank lines',
    });
  }

  return result;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Run the full optimization pipeline on the given text.
 */
export function optimizePrompt(
  text: string,
  mode: OptimizationMode,
  modelId: string
): OptimizationResult {
  const model = getModel(modelId);
  const config = MODE_CONFIGS[mode];
  const transformations: TransformationRecord[] = [];
  let result = text;

  // 1. Whitespace normalization (always first)
  if (config.applyWhitespace) {
    result = normalizeWhitespace(result, transformations);
  }

  // 2. Filler phrase removal
  if (config.applyFillers) {
    result = applyPatterns(result, FILLER_PHRASES, 'filler-removal', transformations);
  }

  // 3. Verbose instruction patterns
  if (config.applyVerboseInstructions) {
    result = applyPatterns(result, VERBOSE_INSTRUCTIONS, 'verbose-phrase', transformations);
  }

  // 4. Abbreviation substitution
  if (config.applyAbbreviations) {
    result = applyPatterns(result, ABBREVIATIONS, 'abbreviation', transformations);
  }

  // 5. Hedge / stopword trimming (concise mode only)
  if (config.applyHedges) {
    result = applyPatterns(result, HEDGE_WORDS, 'stopword-trim', transformations);
  }

  // 6. Redundancy removal
  if (config.applyRedundancy) {
    result = removeRedundantSentences(result, transformations);
  }

  // 7. Final whitespace cleanup
  result = result.replace(/ {2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim();

  // Compute metrics
  const originalTokens = estimateTokens(text);
  const optimizedTokens = estimateTokens(result);
  const reductionPercent =
    originalTokens > 0
      ? Math.round(((originalTokens - optimizedTokens) / originalTokens) * 100)
      : 0;

  const originalCostInput = (originalTokens / 1_000_000) * model.inputPricePerMillion;
  const optimizedCostInput = (optimizedTokens / 1_000_000) * model.inputPricePerMillion;

  return {
    originalText: text,
    optimizedText: result,
    originalTokens,
    optimizedTokens,
    reductionPercent,
    originalChars: text.length,
    optimizedChars: result.length,
    originalWords: text.trim() ? text.trim().split(/\s+/).length : 0,
    optimizedWords: result.trim() ? result.trim().split(/\s+/).length : 0,
    originalCostInput,
    optimizedCostInput,
    costSavings: originalCostInput - optimizedCostInput,
    transformations,
    transformationCount: transformations.length,
    mode,
    modelId,
    timestamp: Date.now(),
  };
}

/**
 * Compute cost savings for a given token count across ALL models.
 * Used by the stats panel.
 */
export function computeCostAcrossModels(
  originalTokens: number,
  optimizedTokens: number
): Array<{
  model: TargetModel;
  originalCost: number;
  optimizedCost: number;
  savings: number;
}> {
  return MODEL_REGISTRY.map((model) => {
    const originalCost = (originalTokens / 1_000_000) * model.inputPricePerMillion;
    const optimizedCost = (optimizedTokens / 1_000_000) * model.inputPricePerMillion;
    return {
      model,
      originalCost,
      optimizedCost,
      savings: originalCost - optimizedCost,
    };
  });
}
