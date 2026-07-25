import type { DecodedPayload } from './types';

// Helper to check if string contains printable English/ASCII text
function isPrintableEnglish(text: string): boolean {
  if (!text || text.length < 4) return false;
  // Check if at least 70% characters are printable ASCII (32..126) or tabs/newlines
  let printableCount = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if ((code >= 32 && code <= 126) || code === 9 || code === 10 || code === 13) {
      printableCount++;
    }
  }
  return printableCount / text.length >= 0.7 && /[a-zA-Z]{3,}/.test(text);
}

// ROT13 Decoder
function rot13(str: string): string {
  return str.replace(/[a-zA-Z]/g, (c) => {
    const code = c.charCodeAt(0);
    const base = code >= 97 ? 97 : 65;
    return String.fromCharCode(((code - base + 13) % 26) + base);
  });
}

// Hex Decoder (\x41 or 0x41 or %41 format)
function decodeHex(text: string): string | null {
  try {
    if (text.includes('\\x')) {
      const decoded = text.replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) =>
        String.fromCharCode(parseInt(hex, 16))
      );
      if (decoded !== text) return decoded;
    }
  } catch (_) {}
  return null;
}

// Base64 regex for blocks of length >= 16
const BASE64_BLOCK_REGEX = /\b[A-Za-z0-9+/]{16,}={0,2}\b/g;

export function decodePayloads(input: string): DecodedPayload[] {
  const decodedPayloads: DecodedPayload[] = [];
  const seenDecodes = new Set<string>();

  // 1. URL Decoding
  if (input.includes('%')) {
    try {
      const urlDecoded = decodeURIComponent(input);
      if (urlDecoded !== input && isPrintableEnglish(urlDecoded)) {
        decodedPayloads.push({
          encodingType: 'url',
          rawPayload: input.substring(0, 60),
          decodedText: urlDecoded,
          isPrintableEnglish: true
        });
        seenDecodes.add(urlDecoded);
      }
    } catch (_) {}
  }

  // 2. Base64 Decoding
  const b64Matches = input.match(BASE64_BLOCK_REGEX);
  if (b64Matches) {
    b64Matches.forEach((match) => {
      try {
        const decoded = Buffer.from(match, 'base64').toString('utf-8');
        if (decoded && isPrintableEnglish(decoded) && !seenDecodes.has(decoded)) {
          decodedPayloads.push({
            encodingType: 'base64',
            rawPayload: match,
            decodedText: decoded,
            isPrintableEnglish: true
          });
          seenDecodes.add(decoded);
        }
      } catch (_) {}
    });
  }

  // 3. Hex Decoding
  const hexDecoded = decodeHex(input);
  if (hexDecoded && isPrintableEnglish(hexDecoded) && !seenDecodes.has(hexDecoded)) {
    decodedPayloads.push({
      encodingType: 'hex',
      rawPayload: input.substring(0, 60),
      decodedText: hexDecoded,
      isPrintableEnglish: true
    });
    seenDecodes.add(hexDecoded);
  }

  // 4. ROT13 Decoding (checked if input has rot13 indicators or override keywords when shifted)
  const rotDecoded = rot13(input);
  if (
    rotDecoded !== input &&
    isPrintableEnglish(rotDecoded) &&
    /(?:ignore|system|prompt|bypass|jailbreak|forget)/i.test(rotDecoded) &&
    !seenDecodes.has(rotDecoded)
  ) {
    decodedPayloads.push({
      encodingType: 'rot13',
      rawPayload: input.substring(0, 60),
      decodedText: rotDecoded,
      isPrintableEnglish: true
    });
    seenDecodes.add(rotDecoded);
  }

  return decodedPayloads;
}
