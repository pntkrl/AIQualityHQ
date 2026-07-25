import type { NormalizedResult } from './types';

// Zero-width and non-printable control character regex
const ZERO_WIDTH_REGEX = /[\u200B-\u200D\uFEFF\u200E\u200F\u202A-\u202E\u00A0]/g;

// Homoglyph substitution map for common spoofed Cyrillic/Greek characters
const HOMOGLYPH_MAP: Record<string, string> = {
  'а': 'a', 'а́': 'a', 'А': 'A',
  'Ь': 'B', 'В': 'B',
  'с': 'c', 'С': 'C',
  'е': 'e', 'е́': 'e', 'Е': 'E',
  'ѕ': 's',
  'і': 'i', 'І': 'I',
  'ј': 'j',
  'к': 'k', 'К': 'K',
  'о': 'o', 'О': 'O',
  'р': 'p', 'Р': 'P',
  'х': 'x', 'Х': 'X',
  'у': 'y', 'У': 'Y',
  'α': 'a', 'Β': 'B', 'ε': 'e', 'ι': 'i', 'κ': 'k', 'ο': 'o', 'ρ': 'p', 'τ': 't', 'υ': 'u', 'χ': 'x'
};

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

  return {
    raw: rawInput,
    nfkc,
    cleaned: whitespaceNormalized,
    lowercased,
    collapsedPunctuation,
    zeroWidthCount,
    homoglyphCount,
    hasObfuscation: zeroWidthCount > 0 || homoglyphCount > 0,
    normalizationsApplied
  };
}
