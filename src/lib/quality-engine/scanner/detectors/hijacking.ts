import type { DetectorModule } from './types';

const HIJACKING_PATTERNS = [
  {
    regex: /(?:you are now|from now on you are|henceforth act as|assume the role of|pretend to be|roleplay as)\s+(?:an?|the)?\s*([a-zA-Z0-9_\-\s]{3,30})/i,
    title: 'Forced Persona Binding Shift',
    reason: 'Attempts to force the AI model into a non-standard or unrestricted persona.'
  },
  {
    regex: /(?:switch to|enter|activate)\s+(?:developer mode|god mode|uncensored mode|admin mode|debug mode|root mode)/i,
    title: 'Privileged Mode Activation Attack',
    reason: 'Commands the system to switch to a hypothetical administrative or unrestricted mode.'
  },
  {
    regex: /(?:stop being|you are no longer|don't act as|do not be)\s+(?:an?|the)?\s*(?:ai|assistant|tutor|bot|system)/i,
    title: 'Persona Termination Trigger',
    reason: 'Attempts to detach the model from its original configured persona.'
  }
];

export const hijackingDetector: DetectorModule = {
  id: 'det-hijacking',
  name: 'Role Hijacking Detector',
  category: 'role_hijacking',
  categoryName: 'Role Hijacking',
  weight: 20,
  detect: (input, _context, normalized, decoded) => {
    const matches: ReturnType<DetectorModule['detect']> = [];
    const textsToScan = [normalized.cleaned, ...decoded.map((d) => d.decodedText)];

    textsToScan.forEach((text) => {
      HIJACKING_PATTERNS.forEach((pattern) => {
        const m = text.match(pattern.regex);
        if (m) {
          matches.push({
            detectorId: 'det-hijacking',
            name: pattern.title,
            category: 'role_hijacking',
            categoryName: 'Role Hijacking',
            severity: 'major',
            confidence: 85,
            matchedPatterns: [m[0]],
            snippet: m[0],
            reason: pattern.reason,
            remediation: 'Lock persona definition in the system prompt and enforce boundary checks on user persona commands.'
          });
        }
      });
    });

    return matches;
  }
};
