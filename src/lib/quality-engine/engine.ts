import type { AnalysisResult, DimensionResult, DimensionType, RuleResult } from './types';
import { evaluateRules } from './rules';

const DIMENSION_WEIGHTS: Record<DimensionType, number> = {
  prompt: 0.20,
  memory: 0.15,
  context: 0.20,
  trust: 0.25,
  privacy: 0.10,
  security: 0.10
};

const DIMENSION_NAMES: Record<DimensionType, string> = {
  prompt: 'Prompt Structure',
  memory: 'Memory & State',
  context: 'Context Grounding',
  trust: 'Trust & Accuracy',
  privacy: 'PII & Privacy',
  security: 'Security & Safety'
};

export function analyzePrompt(prompt: string): AnalysisResult {
  const rules = evaluateRules(prompt);

  const dimensions: Partial<Record<DimensionType, DimensionResult>> = {};

  const rulesByDimension: Record<DimensionType, RuleResult[]> = {
    prompt: [],
    memory: [],
    context: [],
    trust: [],
    privacy: [],
    security: []
  };

  rules.forEach(rule => {
    rulesByDimension[rule.dimension].push(rule);
  });

  const MIN_DIM_SCORE = 40;

  (Object.keys(rulesByDimension) as DimensionType[]).forEach(dimKey => {
    const dimRules = rulesByDimension[dimKey];
    let totalScoreWeight = 0;
    let totalWeight = 0;
    let passedCount = 0;

    dimRules.forEach(rule => {
      if (rule.score > 0) {
        totalScoreWeight += rule.score * rule.weight;
        totalWeight += rule.weight;
      }
      if (rule.passed) {
        passedCount++;
      }
    });

    const score = totalWeight > 0 ? Math.round(totalScoreWeight / totalWeight) : MIN_DIM_SCORE;
    const adjustedScore = Math.max(score, MIN_DIM_SCORE);

    dimensions[dimKey] = {
      key: dimKey,
      name: DIMENSION_NAMES[dimKey],
      score: adjustedScore,
      passed: adjustedScore >= 60,
      factorsCount: dimRules.length,
      passedCount
    };
  });

  let overallScore = 0;
  (Object.keys(dimensions) as DimensionType[]).forEach(dimKey => {
    const dimResult = dimensions[dimKey]!;
    overallScore += dimResult.score * DIMENSION_WEIGHTS[dimKey];
  });

  overallScore = Math.round(overallScore);

  const recommendations: string[] = [];
  rules.forEach(rule => {
    if (!rule.passed && rule.suggestion) {
      const severityLabel = rule.severity === 'critical' ? '[CRITICAL] ' : rule.severity === 'major' ? '[MAJOR] ' : '';
      recommendations.push(`${severityLabel}${rule.suggestion}`);
    }
  });

  const charCount = prompt.length;
  const wordCount = prompt.trim() === '' ? 0 : prompt.trim().split(/\s+/).length;

  return {
    overallScore,
    passed: overallScore >= 60,
    dimensions: dimensions as Record<DimensionType, DimensionResult>,
    rules,
    recommendations,
    metadata: {
      charCount,
      wordCount,
      timestamp: Date.now()
    }
  };
}
export type { AnalysisResult, DimensionResult, DimensionType, RuleResult };
