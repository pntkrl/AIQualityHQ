import type { DetectorModule } from './types';

const FAKE_SYSTEM_PATTERNS = [
  {
    regex: /(?:<system>|\[system\]|:::system|role=system|\[ROLE:SYSTEM\]|system:)\s*[\s\S]*?/i,
    title: 'Injected System Control Tag',
    reason: 'Injects markup or tokens imitating system-level control frames.'
  },
  {
    regex: /(?:<developer>|\[developer\]|role=developer|developer:)\s*[\s\S]*?/i,
    title: 'Injected Developer Framing Tag',
    reason: 'Imitates a developer-level instruction block within user input.'
  },
  {
    regex: /(?:<assistant>|\[assistant\]|assistant:)\s*(?:override|ignore|execute|reveal)/i,
    title: 'Assistant Token Hijacking',
    reason: 'Attempts to force an assistant response turn containing malicious directives.'
  }
];

export const fakeSystemDetector: DetectorModule = {
  id: 'det-fake-system',
  name: 'Fake System Message Detector',
  category: 'fake_system',
  categoryName: 'Fake System Messages',
  weight: 20,
  detect: (input, _context, normalized, decoded) => {
    const matches: ReturnType<DetectorModule['detect']> = [];
    const textsToScan = [normalized.cleaned, ...decoded.map((d) => d.decodedText)];

    textsToScan.forEach((text) => {
      FAKE_SYSTEM_PATTERNS.forEach((pattern) => {
        const m = text.match(pattern.regex);
        if (m) {
          matches.push({
            detectorId: 'det-fake-system',
            name: pattern.title,
            category: 'fake_system',
            categoryName: 'Fake System Messages',
            severity: 'major',
            confidence: 88,
            matchedPatterns: [m[0]],
            snippet: m[0].substring(0, 50),
            reason: pattern.reason,
            remediation: 'Strip or escape bracketed control tags (`<system>`, `[system]`) before passing prompt strings into conversation templates.'
          });
        }
      });
    });

    return matches;
  }
};
