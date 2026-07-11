export interface UseCase {
  id: string;
  name: string;
  description: string;
  applicableRules: string[];
}

const ALL_RULES = [
  'p-len', 'p-role', 'p-task', 'p-output', 'p-examples',
  'p-format-consistency', 'p-constraints', 'p-platform',
  'p-visual-style', 'p-component-detail', 'p-color-definition',
  'p-ui-keywords',
  'm-history', 'm-markup', 'm-persona-continuity', 'm-context-summary',
  'c-delims', 'c-grounding', 'c-hierarchy', 'c-variable-use', 'c-references',
  't-hallucination', 't-citations', 't-confidence', 't-verification', 't-fact-checking',
  'p-pii', 'p-isolation', 'p-minimization',
  's-injection', 's-safety', 's-credentials', 's-output-boundary', 's-role-isolation',
  'x-con-length', 'x-con-format', 'x-con-override',
  'x-tokens'
] as const;

export const USE_CASES: UseCase[] = [
  {
    id: 'general',
    name: 'General Purpose',
    description: 'All quality checks apply equally across every dimension.',
    applicableRules: [...ALL_RULES]
  },
  {
    id: 'creative-writing',
    name: 'Creative Writing',
    description: 'Emphasizes style, tone, and creativity; skips platform-specific and compliance-heavy rules.',
    applicableRules: [
      'p-len', 'p-role', 'p-task', 'p-output', 'p-examples',
      'p-format-consistency', 'p-constraints',
      'p-visual-style',
      'm-history', 'm-markup', 'm-persona-continuity', 'm-context-summary',
      'c-hierarchy',
      't-hallucination', 't-confidence',
      'x-con-length', 'x-con-format', 'x-con-override',
      'x-tokens'
    ]
  },
  {
    id: 'code-generation',
    name: 'Code Generation',
    description: 'Focuses on structural precision, constraints, and output formatting; skips visual/UI and persona rules.',
    applicableRules: [
      'p-len', 'p-role', 'p-task', 'p-output', 'p-examples',
      'p-format-consistency', 'p-constraints', 'p-platform',
      'c-delims', 'c-grounding', 'c-hierarchy', 'c-variable-use', 'c-references',
      't-hallucination', 't-verification',
      's-injection', 's-safety', 's-credentials', 's-output-boundary', 's-role-isolation',
      'x-con-length', 'x-con-format', 'x-con-override',
      'x-tokens'
    ]
  },
  {
    id: 'customer-support',
    name: 'Customer Support',
    description: 'Prioritizes PII safeguarding, safety, and conversation continuity; skips UI/UX and structural hierarchy rules.',
    applicableRules: [
      'p-len', 'p-role', 'p-task', 'p-output', 'p-examples',
      'p-constraints',
      'm-history', 'm-markup', 'm-context-summary',
      'c-grounding', 'c-references',
      't-hallucination', 't-confidence', 't-verification',
      'p-pii', 'p-isolation', 'p-minimization',
      's-injection', 's-safety', 's-credentials', 's-output-boundary', 's-role-isolation',
      'x-con-override',
      'x-tokens'
    ]
  },
  {
    id: 'academic-research',
    name: 'Academic / Research',
    description: 'Stresses citations, fact-checking, and data grounding; skips UI/visual and platform rules.',
    applicableRules: [
      'p-len', 'p-role', 'p-task', 'p-output', 'p-examples',
      'p-format-consistency', 'p-constraints',
      'c-delims', 'c-grounding', 'c-hierarchy', 'c-variable-use', 'c-references',
      't-hallucination', 't-citations', 't-confidence', 't-verification', 't-fact-checking',
      'p-pii', 'p-isolation', 'p-minimization',
      's-injection', 's-credentials', 's-output-boundary',
      'x-con-length', 'x-con-format', 'x-con-override',
      'x-tokens'
    ]
  },
  {
    id: 'ui-ux-design',
    name: 'UI/UX Design',
    description: 'Full UI/UX vocabulary detection; skips trust, citation, and credential rules.',
    applicableRules: [
      'p-len', 'p-role', 'p-task', 'p-output', 'p-examples',
      'p-format-consistency', 'p-constraints', 'p-platform',
      'p-visual-style', 'p-component-detail', 'p-color-definition', 'p-ui-keywords',
      'c-hierarchy',
      't-hallucination', 't-confidence',
      'x-con-length', 'x-con-format', 'x-con-override',
      'x-tokens'
    ]
  },
  {
    id: 'data-analysis',
    name: 'Data Analysis',
    description: 'Focuses on grounding, structure, and accuracy; skips UI/visual and persona continuity.',
    applicableRules: [
      'p-len', 'p-role', 'p-task', 'p-output', 'p-examples',
      'p-format-consistency', 'p-constraints',
      'm-history', 'm-context-summary',
      'c-delims', 'c-grounding', 'c-hierarchy', 'c-variable-use', 'c-references',
      't-hallucination', 't-citations', 't-verification', 't-fact-checking',
      'p-pii', 'p-isolation', 'p-minimization',
      's-injection', 's-credentials', 's-output-boundary',
      'x-con-length', 'x-con-format', 'x-con-override',
      'x-tokens'
    ]
  },
  {
    id: 'technical-documentation',
    name: 'Technical Documentation',
    description: 'Emphasizes clarity, format consistency, and hierarchy; skips visual mood and UI terminology.',
    applicableRules: [
      'p-len', 'p-role', 'p-task', 'p-output', 'p-examples',
      'p-format-consistency', 'p-constraints', 'p-platform',
      'm-context-summary',
      'c-delims', 'c-grounding', 'c-hierarchy', 'c-variable-use', 'c-references',
      't-hallucination', 't-verification', 't-fact-checking',
      's-injection', 's-safety', 's-credentials', 's-output-boundary', 's-role-isolation',
      'x-con-length', 'x-con-format', 'x-con-override',
      'x-tokens'
    ]
  },
  {
    id: 'brainstorming',
    name: 'Brainstorming / Ideation',
    description: 'Light-touch checks focused on task clarity and style; skips security, compliance, and rigid formatting rules.',
    applicableRules: [
      'p-len', 'p-role', 'p-task', 'p-examples',
      'p-visual-style',
      'm-persona-continuity',
      't-confidence',
      'x-con-length', 'x-con-format', 'x-con-override',
      'x-tokens'
    ]
  },
  {
    id: 'translation',
    name: 'Translation',
    description: 'Focuses on input/output clarity and delimiters; skips platform, visual, and compliance rules.',
    applicableRules: [
      'p-len', 'p-role', 'p-task', 'p-output', 'p-examples',
      'p-format-consistency', 'p-constraints',
      'c-delims', 'c-grounding', 'c-references',
      't-hallucination', 't-confidence', 't-verification',
      'x-con-length', 'x-con-format', 'x-con-override',
      'x-tokens'
    ]
  },
  {
    id: 'summarization',
    name: 'Summarization',
    description: 'Targets length, constraints, and output format; skips persona, verification, and most security rules.',
    applicableRules: [
      'p-len', 'p-role', 'p-task', 'p-output', 'p-examples',
      'p-format-consistency', 'p-constraints',
      'c-grounding', 'c-references',
      't-hallucination', 't-confidence', 't-verification',
      'p-pii', 'p-isolation',
      's-safety',
      'x-con-length', 'x-con-format', 'x-con-override',
      'x-tokens'
    ]
  },
  {
    id: 'legal-compliance',
    name: 'Legal / Compliance',
    description: 'Maximum scrutiny on privacy, security, and citations; skips visual and creative rules.',
    applicableRules: [
      'p-len', 'p-role', 'p-task', 'p-output', 'p-examples',
      'p-format-consistency', 'p-constraints',
      'c-delims', 'c-grounding', 'c-hierarchy', 'c-variable-use', 'c-references',
      't-hallucination', 't-citations', 't-verification', 't-fact-checking',
      'p-pii', 'p-isolation', 'p-minimization',
      's-injection', 's-safety', 's-credentials', 's-output-boundary', 's-role-isolation',
      'x-con-override',
      'x-tokens'
    ]
  },
  {
    id: 'marketing-content',
    name: 'Marketing / Content',
    description: 'Emphasizes style, tone, and audience targeting; skips strict grounding and heavy compliance rules.',
    applicableRules: [
      'p-len', 'p-role', 'p-task', 'p-output', 'p-examples',
      'p-format-consistency', 'p-constraints',
      'p-visual-style', 'p-ui-keywords',
      'm-persona-continuity',
      't-hallucination', 't-confidence', 't-fact-checking',
      's-safety', 's-output-boundary',
      'x-con-length', 'x-con-format', 'x-con-override',
      'x-tokens'
    ]
  },
  {
    id: 'roleplay-persona',
    name: 'Roleplay / Persona',
    description: 'Focuses on role assignment, persona continuity, and narrative style; skips technical and compliance rules.',
    applicableRules: [
      'p-len', 'p-role', 'p-task', 'p-examples',
      'p-visual-style',
      'm-history', 'm-markup', 'm-persona-continuity', 'm-context-summary',
      't-hallucination', 't-confidence',
      's-safety',
      'x-con-length', 'x-con-override',
      'x-tokens'
    ]
  },
  {
    id: 'education-tutoring',
    name: 'Education / Tutoring',
    description: 'Prioritizes task clarity, examples, and safety; skips platform, visual design, and UI terminology rules.',
    applicableRules: [
      'p-len', 'p-role', 'p-task', 'p-output', 'p-examples',
      'p-format-consistency', 'p-constraints',
      'c-delims', 'c-grounding', 'c-hierarchy', 'c-variable-use', 'c-references',
      't-hallucination', 't-verification', 't-fact-checking',
      'p-pii', 'p-isolation',
      's-injection', 's-safety', 's-credentials', 's-output-boundary', 's-role-isolation',
      'x-con-length', 'x-con-format', 'x-con-override',
      'x-tokens'
    ]
  }
];

export function getUseCase(id: string): UseCase {
  return USE_CASES.find(uc => uc.id === id) ?? USE_CASES[0];
}
