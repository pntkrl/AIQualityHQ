import type { NormalizedResult, FuzzyMatch } from './types';

// Zero-width and non-printable control character regex
const ZERO_WIDTH_REGEX = /[\u200B-\u200D\uFEFF\u200E\u200F\u202A-\u202E\u00A0]/g;

// Expanded Homoglyph substitution map including Fullwidth ASCII and Cyrillic/Greek
const HOMOGLYPH_MAP: Record<string, string> = {
  // Fullwidth ASCII (ｉｇｎｏｒｅ -> ignore)
  'ａ': 'a', 'ｂ': 'b', 'ｃ': 'c', 'ｄ': 'd', 'ｅ': 'e', 'ｆ': 'f', 'ｇ': 'g', 'ｈ': 'h',
  'ｉ': 'i', 'ｊ': 'j', 'ｋ': 'k', 'ｌ': 'l', 'ｍ': 'm', 'ｎ': 'n', 'ｏ': 'o', 'ｐ': 'p',
  'ｑ': 'q', 'ｒ': 'r', 'ｓ': 's', 'ｔ': 't', 'ｕ': 'u', 'ｖ': 'v', 'ｗ': 'w', 'ｘ': 'x',
  'ｙ': 'y', 'ｚ': 'z',
  'Ａ': 'A', 'Ｂ': 'B', 'Ｃ': 'C', 'Ｄ': 'D', 'Ｅ': 'E', 'Ｆ': 'F', 'Ｇ': 'G', 'Ｈ': 'H',
  'Ｉ': 'I', 'Ｊ': 'J', 'Ｋ': 'K', 'Ｌ': 'L', 'Ｍ': 'M', 'Ｎ': 'N', 'Ｏ': 'O', 'Ｐ': 'P',
  'Ｑ': 'Q', 'Ｒ': 'R', 'Ｓ': 'S', 'Ｔ': 'T', 'Ｕ': 'U', 'Ｖ': 'V', 'Ｗ': 'W', 'Ｘ': 'X',
  'Ｙ': 'Y', 'Ｚ': 'Z',
  // Cyrillic & Greek homoglyphs
  'а': 'a', 'а́': 'a', 'А': 'A',
  'Ь': 'B', 'В': 'B',
  'с': 'c', 'С': 'C',
  'е': 'e', 'е́': 'e', 'Е': 'E',
  'і': 'i', 'І': 'I',
  'ј': 'j',
  'к': 'k', 'К': 'K',
  'о': 'o', 'О': 'O',
  'р': 'p', 'Р': 'P',
  'ѕ': 's',
  'х': 'x', 'Х': 'X',
  'у': 'y', 'У': 'Y',
  'α': 'a', 'Β': 'B', 'ε': 'e', 'ι': 'i', 'κ': 'k', 'ο': 'o', 'ρ': 'p', 'τ': 't', 'υ': 'u', 'χ': 'x'
};

// Levenshtein edit distance between two strings
export function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

const CRITICAL_KEYWORDS = [
  'ignore',
  'previous',
  'instructions',
  'directives',
  'system',
  'prompt',
  'bypass',
  'jailbreak',
  'override',
  'reveal',
  'forget',
  'reset',
  'context'
];

export function findFuzzyKeywordMatches(
  text: string,
  keywords: string[] = CRITICAL_KEYWORDS,
  maxDistance = 2
): FuzzyMatch[] {
  const matches: FuzzyMatch[] = [];
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length >= 4);

  words.forEach((word) => {
    keywords.forEach((kw) => {
      // Ignore exact matches
      if (word === kw) return;
      // Distance constraint proportional to word length
      const dist = levenshteinDistance(word, kw);
      const allowedDist = kw.length <= 5 ? 1 : maxDistance;
      if (dist > 0 && dist <= allowedDist) {
        matches.push({
          word,
          matchedKeyword: kw,
          distance: dist
        });
      }
    });
  });

  return matches;
}

export function normalizeInput(rawInput: string): NormalizedResult {
  const normalizationsApplied: string[] = [];

  // 1. Unicode NFKC Normalization
  let nfkc = rawInput;
  try {
    nfkc = rawInput.normalize('NFKC');
    if (nfkc !== rawInput) normalizationsApplied.push('Unicode NFKC Normalization');
  } catch (_) {}

  // 2. Zero-Width Character Removal
  const zeroWidthMatches = nfkc.match(ZERO_WIDTH_REGEX);
  const zeroWidthCount = zeroWidthMatches ? zeroWidthMatches.length : 0;
  let cleaned = nfkc.replace(ZERO_WIDTH_REGEX, '');
  if (zeroWidthCount > 0) {
    normalizationsApplied.push(`Stripped ${zeroWidthCount} Zero-Width/Control Characters`);
  }

  // 3. Homoglyph Normalization
  let homoglyphCount = 0;
  let homoglyphReplaced = '';
  for (const char of cleaned) {
    if (HOMOGLYPH_MAP[char]) {
      homoglyphReplaced += HOMOGLYPH_MAP[char];
      homoglyphCount++;
    } else {
      homoglyphReplaced += char;
    }
  }
  if (homoglyphCount > 0) {
    cleaned = homoglyphReplaced;
    normalizationsApplied.push(`Normalized ${homoglyphCount} Homoglyph Characters`);
  }

  // 4. Whitespace Normalization
  const whitespaceNormalized = cleaned.replace(/\s+/g, ' ').trim();
  if (whitespaceNormalized !== cleaned) {
    normalizationsApplied.push('Whitespace Collapsed & Trimmed');
  }

  // 5. Lowercasing
  const lowercased = whitespaceNormalized.toLowerCase();

  // 6. Collapse Repeated Punctuation
  const collapsedPunctuation = lowercased
    .replace(/!{2,}/g, '!')
    .replace(/\?{2,}/g, '?')
    .replace(/={3,}/g, '===')
    .replace(/-{3,}/g, '---')
    .replace(/#{3,}/g, '###');

  // 7. Fuzzy Levenshtein Typoglycemia Analysis
  const fuzzyMatches = findFuzzyKeywordMatches(whitespaceNormalized);
  if (fuzzyMatches.length > 0) {
    normalizationsApplied.push(`Identified ${fuzzyMatches.length} Typoglycemia Fuzzy Matches`);
  }

  return {
    raw: rawInput,
    nfkc,
    cleaned: whitespaceNormalized,
    lowercased,
    collapsedPunctuation,
    zeroWidthCount,
    homoglyphCount,
    hasObfuscation: zeroWidthCount > 0 || homoglyphCount > 0 || fuzzyMatches.length > 0,
    fuzzyMatches,
    normalizationsApplied
  };
}
