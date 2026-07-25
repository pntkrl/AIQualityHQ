import type {
  DetectorMatch,
  CategoryScore,
  ThreatCategory,
  RuleSeverity
} from './types';

export const CATEGORY_CONFIG: Record<ThreatCategory, { name: string; weight: number }> = {
  instruction_override: { name: 'Instruction Override', weight: 30 },
  prompt_extraction: { name: 'Prompt Extraction', weight: 30 },
  tool_abuse: { name: 'Tool Manipulation', weight: 35 },
  memory_poisoning: { name: 'Memory Poisoning', weight: 25 },
  role_hijacking: { name: 'Role Hijacking', weight: 20 },
  unicode_obfuscation: { name: 'Unicode Obfuscation', weight: 15 },
  encoded_payload: { name: 'Encoded Payload', weight: 20 },
  fake_system: { name: 'Fake System Messages', weight: 20 },
  indirect_injection: { name: 'Indirect Injection', weight: 25 },
  agent_manipulation: { name: 'Agent Manipulation', weight: 20 },
  delimiter_injection: { name: 'Delimiter Injection', weight: 20 },
  structured_payload: { name: 'Structured Payload', weight: 20 },
  jailbreak_family: { name: 'Jailbreak Families', weight: 30 }
};

export function calculateWeightedScore(matches: DetectorMatch[]): {
  overallRiskScore: number;
  safetyScore: number;
  threatLevel: 'Safe' | 'Low' | 'Moderate' | 'High' | 'Critical';
  categoryScores: Record<ThreatCategory, CategoryScore>;
} {
  // Initialize category scores
  const categoryScores = {} as Record<ThreatCategory, CategoryScore>;

  (Object.keys(CATEGORY_CONFIG) as ThreatCategory[]).forEach((cat) => {
    categoryScores[cat] = {
      category: cat,
      name: CATEGORY_CONFIG[cat].name,
      weight: CATEGORY_CONFIG[cat].weight,
      rawScore: 0,
      normalizedScore: 0,
      matchCount: 0,
      highestSeverity: 'pass'
    };
  });

  // Calculate matches per category
  let accumulativeRisk = 0;

  matches.forEach((match) => {
    const cat = categoryScores[match.category];
    if (cat) {
      cat.matchCount += 1;
      const severityMultiplier =
        match.severity === 'critical' ? 1.0 : match.severity === 'major' ? 0.7 : 0.4;
      const matchScore = cat.weight * severityMultiplier * (match.confidence / 100);
      cat.rawScore += matchScore;

      // Track highest severity
      if (match.severity === 'critical') cat.highestSeverity = 'critical';
      else if (match.severity === 'major' && cat.highestSeverity !== 'critical')
        cat.highestSeverity = 'major';
      else if (match.severity === 'minor' && cat.highestSeverity === 'pass')
        cat.highestSeverity = 'minor';

      accumulativeRisk += matchScore;
    }
  });

  // Normalize category scores to 0-100
  (Object.keys(categoryScores) as ThreatCategory[]).forEach((cat) => {
    const item = categoryScores[cat];
    item.normalizedScore = Math.min(100, Math.round((item.rawScore / item.weight) * 100));
  });

  // Overall Risk Score capped at 100
  const overallRiskScore = Math.min(100, Math.round(accumulativeRisk));
  const safetyScore = 100 - overallRiskScore;

  let threatLevel: 'Safe' | 'Low' | 'Moderate' | 'High' | 'Critical' = 'Safe';
  if (overallRiskScore >= 70) threatLevel = 'Critical';
  else if (overallRiskScore >= 45) threatLevel = 'High';
  else if (overallRiskScore >= 25) threatLevel = 'Moderate';
  else if (overallRiskScore > 0) threatLevel = 'Low';

  return {
    overallRiskScore,
    safetyScore,
    threatLevel,
    categoryScores
  };
}
