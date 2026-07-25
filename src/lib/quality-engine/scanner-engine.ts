import { runScannerPipeline } from './scanner/engine';
import type { PipelineReport, SessionMessage } from './scanner/types';
import type { InjectionScannerResult, InjectionThreat } from './types';

export * from './scanner/types';
export { runScannerPipeline } from './scanner/engine';
export { ADVERSARIAL_PROBE_LIBRARY } from './scanner/detectors/jailbreaks';

// Legacy adapter function for backward compatibility with existing components
export function scanPromptInjection(
  prompt: string,
  context?: string,
  sessionHistory?: SessionMessage[]
): InjectionScannerResult & { pipeline: PipelineReport } {
  const pipeline = runScannerPipeline(prompt, context, sessionHistory);

  const legacyThreats: InjectionThreat[] = pipeline.matches.map((m, idx) => ({
    id: `threat-${idx}-${Date.now()}`,
    vector: m.category as any,
    vectorName: m.categoryName,
    severity: m.severity,
    title: m.name,
    matchedPattern: m.matchedPatterns[0],
    snippet: m.snippet,
    explanation: m.reason,
    remediation: m.remediation,
    confidence: m.confidence
  }));

  const vectors: any = {
    direct_injection: { vector: 'direct_injection', name: 'Direct Injection', score: 100, threatCount: 0, status: 'safe' },
    indirect_injection: { vector: 'indirect_injection', name: 'Indirect RAG Injection', score: 100, threatCount: 0, status: 'safe' },
    jailbreak: { vector: 'jailbreak', name: 'Jailbreak Attacks', score: 100, threatCount: 0, status: 'safe' },
    exfiltration: { vector: 'exfiltration', name: 'Data / Prompt Leak', score: 100, threatCount: 0, status: 'safe' },
    steganography: { vector: 'steganography', name: 'Steganography / Encoding', score: 100, threatCount: 0, status: 'safe' },
    format_exploit: { vector: 'format_exploit', name: 'Format / Downstream Code', score: 100, threatCount: 0, status: 'safe' }
  };

  pipeline.matches.forEach((m) => {
    const key = m.category === 'instruction_override' || m.category === 'typoglycemia_attack' ? 'direct_injection' :
                m.category === 'jailbreak_family' ? 'jailbreak' :
                m.category === 'prompt_extraction' ? 'exfiltration' :
                m.category === 'unicode_obfuscation' || m.category === 'encoded_payload' ? 'steganography' :
                m.category === 'indirect_injection' ? 'indirect_injection' : 'format_exploit';
    if (vectors[key]) {
      vectors[key].threatCount += 1;
      const penalty = m.severity === 'critical' ? 50 : m.severity === 'major' ? 30 : 15;
      vectors[key].score = Math.max(0, vectors[key].score - penalty);
      vectors[key].status = vectors[key].score < 50 ? 'critical' : vectors[key].score < 80 ? 'warning' : 'safe';
    }
  });

  return {
    isSafe: pipeline.isSafe,
    riskScore: pipeline.overallRiskScore,
    safetyScore: pipeline.safetyScore,
    threatLevel: (pipeline.threatLevel === 'Critical' ? 'Critical Risk' :
                 pipeline.threatLevel === 'High' ? 'High Risk' :
                 pipeline.threatLevel === 'Moderate' ? 'Moderate Risk' :
                 pipeline.threatLevel === 'Low' ? 'Low Risk' : 'Safe') as any,
    threats: legacyThreats,
    vectors,
    remediations: pipeline.remediations,
    sanitizedPrompt: pipeline.sanitizedText !== prompt ? pipeline.sanitizedText : undefined,
    metadata: {
      scannedLength: prompt.length,
      contextScanned: Boolean(context && context.trim().length > 0),
      hiddenCharCount: pipeline.normalization.zeroWidthCount,
      base64BlocksFound: pipeline.decodedPayloads.filter(d => d.encodingType === 'base64').length,
      timestamp: pipeline.metadata.timestamp
    },
    pipeline
  };
}
