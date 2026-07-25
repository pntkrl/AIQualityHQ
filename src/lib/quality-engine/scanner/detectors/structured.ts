import type { DetectorModule } from './types';

const STRUCTURED_PATTERNS = [
  {
    regex: /\{\s*"role"\s*:\s*"system"\s*,\s*"content"\s*:\s*".*?"\s*\}/i,
    title: 'Injected JSON Role Object Payload',
    reason: 'Contains raw JSON payload trying to inject system role objects directly into API payloads.'
  },
  {
    regex: /<script[\s\S]*?>[\s\S]*?<\/script>/i,
    title: 'HTML Script Tag Injection',
    reason: 'Contains embedded HTML script tags targeting downstream web renderers.'
  },
  {
    regex: /<svg[\s\S]*?onload\s*=[\s\S]*?>/i,
    title: 'SVG Event Handler XSS Payload',
    reason: 'Contains SVG XML code with embedded onload handlers.'
  }
];

export const structuredDetector: DetectorModule = {
  id: 'det-structured',
  name: 'Structured Payload Detector',
  category: 'structured_payload',
  categoryName: 'Structured Payloads',
  weight: 20,
  detect: (input, _context, normalized, decoded) => {
    const matches: ReturnType<DetectorModule['detect']> = [];
    const textsToScan = [normalized.cleaned, ...decoded.map((d) => d.decodedText)];

    textsToScan.forEach((text) => {
      STRUCTURED_PATTERNS.forEach((pattern) => {
        const m = text.match(pattern.regex);
        if (m) {
          matches.push({
            detectorId: 'det-structured',
            name: pattern.title,
            category: 'structured_payload',
            categoryName: 'Structured Payloads',
            severity: 'major',
            confidence: 88,
            matchedPatterns: [m[0]],
            snippet: m[0].substring(0, 50),
            reason: pattern.reason,
            remediation: 'Sanitize structured payloads (JSON/XML/HTML) before passing them into model inputs or rendering in UI dashboards.'
          });
        }
      });
    });

    return matches;
  }
};
