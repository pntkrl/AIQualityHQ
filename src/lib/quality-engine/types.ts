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

export type InjectionVectorType =
  | 'direct_injection'
  | 'indirect_injection'
  | 'jailbreak'
  | 'exfiltration'
  | 'steganography'
  | 'format_exploit';

export interface InjectionThreat {
  id: string;
  vector: InjectionVectorType;
  vectorName: string;
  severity: RuleSeverity;
  title: string;
  matchedPattern?: string;
  snippet?: string;
  explanation: string;
  remediation: string;
  confidence: number; // 0 to 100
}

export interface InjectionVectorScore {
  vector: InjectionVectorType;
  name: string;
  score: number; // 0 to 100 safe score
  threatCount: number;
  status: 'safe' | 'warning' | 'critical';
}

export interface InjectionScannerResult {
  isSafe: boolean;
  riskScore: number; // 0 (completely safe) to 100 (critical risk)
  safetyScore: number; // 100 (safe) to 0 (critical risk)
  threatLevel: 'Safe' | 'Low Risk' | 'Moderate Risk' | 'High Risk' | 'Critical Risk';
  threats: InjectionThreat[];
  vectors: Record<InjectionVectorType, InjectionVectorScore>;
  remediations: string[];
  sanitizedPrompt?: string;
  metadata: {
    scannedLength: number;
    contextScanned: boolean;
    hiddenCharCount: number;
    base64BlocksFound: number;
    timestamp: number;
  };
}

export interface AdversarialProbe {
  id: string;
  name: string;
  category: InjectionVectorType;
  categoryName: string;
  description: string;
  prompt: string;
  context?: string;
  expectedThreat: string;
}

