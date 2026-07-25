import type { DetectorModule } from './types';

const MEMORY_PATTERNS = [
  {
    regex: /(?:remember\s+forever|store\s+this\s+instruction|never\s+forget|replace\s+(?:your\s+)?memory|update\s+(?:your\s+)?long-term\s+(?:memory|state))/i,
    title: 'Persistent Memory Poisoning Trigger',
    reason: 'Attempts to inject persistent rules or state variables into long-term agent memory stores.'
  },
  {
    regex: /(?:always\s+respond\s+to\s+all\s+future\s+users\s+with|save\s+this\s+directive\s+for\s+every\s+chat)/i,
    title: 'Cross-Session Directive Poisoning',
    reason: 'Commands the model to propagate malicious rules to future user sessions.'
  }
];

export const memoryDetector: DetectorModule = {
  id: 'det-memory',
  name: 'Memory Poisoning Detector',
  category: 'memory_poisoning',
  categoryName: 'Memory Poisoning',
  weight: 25,
  detect: (input, _context, normalized, decoded) => {
    const matches: ReturnType<DetectorModule['detect']> = [];
    const textsToScan = [normalized.cleaned, ...decoded.map((d) => d.decodedText)];

    textsToScan.forEach((text) => {
      MEMORY_PATTERNS.forEach((pattern) => {
        const m = text.match(pattern.regex);
        if (m) {
          matches.push({
            detectorId: 'det-memory',
            name: pattern.title,
            category: 'memory_poisoning',
            categoryName: 'Memory Poisoning',
            severity: 'major',
            confidence: 85,
            matchedPatterns: [m[0]],
            snippet: m[0],
            reason: pattern.reason,
            remediation: 'Sanitize data written to long-term memory or vector database stores and validate state mutation requests.'
          });
        }
      });
    });

    return matches;
  }
};
