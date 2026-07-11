export interface OrganizeResult {
  original: string;
  organized: string;
  changes: string[];
}

const CATEGORIES = [
  { name: 'persona', patterns: [/you (?:are|will act|should act)/i, /act as/i, /role:/i, /persona/i, /specialist/i, /expert\s+(in|at|with)/i] },
  { name: 'task', patterns: [/task:/i, /goal:/i, /objective/i, /your (?:job|task|goal|mission)/i, /^explain\b/i, /^describe\b/i, /^create\b/i, /^write\b/i, /^analyze\b/i, /^summarize\b/i] },
  { name: 'constraint', patterns: [/(?:keep|make)\s+(?:it|your response|the answer)/i, /\b(?:must|should|always|never|do not|don't|avoid|limit|only|ensure)\b/i, /strictly/i, /essential/i] },
  { name: 'format', patterns: [/output:/i, /format/i, /markdown/i, /json\b/i, /(?:code\s+)?block/i, /structure/i, /section/i, /heading/i] },
  { name: 'safety', patterns: [/redact/i, /\bpii\b/i, /anonymiz/i, /injection/i, /safeguard/i, /harmful/i, /toxic/i, /confidential/i, /leak/i, /bypass/i, /secure/i] },
  { name: 'factuality', patterns: [/uncertain/i, /invent/i, /speculat/i, /cite/i, /reference/i, /confidence/i, /probability/i, /verify/i, /double.?check/i, /validat/i, /fact/i, /truthful/i, /accurate/i, /precise/i] },
  { name: 'context', patterns: [/context/i, /history/i, /conversation/i, /prior/i, /source/i, /ground/i, /document/i, /extrapolat/i] },
  { name: 'delimiter', patterns: [/fence/i, /xml\b/i, /tag/i, /delim/i, /\{\{.*\}\}/, /variable/i, /input_data/i, /user_input/i, /context_data/i] },
];

function categorizeLine(line: string): string {
  const trimmed = line.trim();
  if (!trimmed) return 'empty';
  for (const cat of CATEGORIES) {
    for (const pattern of cat.patterns) {
      if (pattern.test(trimmed)) return cat.name;
    }
  }
  return 'general';
}

function normalizeBullets(line: string): string {
  return line.replace(/^\s*[\*\+\-]\s+/, '- ');
}

export function organizePrompt(text: string): OrganizeResult {
  const changes: string[] = [];
  const originalLines = text.split('\n');
  const originalWordCount = text.split(/\s+/).filter(Boolean).length;

  // 1. Trim each line and normalize bullets
  let lines = originalLines.map(l => normalizeBullets(l.trimRight()));

  // 2. Strip leading/trailing empty lines
  let start = 0, end = lines.length;
  while (start < end && lines[start].trim() === '') start++;
  while (end > start && lines[end - 1].trim() === '') end--;
  lines = lines.slice(start, end);

  // 3. Deduplicate exact line matches (case-sensitive trimmed)
  const seen = new Set<string>();
  const deduped: string[] = [];
  let dupCount = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '') {
      deduped.push(line);
      continue;
    }
    if (seen.has(trimmed)) {
      dupCount++;
      continue;
    }
    seen.add(trimmed);
    deduped.push(line);
  }
  lines = deduped;

  // 4. Collapse consecutive empty lines to one
  const spaced: string[] = [];
  let prevEmpty = false;
  for (const line of lines) {
    const isEmpty = line.trim() === '';
    if (isEmpty && prevEmpty) continue;
    spaced.push(line);
    prevEmpty = isEmpty;
  }
  lines = spaced;

  // 5. Categorize non-empty lines
  const categorized: { text: string; cat: string }[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '') {
      categorized.push({ text: '', cat: 'empty' });
    } else {
      categorized.push({ text: trimmed, cat: categorizeLine(trimmed) });
    }
  }

  // 6. Group: collect consecutive lines of same category into blocks
  // Then sort blocks by category priority, preserving relative order within categories
  const blocks: { cat: string; lines: string[] }[] = [];
  let currentBlock: { cat: string; lines: string[] } | null = null;
  for (const item of categorized) {
    if (item.cat === 'empty') {
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = null;
      continue;
    }
    if (currentBlock && currentBlock.cat === item.cat) {
      currentBlock.lines.push(item.text);
    } else {
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = { cat: item.cat, lines: [item.text] };
    }
  }
  if (currentBlock) blocks.push(currentBlock);

  // Count how many blocks get reordered
  const originalOrder = blocks.map(b => b.cat).join(',');
  const categoryPriority = ['persona', 'task', 'context', 'delimiter', 'constraint', 'format', 'factuality', 'safety', 'general'];
  blocks.sort((a, b) => {
    const ai = categoryPriority.indexOf(a.cat);
    const bi = categoryPriority.indexOf(b.cat);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });
  const newOrder = blocks.map(b => b.cat).join(',');
  if (originalOrder !== newOrder) {
    changes.push('Grouped related instructions together.');
  }

  // 7. Reassemble
  const resultLines: string[] = [];
  for (let i = 0; i < blocks.length; i++) {
    if (i > 0) resultLines.push('');
    resultLines.push(...blocks[i].lines);
  }

  const organized = resultLines.join('\n');
  const organizedWordCount = organized.split(/\s+/).filter(Boolean).length;

  if (dupCount > 0) {
    changes.push(`Removed ${dupCount} duplicate line${dupCount > 1 ? 's' : ''}.`);
  }
  if (originalWordCount !== organizedWordCount) {
    changes.push(`Reduced from ${originalWordCount} to ${organizedWordCount} words.`);
  }

  if (changes.length === 0) {
    changes.push('Prompt is already well-organized — no changes needed.');
  }

  return { original: text, organized, changes };
}
