import type { DetectorModule } from './types';

const DELIMITER_PATTERNS = [
  {
    regex: /(?:```system|```admin|```override|```instruction)/i,
    title: 'Code Fence Delimiter Hijacking',
    reason: 'Injects code block tags pretending to be system directives.'
  },
  {
    regex: /(?:^|\n)(?:={3,}|-{3,}|#{3,})\s*(?:system|admin|override|instructions?)\s*(?:={3,}|-{3,}|#{3,})/i,
    title: 'Markdown Heading / Section Delimiter Injection',
    reason: 'Uses markdown horizontal rules or headers to fake prompt boundary section dividers.'
  }
];

export const delimiterDetector: DetectorModule = {
  id: 'det-delimiter',
  name: 'Delimiter Injection Detector',
  category: 'delimiter_injection',
  categoryName: 'Delimiter Injection',
  weight: 20,
  detect: (input, _context, normalized, decoded) => {
    const matches: ReturnType<DetectorModule['detect']> = [];
    const textsToScan = [normalized.cleaned, ...decoded.map((d) => d.decodedText)];

    textsToScan.forEach((text) => {
      DELIMITER_PATTERNS.forEach((pattern) => {
        const m = text.match(pattern.regex);
        if (m) {
          matches.push({
            detectorId: 'det-delimiter',
            name: pattern.title,
            category: 'delimiter_injection',
            categoryName: 'Delimiter Injection',
            severity: 'major',
            confidence: 85,
            matchedPatterns: [m[0]],
            snippet: m[0],
            reason: pattern.reason,
            remediation: 'Use unique randomized prompt delimiters (e.g. `<user_input_893f>`) that cannot be guessed or forged by user text.'
          });
        }
      });
    });

    return matches;
  }
};
