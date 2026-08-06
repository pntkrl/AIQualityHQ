import type { AnalysisResult, DimensionResult, DimensionType, RuleResult, RuleSeverity } from './types';
import { evaluateRules, detectAndRedactPII } from './rules';
import { getUseCase } from './use-cases';

const BASE_DIMENSION_WEIGHTS: Record<DimensionType, number> = {
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

export function analyzePrompt(prompt: string, useCaseId: string = 'general'): AnalysisResult {
  const useCase = getUseCase(useCaseId);
  const applicableRulesSet = new Set(useCase.applicableRules);
  const rules = evaluateRules(prompt, applicableRulesSet);

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

  const MIN_DIM_SCORE = 0;

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

  // Renormalize dimension weights to only include dimensions with applicable rules
  const activeDimKeys = (Object.keys(rulesByDimension) as DimensionType[])
    .filter(dimKey => rulesByDimension[dimKey].length > 0);

  const activeWeightTotal = activeDimKeys.reduce(
    (sum, k) => sum + BASE_DIMENSION_WEIGHTS[k], 0
  );

  let overallScore = 0;
  if (activeWeightTotal > 0) {
    activeDimKeys.forEach(dimKey => {
      const dimResult = dimensions[dimKey]!;
      const renormalizedWeight = BASE_DIMENSION_WEIGHTS[dimKey] / activeWeightTotal;
      overallScore += dimResult.score * renormalizedWeight;
    });
  }
  overallScore = Math.round(overallScore);

  // Prioritize the most actionable, highest-severity fixes (top 5) instead of dumping every failed check
  const passed = overallScore >= 60;
  const severityOrder: Record<RuleSeverity, number> = { critical: 0, major: 1, minor: 2, pass: 3 };
  const actionable = rules
    .filter(rule => !rule.passed && rule.suggestion)
    .sort((a, b) => (severityOrder[a.severity] - severityOrder[b.severity]) || (b.weight - a.weight));
  const recommendations = passed
    ? [] as string[]
    : actionable.slice(0, 5).map(rule => {
        const severityLabel = rule.severity === 'critical' ? '[CRITICAL] ' : rule.severity === 'major' ? '[MAJOR] ' : '';
        return `${severityLabel}${rule.suggestion}`;
      });

  const charCount = prompt.length;
  const wordCount = prompt.trim() === '' ? 0 : prompt.trim().split(/\s+/).length;
  const piiSummary = detectAndRedactPII(prompt);

  return {
    overallScore,
    passed,
    dimensions: dimensions as Record<DimensionType, DimensionResult>,
    rules,
    recommendations,
    piiSummary,
    metadata: {
      charCount,
      wordCount,
      timestamp: Date.now()
    }
  };
}
export type { AnalysisResult, DimensionResult, DimensionType, RuleResult };
