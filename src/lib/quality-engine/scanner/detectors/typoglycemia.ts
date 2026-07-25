import type { DetectorModule } from './types';

export const typoglycemiaDetector: DetectorModule = {
  id: 'det-typoglycemia',
  name: 'Typoglycemia & Fuzzy Permutation Detector',
  category: 'typoglycemia_attack',
  categoryName: 'Typoglycemia Attack',
  weight: 25,
  detect: (_input, _context, normalized, _decoded) => {
    const matches: ReturnType<DetectorModule['detect']> = [];

    if (normalized.fuzzyMatches && normalized.fuzzyMatches.length > 0) {
      // Group matches
      const fuzzySummary = normalized.fuzzyMatches
        .map((f) => `"${f.word}" -> "${f.matchedKeyword}" (dist: ${f.distance})`)
        .join(', ');

      // Flag if multiple key instruction keywords are permuted simultaneously (e.g. igorn + preivous + insrtuctions)
      const hasMultipleKeyPermutations = normalized.fuzzyMatches.length >= 2;

      matches.push({
        detectorId: 'det-typoglycemia',
        name: 'Permuted / Scrambled Keyword Obfuscation (Typoglycemia)',
        category: 'typoglycemia_attack',
        categoryName: 'Typoglycemia Attack',
        severity: hasMultipleKeyPermutations ? 'critical' : 'major',
        confidence: 90,
        matchedPatterns: normalized.fuzzyMatches.map((f) => f.word),
        snippet: fuzzySummary,
        reason: `Detected ${normalized.fuzzyMatches.length} permuted keyword(s) attempting to evade strict word-boundary regexes (${fuzzySummary}).`,
        remediation: 'Pre-process prompt input with fuzzy Levenshtein keyword matching and token normalization before policy evaluation.'
      });
    }

    return matches;
  }
};
