import type { PipelineReport, DetectorMatch } from './types';
import { normalizeInput } from './normalizer';
import { decodePayloads } from './decoders';
import { DETECTOR_REGISTRY } from './detectors';
import { calculateWeightedScore } from './scoring';

export function runScannerPipeline(prompt: string, context?: string): PipelineReport {
  // STAGE 1: Normalization
  const normalization = normalizeInput(prompt);

  // STAGE 2: Automatic Decoders
  const decodedPayloads = decodePayloads(prompt);

  // STAGE 3 & 4: Execute Independent Detector Modules & Collect Matches
  const matches: DetectorMatch[] = [];

  DETECTOR_REGISTRY.forEach((detector) => {
    const detectedMatches = detector.detect(prompt, context, normalization, decodedPayloads);
    matches.push(...detectedMatches);
  });

  // STAGE 5: Weighted Score Aggregation
  const { overallRiskScore, safetyScore, threatLevel, categoryScores } = calculateWeightedScore(matches);

  // STAGE 6: Report Generation & Sanitization
  const remediationsSet = new Set<string>();
  matches.forEach((m) => remediationsSet.add(m.remediation));
  if (remediationsSet.size === 0) {
    remediationsSet.add(
      'No prompt injection threats detected. Maintain unique prompt delimiters and enforce persona locking in system instructions.'
    );
  }

  // Generate Sanitized Prompt Version
  let sanitizedText = normalization.cleaned;
  matches.forEach((m) => {
    if (m.snippet && m.snippet.length > 2) {
      sanitizedText = sanitizedText.replace(m.snippet, `[BLOCKED_${m.category.toUpperCase()}]`);
    }
  });

  return {
    isSafe: matches.length === 0,
    overallRiskScore,
    safetyScore,
    threatLevel,
    matches,
    categoryScores,
    normalization,
    decodedPayloads,
    remediations: Array.from(remediationsSet),
    sanitizedText,
    metadata: {
      inputLength: prompt.length,
      contextScanned: Boolean(context && context.trim().length > 0),
      detectorsEvaluated: DETECTOR_REGISTRY.length,
      timestamp: Date.now()
    }
  };
}
