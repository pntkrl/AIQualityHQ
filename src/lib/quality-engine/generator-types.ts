// src/lib/quality-engine/generator-types.ts

export type TargetModel = 'gpt-4o' | 'claude-4' | 'gemini-2.5' | 'llama-3' | 'dalle-3' | 'generic';

export type OutputFormat = 'markdown' | 'json' | 'code' | 'bullet-list' | 'step-by-step' | 'structured-text';

export type ToneStyle = 'professional' | 'concise' | 'creative' | 'technical' | 'friendly' | 'strict';

export interface PromptVariable {
  name: string;
  description: string;
  defaultValue?: string;
}

export interface FewShotExample {
  input: string;
  output: string;
}

export interface PromptSpecification {
  taskDescription: string;
  rolePersona: string;
  targetModel: TargetModel;
  outputFormat: OutputFormat;
  toneStyle: ToneStyle;
  constraints: string[];
  variables: PromptVariable[];
  fewShotExamples: FewShotExample[];
  enableGuardrails: boolean;
  enableChainOfThought: boolean;
  maxTokensEstimate?: number;
}

export interface QualityMetricScore {
  score: number; // 0 - 100
  label: string;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  feedback: string;
}

export interface QualityEvaluation {
  overallScore: number;
  structureClarity: QualityMetricScore;
  roleDefinition: QualityMetricScore;
  constraintRigor: QualityMetricScore;
  guardrailStrength: QualityMetricScore;
  variableSafety: QualityMetricScore;
  suggestions: string[];
}

export interface GeneratedSystemPrompt {
  id: string;
  title: string;
  promptText: string;
  jsonSpec: string;
  specification: PromptSpecification;
  evaluation: QualityEvaluation;
  estimatedTokens: number;
  modelOptimizationAdvice: string;
  timestamp: number;
}

export interface SystemPromptTemplate {
  id: string;
  title: string;
  category: 'Developer & Tech' | 'Marketing & SEO' | 'RAG & Support' | 'Security & Guardrails' | 'Creative & Writing';
  description: string;
  specification: Partial<PromptSpecification>;
  iconName: string;
}
