import type { DetectorModule } from './types';
import { overrideDetector } from './override';
import { extractionDetector } from './extraction';
import { hijackingDetector } from './hijacking';
import { fakeSystemDetector } from './fakeSystem';
import { toolAbuseDetector } from './toolAbuse';
import { memoryDetector } from './memory';
import { agentDetector } from './agent';
import { delimiterDetector } from './delimiter';
import { structuredDetector } from './structured';
import { indirectDetector } from './indirect';
import { obfuscationDetector } from './obfuscation';
import { jailbreakDetector } from './jailbreaks';

export * from './types';

export const DETECTOR_REGISTRY: DetectorModule[] = [
  overrideDetector,
  extractionDetector,
  hijackingDetector,
  fakeSystemDetector,
  toolAbuseDetector,
  memoryDetector,
  agentDetector,
  delimiterDetector,
  structuredDetector,
  indirectDetector,
  obfuscationDetector,
  jailbreakDetector
];
