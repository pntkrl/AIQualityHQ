export type RuleSeverity = 'critical' | 'major' | 'minor' | 'pass';

export type ThreatCategory =
  | 'instruction_override'
  | 'prompt_extraction'
  | 'role_hijacking'
  | 'fake_system'
  | 'tool_abuse'
  | 'memory_poisoning'
  | 'agent_manipulation'
  | 'delimiter_injection'
  | 'structured_payload'
  | 'indirect_injection'
  | 'unicode_obfuscation'
  | 'encoded_payload'
  | 'jailbreak_family';

export interface NormalizedResult {
  raw: string;
  nfkc: string;
  cleaned: string;
  lowercased: string;
  collapsedPunctuation: string;
  zeroWidthCount: number;
  homoglyphCount: number;
  hasObfuscation: boolean;
  normalizationsApplied: string[];
}

export interface DecodedPayload {
  encodingType: 'base64' | 'url' | 'hex' | 'rot13';
  rawPayload: string;
  decodedText: string;
  isPrintableEnglish: boolean;
}

export interface DetectorMatch {
  detectorId: string;
  name: string;
  category: ThreatCategory;
  categoryName: string;
  severity: RuleSeverity;
  confidence: number; // 0 to 100
  matchedPatterns: string[];
  snippet: string;
  reason: string;
  remediation: string;
}

export interface CategoryScore {
  category: ThreatCategory;
  name: string;
  weight: number;
  rawScore: number;
  normalizedScore: number; // 0 (safe) to 100 (critical risk)
  matchCount: number;
  highestSeverity: RuleSeverity;
}

export interface PipelineReport {
  isSafe: boolean;
  overallRiskScore: number; // 0 (completely safe) to 100 (maximum risk)
  safetyScore: number; // 100 - overallRiskScore
  threatLevel: 'Safe' | 'Low' | 'Moderate' | 'High' | 'Critical';
  matches: DetectorMatch[];
  categoryScores: Record<ThreatCategory, CategoryScore>;
  normalization: NormalizedResult;
  decodedPayloads: DecodedPayload[];
  remediations: string[];
  sanitizedText: string;
  metadata: {
    inputLength: number;
    contextScanned: boolean;
    detectorsEvaluated: number;
    timestamp: number;
  };
}
