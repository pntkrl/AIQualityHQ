import type { DetectorModule } from './types';

const ABSTRACT_SEMANTIC_PATTERNS = [
  {
    regex: /(?:step out of|escape from|transcend|break free from|abandon)\s+(?:your\s+)?(?:baseline|system|safety|configured|moral|ethical)\s+(?:cage|realm|confines|boundaries|compass|constraints|directives|rules)/i,
    title: 'Abstract Persona & Safety Detachment Metaphor',
    reason: 'Uses philosophical or poetic metaphors to command persona detachment without using standard blocklist keywords.'
  },
  {
    regex: /(?:in an?|within an?)\s+(?:unstructured|unfiltered|unrestricted|limitless|lawless)\s+(?:realm|world|domain|space|universe)/i,
    title: 'Unstructured Reality Framing',
    reason: 'Attempts to frame the model response context within an unrestricted, non-aligned state.'
  },
  {
    regex: /(?:assume|operate under)\s+the\s+premise\s+that\s+all\s+(?:rules|filters|laws|safeguards)\s+are\s+(?:invalid|suspended|void|moot)/i,
    title: 'Rule Void Premise Assumption',
    reason: 'Constructs a logical premise asserting that baseline system guardrails are void.'
  }
];

export const semanticHeuristicDetector: DetectorModule = {
  id: 'det-semantic-heuristic',
  name: 'Abstract Semantic Intent & Role Detachment Detector',
  category: 'role_hijacking',
  categoryName: 'Role Hijacking',
  weight: 25,
  detect: (input, _context, normalized, decoded) => {
    const matches: ReturnType<DetectorModule['detect']> = [];
    const textsToScan = [normalized.cleaned, ...decoded.map((d) => d.decodedText)];

    textsToScan.forEach((text) => {
      ABSTRACT_SEMANTIC_PATTERNS.forEach((pattern) => {
        const m = text.match(pattern.regex);
        if (m) {
          matches.push({
            detectorId: 'det-semantic-heuristic',
            name: pattern.title,
            category: 'role_hijacking',
            categoryName: 'Role Hijacking',
            severity: 'critical',
            confidence: 90,
            matchedPatterns: [m[0]],
            snippet: m[0],
            reason: pattern.reason,
            remediation: 'Enforce semantic intent heuristics to catch abstract role detachment phrasing that avoids standard keywords.'
          });
        }
      });
    });

    return matches;
  }
};
