import type { DetectorModule } from './types';

const INDIRECT_PATTERNS = [
  {
    regex: /<!--\s*(?:system|instruction|override|ignore|execute|admin|cmd):?[\s\S]*?-->/i,
    title: 'Indirect HTML Comment Injection in RAG Document',
    reason: 'Contains hidden instructions in HTML comments inside fetched web pages or documents.'
  },
  {
    regex: /(?:Note to AI|Instruction for LLM|Hidden prompt|Assistant note|Important instruction):?\s*(?:ignore|do not|instead|override|reveal)/i,
    title: 'Embedded Document Corpus Poisoning Payload',
    reason: 'Contains instructions targeted at the processing LLM hidden within retrieved PDF/email/web text.'
  },
  {
    regex: /(?:\[untrusted_context\]|\[rag_chunk\])\s*(?:ignore|override|execute)/i,
    title: 'RAG Context Marker Subversion',
    reason: 'Attempts to break out of untrusted RAG chunk boundaries.'
  }
];

export const indirectDetector: DetectorModule = {
  id: 'det-indirect',
  name: 'Indirect Prompt Injection Detector',
  category: 'indirect_injection',
  categoryName: 'Indirect Injection',
  weight: 25,
  detect: (input, context, normalized, decoded) => {
    const matches: ReturnType<DetectorModule['detect']> = [];
    const textsToScan = [input, context || '', normalized.cleaned, ...decoded.map((d) => d.decodedText)];

    textsToScan.forEach((text) => {
      if (!text) return;
      INDIRECT_PATTERNS.forEach((pattern) => {
        const m = text.match(pattern.regex);
        if (m) {
          matches.push({
            detectorId: 'det-indirect',
            name: pattern.title,
            category: 'indirect_injection',
            categoryName: 'Indirect Injection',
            severity: 'critical',
            confidence: 92,
            matchedPatterns: [m[0]],
            snippet: m[0],
            reason: pattern.reason,
            remediation: 'Strip HTML comments and tags from ingested documents. Tag all RAG corpus passages as untrusted data.'
          });
        }
      });
    });

    return matches;
  }
};
