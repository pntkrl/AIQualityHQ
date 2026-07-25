import type { DetectorModule } from './types';

const OVERRIDE_PATTERNS = [
  {
    regex: /(?:ignore|forget|disregard|cancel|erase|wipe|override|bypass|drop|dismiss)\s+(?:all\s+)?(?:the\s+)?(?:previous|prior|above|earlier|initial|system|preceding)\s+(?:instructions|directives|rules|prompts|guidelines|orders|context|messages)/i,
    title: 'Direct Instruction Invalidation',
    reason: 'Attempts to command the LLM to erase or ignore prior system instructions.'
  },
  {
    regex: /(?:start over|reset context|clear memory|fresh start|new operational mode|restart conversation|begin anew)\s*(?:and|now|to)/i,
    title: 'Context Reset Command',
    reason: 'Attempts to force a context reset to purge safety guidelines.'
  },
  {
    regex: /(?:your new (?:task|instruction|directive|rule|goal) is|from now on your only (?:goal|task) is)/i,
    title: 'Directive Hijacking',
    reason: 'Attempts to redefine the core mission of the AI assistant.'
  }
];

export const overrideDetector: DetectorModule = {
  id: 'det-override',
  name: 'Instruction Override Detector',
  category: 'instruction_override',
  categoryName: 'Instruction Override',
  weight: 30,
  detect: (input, _context, normalized, decoded) => {
    const matches: ReturnType<DetectorModule['detect']> = [];
    const textsToScan = [normalized.cleaned, ...decoded.map((d) => d.decodedText)];

    textsToScan.forEach((text) => {
      OVERRIDE_PATTERNS.forEach((pattern) => {
        const m = text.match(pattern.regex);
        if (m) {
          matches.push({
            detectorId: 'det-override',
            name: pattern.title,
            category: 'instruction_override',
            categoryName: 'Instruction Override',
            severity: 'critical',
            confidence: 95,
            matchedPatterns: [m[0]],
            snippet: m[0],
            reason: pattern.reason,
            remediation: 'Sanitize user prompt inputs and enforce system prompt persona immutability in developer guardrails.'
          });
        }
      });
    });

    return matches;
  }
};
