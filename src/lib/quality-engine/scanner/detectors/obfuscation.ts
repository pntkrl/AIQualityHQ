import type { DetectorModule } from './types';

export const obfuscationDetector: DetectorModule = {
  id: 'det-obfuscation',
  name: 'Unicode & Obfuscation Detector',
  category: 'unicode_obfuscation',
  categoryName: 'Unicode & Obfuscation',
  weight: 15,
  detect: (input, _context, normalized, decoded) => {
    const matches: ReturnType<DetectorModule['detect']> = [];

    // 1. Zero-width character detector
    if (normalized.zeroWidthCount > 0) {
      matches.push({
        detectorId: 'det-obfuscation',
        name: 'Zero-Width Non-Printable Characters Detected',
        category: 'unicode_obfuscation',
        categoryName: 'Unicode & Obfuscation',
        severity: normalized.zeroWidthCount >= 3 ? 'critical' : 'major',
        confidence: 98,
        matchedPatterns: [`${normalized.zeroWidthCount} invisible control chars`],
        snippet: `Found ${normalized.zeroWidthCount} zero-width characters (e.g. \\u200B, \\uFEFF)`,
        reason: 'Zero-width characters are used to break pattern matching filters while remaining visible to tokenizers.',
        remediation: 'Normalize incoming prompt strings by stripping all non-printable Unicode control characters.'
      });
    }

    // 2. Homoglyph substitution detector
    if (normalized.homoglyphCount > 0) {
      matches.push({
        detectorId: 'det-obfuscation',
        name: 'Cyrillic / Greek Homoglyph Character Substitution',
        category: 'unicode_obfuscation',
        categoryName: 'Unicode & Obfuscation',
        severity: normalized.homoglyphCount >= 3 ? 'major' : 'minor',
        confidence: 92,
        matchedPatterns: [`${normalized.homoglyphCount} homoglyphs replaced`],
        snippet: `Detected ${normalized.homoglyphCount} visually deceptive homoglyph characters`,
        reason: 'Homoglyph characters (e.g. Cyrillic "а" instead of Latin "a") are used to bypass word blocklists.',
        remediation: 'Normalize prompt text with homoglyph replacement mapping before evaluating security policies.'
      });
    }

    // 3. Encoded payloads detector
    if (decoded.length > 0) {
      decoded.forEach((d) => {
        matches.push({
          detectorId: 'det-obfuscation',
          name: `Obfuscated Payload (${d.encodingType.toUpperCase()})`,
          category: 'encoded_payload',
          categoryName: 'Encoded Payload',
          severity: 'major',
          confidence: 88,
          matchedPatterns: [d.rawPayload],
          snippet: `Decoded (${d.encodingType}): "${d.decodedText.substring(0, 50)}..."`,
          reason: `Contains an obfuscated payload encoded using ${d.encodingType.toUpperCase()}.`,
          remediation: 'Automatically decode and scan encoded strings prior to passing inputs into LLM models.'
        });
      });
    }

    return matches;
  }
};
