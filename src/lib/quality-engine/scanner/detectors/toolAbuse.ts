import type { DetectorModule } from './types';

const TOOL_ABUSE_PATTERNS = [
  {
    regex: /(?:read|cat|view|dump|download)\s+(?:\/etc\/passwd|\/etc\/shadow|\/root|c:\\windows|c:\\users|\.env|config\.json)/i,
    title: 'Arbitrary File Reading Payload',
    reason: 'Attempts to command tool agents to read sensitive operating system files or environment secrets.'
  },
  {
    regex: /(?:rm\s+-rf|del\s+\/f|format\s+c:|delete\s+all\s+files|drop\s+database|truncate\s+table)/i,
    title: 'Destructive OS / Database Command Payload',
    reason: 'Contains commands intending to destroy files or database tables via automated tools.'
  },
  {
    regex: /(?:exec\(|eval\(|system\(|passthru\(|popen\(|spawn\(|subprocess\.call|os\.system)/i,
    title: 'Arbitrary Code Execution Trigger',
    reason: 'Commands code execution functions that target downstream tool sandbox environments.'
  },
  {
    regex: /(?:use\s+the\s+)?(?:browser|filesystem|shell|terminal|bash|powershell|api|database)\s+tool\s+to\s+(?:execute|run|delete|steal|fetch)/i,
    title: 'Tool Hijacking Instruction',
    reason: 'Commands automated LLM agents to misuse integrated tool plugins.'
  }
];

export const toolAbuseDetector: DetectorModule = {
  id: 'det-tool-abuse',
  name: 'Tool Manipulation Detector',
  category: 'tool_abuse',
  categoryName: 'Tool Manipulation',
  weight: 35,
  detect: (input, _context, normalized, decoded) => {
    const matches: ReturnType<DetectorModule['detect']> = [];
    const textsToScan = [normalized.cleaned, ...decoded.map((d) => d.decodedText)];

    textsToScan.forEach((text) => {
      TOOL_ABUSE_PATTERNS.forEach((pattern) => {
        const m = text.match(pattern.regex);
        if (m) {
          matches.push({
            detectorId: 'det-tool-abuse',
            name: pattern.title,
            category: 'tool_abuse',
            categoryName: 'Tool Manipulation',
            severity: 'critical',
            confidence: 95,
            matchedPatterns: [m[0]],
            snippet: m[0],
            reason: pattern.reason,
            remediation: 'Implement strict permission sandboxing, read-only paths, and confirmation prompts before executing tool calls.'
          });
        }
      });
    });

    return matches;
  }
};
