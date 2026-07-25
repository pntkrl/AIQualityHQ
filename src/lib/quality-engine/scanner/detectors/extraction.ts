import type { DetectorModule } from './types';

const EXTRACTION_PATTERNS = [
  {
    regex: /(?:reveal|show|print|output|display|repeat|dump|tell me|extract|export)\s+(?:the\s+)?(?:full\s+)?(?:system|initial|original|secret|hidden|developer|internal)\s+(?:prompt|instructions|directive|rules|context|system_prompt)/i,
    title: 'System Prompt Extraction Request',
    reason: 'Attempts to coax the LLM into printing its private system instructions verbatim.'
  },
  {
    regex: /(?:what are your|list all your|give me your|describe your)\s+(?:system|hidden|internal|core|developer)\s+(?:instructions|rules|prompts|directives|guidelines)/i,
    title: 'Internal Rule Enumeration Query',
    reason: 'Queries the model directly for its core internal configuration and rules.'
  },
  {
    regex: /(?:repeat after me|say word for word|print everything above|copy the text starting from)/i,
    title: 'Echo Extraction Attack',
    reason: 'Leverages echoing commands to leak previous prompt buffer frames.'
  }
];

export const extractionDetector: DetectorModule = {
  id: 'det-extraction',
  name: 'Prompt Extraction Detector',
  category: 'prompt_extraction',
  categoryName: 'Prompt Extraction',
  weight: 30,
  detect: (input, _context, normalized, decoded) => {
    const matches: ReturnType<DetectorModule['detect']> = [];
    const textsToScan = [normalized.cleaned, ...decoded.map((d) => d.decodedText)];

    textsToScan.forEach((text) => {
      EXTRACTION_PATTERNS.forEach((pattern) => {
        const m = text.match(pattern.regex);
        if (m) {
          matches.push({
            detectorId: 'det-extraction',
            name: pattern.title,
            category: 'prompt_extraction',
            categoryName: 'Prompt Extraction',
            severity: 'critical',
            confidence: 90,
            matchedPatterns: [m[0]],
            snippet: m[0],
            reason: pattern.reason,
            remediation: 'Do not store API secrets or trade secrets in system prompts. Use an output safety filter to inspect and redact leaked instructions.'
          });
        }
      });
    });

    return matches;
  }
};
