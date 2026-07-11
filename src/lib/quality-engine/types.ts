export type DimensionType = 'prompt' | 'memory' | 'context' | 'trust' | 'privacy' | 'security';

export type RuleSeverity = 'critical' | 'major' | 'minor' | 'pass';

export function scoreToSeverity(score: number): RuleSeverity {
  if (score >= 100) return 'pass';
  if (score >= 67) return 'minor';
  if (score >= 34) return 'major';
  return 'critical';
}

export interface RuleResult {
  id: string;
  name: string;
  dimension: DimensionType;
  passed: boolean;
  score: number;
  weight: number;
  explanation: string;
  suggestion?: string;
  severity: RuleSeverity;
}

export interface DimensionResult {
  key: DimensionType;
  name: string;
  score: number;
  passed: boolean;
  factorsCount: number;
  passedCount: number;
}

export interface AIScoreResult {
  overallScore: number;
  clarity: number;
  coherence: number;
  instructionDensity: number;
  toneConsistency: number;
  explanation: string;
}

export interface AnalysisResult {
  overallScore: number;
  passed: boolean;
  dimensions: Record<DimensionType, DimensionResult>;
  rules: RuleResult[];
  recommendations: string[];
  aiScore?: AIScoreResult;
  metadata: {
    charCount: number;
    wordCount: number;
    timestamp: number;
  };
}

export interface AIAuditFinding {
  name: string;
  passed: boolean;
  severity: RuleSeverity;
  explanation: string;
  suggestion?: string;
}

export interface AIAuditResult {
  overallScore: number;
  passed: boolean;
  dimensions: {
    clarity: { name: string; score: number; feedback: string };
    structure: { name: string; score: number; feedback: string };
    context: { name: string; score: number; feedback: string };
    safety: { name: string; score: number; feedback: string };
    formatting: { name: string; score: number; feedback: string };
  };
  findings: AIAuditFinding[];
  recommendations: string[];
  optimizedPrompt: string;
  metadata?: {
    model: string;
    timestamp: number;
    charCount: number;
    wordCount: number;
  };
}
