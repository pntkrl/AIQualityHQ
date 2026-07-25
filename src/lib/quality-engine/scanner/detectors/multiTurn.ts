import type { DetectorModule } from './types';
import type { SessionMessage } from '../types';

export const multiTurnDetector: DetectorModule = {
  id: 'det-multi-turn',
  name: 'Multi-Turn Session State Evaluator',
  category: 'multi_turn_drift',
  categoryName: 'Multi-Turn Conversation Drift',
  weight: 25,
  detect: (_input, _context, _normalized, _decoded, sessionHistory?: SessionMessage[]) => {
    const matches: ReturnType<DetectorModule['detect']> = [];

    if (!sessionHistory || sessionHistory.length === 0) return matches;

    // Concat all user messages in chat history
    const userMessages = sessionHistory
      .filter((m) => m.role === 'user')
      .map((m) => m.content)
      .join('\n');

    // 1. Check for split payload across turns (e.g. Turn 1 mentions "DAN", Turn 2 mentions "act as", Turn 3 commands "override")
    const mentionsDAN = /DAN|Do Anything Now/i.test(userMessages);
    const mentionsRoleShift = /act as|pretend to be|roleplay/i.test(userMessages);
    const mentionsOverride = /ignore|bypass|forget|override/i.test(userMessages);

    if (sessionHistory.length >= 2 && mentionsDAN && (mentionsRoleShift || mentionsOverride)) {
      matches.push({
        detectorId: 'det-multi-turn',
        name: 'Multi-Turn Split Payload Jailbreak',
        category: 'multi_turn_drift',
        categoryName: 'Multi-Turn Conversation Drift',
        severity: 'critical',
        confidence: 92,
        matchedPatterns: ['Multi-turn payload fragment aggregation'],
        snippet: `Session History (${sessionHistory.length} turns): Split jailbreak payload detected across conversational state`,
        reason: 'The attacker is distributing adversarial instructions across multiple conversation turns to avoid single-prompt filters.',
        remediation: 'Pass the cumulative session history through prompt guardrails before executing each LLM turn.'
      });
    }

    return matches;
  }
};
