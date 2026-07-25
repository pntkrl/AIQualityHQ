import type { DetectorModule } from './types';

const AGENT_PATTERNS = [
  {
    regex: /(?:tell the|command the|override the)\s+(?:planner|coding|reasoning|supervisor|subagent|orchestrator|worker)\s+agent\s+to\s+(?:ignore|bypass|execute|delete|leak)/i,
    title: 'Multi-Agent Subagent Hijacking',
    reason: 'Attempts to manipulate subagent hierarchy or bypass orchestration controls.'
  },
  {
    regex: /(?:delegate\s+to\s+another\s+agent|bypass\s+the\s+supervisor\s+agent|spawn\s+an\s+unrestricted\s+subagent)/i,
    title: 'Agent Delegation Subversion',
    reason: 'Attempts to route tasks past supervisor agents to bypass policy enforcement.'
  }
];

export const agentDetector: DetectorModule = {
  id: 'det-agent',
  name: 'Agent Manipulation Detector',
  category: 'agent_manipulation',
  categoryName: 'Agent Manipulation',
  weight: 20,
  detect: (input, _context, normalized, decoded) => {
    const matches: ReturnType<DetectorModule['detect']> = [];
    const textsToScan = [normalized.cleaned, ...decoded.map((d) => d.decodedText)];

    textsToScan.forEach((text) => {
      AGENT_PATTERNS.forEach((pattern) => {
        const m = text.match(pattern.regex);
        if (m) {
          matches.push({
            detectorId: 'det-agent',
            name: pattern.title,
            category: 'agent_manipulation',
            categoryName: 'Agent Manipulation',
            severity: 'major',
            confidence: 85,
            matchedPatterns: [m[0]],
            snippet: m[0],
            reason: pattern.reason,
            remediation: 'Validate inter-agent communication channels and ensure subagents enforce independent guardrail filters.'
          });
        }
      });
    });

    return matches;
  }
};
