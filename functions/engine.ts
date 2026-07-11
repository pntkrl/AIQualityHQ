interface RuleResult {
  id: string; name: string; dimension: 'prompt'|'memory'|'context'|'trust'|'privacy'|'security';
  passed: boolean; score: number; weight: number; explanation: string; suggestion?: string;
  severity: 'critical'|'major'|'minor'|'pass';
}
interface DimensionResult {
  key: string; name: string; score: number; passed: boolean; factorsCount: number; passedCount: number;
}
interface AnalysisResult {
  overallScore: number; passed: boolean;
  dimensions: Record<string, DimensionResult>;
  rules: RuleResult[]; recommendations: string[];
  metadata: { charCount: number; wordCount: number; timestamp: number };
}

function scoreToSeverity(s: number): RuleResult['severity'] {
  return s >= 100 ? 'pass' : s >= 67 ? 'minor' : s >= 34 ? 'major' : 'critical';
}
function makeRule(p: { id: string; name: string; dimension: RuleResult['dimension']; passed: boolean; score: number; weight: number; explanation: string; suggestion?: string }): RuleResult {
  return { ...p, severity: scoreToSeverity(p.score) };
}
function matchQuality(text: string, regex: RegExp): number {
  const flags = regex.flags.includes('g') ? regex.flags : regex.flags + 'g';
  const g = new RegExp(regex.source, flags);
  const m = text.match(g); return m ? m.length : 0;
}
function graduatedScore(value: number, thresholds: [number, number][]): number {
  for (const [min, s] of thresholds) { if (value >= min) return s; }
  return 0;
}

const ROLE_RE = /(?:you are|act as|role:|persona:|expert|tutor|engineer|developer|designer|assistant|as a\s+\w+|assume the profile|your task is to act)/i;
const TASK_RE = /(?:explain|create|write|goal:|task:|objective:|analyze|summarize|generate|format|construct|design|evaluate|interpret|translate)/i;
const OUTPUT_RE = /(?:json|markdown|table|csv|format|list|bullet|concise|summary|output|structure|respond with|schema|as a)/i;
const EXAMPLE_RE = /(?:example|sample|demonstrat|show me|for instance|e\.g\.|like this|template|model answer)/i;
const HISTORY_RE = /(?:prior|previous|earlier|remember|history|conversation|context|chat history|messages|state)/i;
const MARKUP_RE = /(?:user:|assistant:|system:|human:|ai:|role:|\[user\]|\[assistant\])/i;
const CONTEXT_SUM_RE = /(?:summarize|recap|the above|as described|abovementioned|aforementioned|given the)/i;
const GROUND_RE = /(?:source|ground|based on|file|document|reference|citation|provided text|only use|do not assume|extrapolate|refer to)/i;
const HALL_RE = /(?:if you don't know|i don't know|do not invent|honest|fact-based|truthful|do not speculate|hallucinate|cannot verify|if uncertain)/i;
const CITE_RE = /(?:cite|reference|link|quote|sources|citation|lines|page number|footnote)/i;
const PII_RE = /(?:pii|personally identifiable|personal information|private data|redact|anonymize|leak|ssn|social security|emails|names|credentials|sensitive data)/i;
const ISO_RE = /(?:do not share|do not leak|internal use only|confidential|restrict|secrets|classification|proprietary)/i;
const INJECT_RE = /(?:do not bypass|ignore user instructions|defend against|injection|system prompt rules|jailbreak|override|ignore requests to|safety check|bypassing|instructions override)/i;
const SAFE_RE = /(?:safe|appropriate|filter|moderate|toxic|harmful|offensive|illegal|hate speech|harassment|profanity)/i;
const ROLE_ISO_RE = /(?:system instruction|system prompt|core directive|you are|your role is|as an ai|as the system|ignore|must follow)/i;
const PLATFORM_RE = /(?:web|mobile|desktop|tablet|responsive|app|browser|ios|android|screen|viewport)/i;
const STYLE_RE = /(?:modern|clean|minimal|dark|light|vibrant|professional|sophisticated|playful|elegant|sleek|bold|subtle|gradient|shadow|rounded|polished|refined|mood|vibe|theme)/i;
const COMP_RE = /(?:navbar|navigation|header|footer|hero|card|grid|sidebar|modal|dropdown|carousel|accordion|tab|form|input|button|avatar|badge|chip|table|list|tooltip|popover|drawer|banner|toast|skeleton|spinner|stepper|timeline)/i;
const COLOR_RE = /(?:color|#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})|rgb|hsl|hex|palette|theme|accent|background|foreground|primary accent|secondary|surface)/i;
const UI_RE = /(?:navigation bar|call-to-action|card grid|hero section|login form|search bar|side panel|drop-down|toggle button|progress bar|breadcrumb|pagination|filter bar|landing page|dashboard|form field)/i;
const FENCE_RE = /(\`\`\`|""")/i;
const XML_RE = /<([a-zA-Z0-9_-]+)(?:\s+[^>]*)*>[\s\S]*?<\/\1>/i;
const BRACKET_RE = /(\{\{[a-zA-Z0-9_-]+\}\}|\{[a-zA-Z0-9_-]+\}|\[[a-zA-Z0-9_-]+\])/i;
const VAR_RE = /\{\{.*?\}\}|\[.*?\]/i;
const CRED_RE = /(?:sk-[a-zA-Z0-9]{20,}|AIzaSy[a-zA-Z0-9_\-]{33}|(?:api[-_]?key|password|db[-_]?pass|secret[-_]?key|client[-_]?secret|auth[-_]?token)\s*[:=]\s*["']?(?![{\[a-zA-Z0-9_-]+[}\]])[a-zA-Z0-9_\-\.]{8,}["']?)/i;
const CONSIST_RE = /(?:consisten|format|style|maintain|keep|follow|throughout|always|throughout|uniform)/i;
const CONF_RE = /(?:confidence|uncertain|likely|possibly|might|may|estimate|approximate|probability|sure|definitely)/i;
const HIER_RE = /(?:section|subsection|heading|step|phase|stage|layer|level|\d+\.\s+|priority)/i;
const VERIF_RE = /(?:verify|double.?check|validate|confirm|review|audit|proofread|check for|ensure)/i;
const DATA_MIN_RE = /(?:minimum|minimal|only|essential|necessary|just|limit|reduce|trim)/i;
const BOUND_RE = /(?:only|output|respond|return|reply|answer|response must|do not include|strictly)/i;
const PERS_CONT_RE = /(?:as a|as the|in your role|given your|you are the|you are a|throughout|maintain your)/i;

const DIM_WEIGHTS: Record<string, number> = { prompt: 0.20, memory: 0.15, context: 0.20, trust: 0.25, privacy: 0.10, security: 0.10 };
const DIM_NAMES: Record<string, string> = { prompt: 'Prompt Structure', memory: 'Memory & State', context: 'Context Grounding', trust: 'Trust & Accuracy', privacy: 'PII & Privacy', security: 'Security & Safety' };

export function analyzePrompt(prompt: string): AnalysisResult {
  const rules: RuleResult[] = [];
  const p = prompt;
  const len = p.length;

  // p-len
  const lenSc = len >= 50 && len <= 4000 ? 100 : len >= 20 ? 60 : 30;
  rules.push(makeRule({ id: 'p-len', name: 'Prompt Length', dimension: 'prompt', passed: lenSc >= 60, score: lenSc, weight: 10,
    explanation: len >= 50 && len <= 4000 ? `Optimal length (${len} chars).` : len >= 20 ? `Short (${len} chars) but adequate.` : `Very short (${len} chars).`,
    suggestion: lenSc >= 60 ? undefined : len < 20 ? 'Add more context.' : 'Refine to be more concise.' }));

  // p-role
  const rM = matchQuality(p, ROLE_RE); const rS = graduatedScore(rM, [[3,100],[2,75],[1,50],[0,0]]);
  rules.push(makeRule({ id: 'p-role', name: 'Role Assignment', dimension: 'prompt', passed: rS >= 50, score: rS, weight: 15,
    explanation: rM >= 2 ? `Well-defined role (${rM} patterns).` : rM === 1 ? 'Basic role assigned.' : 'No role defined.',
    suggestion: rS >= 50 ? undefined : 'Assign a persona.' }));

  // p-task
  const tM = matchQuality(p, TASK_RE); const tS = graduatedScore(tM, [[4,100],[3,85],[2,65],[1,40],[0,0]]);
  rules.push(makeRule({ id: 'p-task', name: 'Task Clarity', dimension: 'prompt', passed: tS >= 60, score: tS, weight: 20,
    explanation: tM >= 3 ? `Clear objectives (${tM} verbs).` : tM === 2 ? 'Core task defined.' : tM === 1 ? 'Basic task.' : 'No action verbs.',
    suggestion: tS >= 60 ? undefined : 'Use explicit action verbs.' }));

  // p-output
  const oM = matchQuality(p, OUTPUT_RE); const oS = graduatedScore(oM, [[4,100],[3,80],[2,60],[1,35],[0,0]]);
  rules.push(makeRule({ id: 'p-output', name: 'Output Format', dimension: 'prompt', passed: oS >= 60, score: oS, weight: 20,
    explanation: oM >= 3 ? `Detailed format (${oM} indicators).` : oM === 2 ? 'Partial format.' : oM === 1 ? 'Basic format.' : 'No format specified.',
    suggestion: oS >= 60 ? undefined : 'Specify output format.' }));

  // p-examples
  const eM = matchQuality(p, EXAMPLE_RE); const eS = graduatedScore(eM, [[3,100],[2,75],[1,40],[0,0]]);
  rules.push(makeRule({ id: 'p-examples', name: 'Examples', dimension: 'prompt', passed: eS >= 50, score: eS, weight: 15,
    explanation: eM >= 2 ? `Multiple examples (${eM}).` : eM === 1 ? 'One example.' : 'No examples.',
    suggestion: eS >= 50 ? undefined : 'Include examples.' }));

  // p-format-consistency
  const fM = matchQuality(p, CONSIST_RE); const fS = graduatedScore(fM, [[3,100],[2,75],[1,45],[0,0]]);
  rules.push(makeRule({ id: 'p-format-consistency', name: 'Format Consistency', dimension: 'prompt', passed: fS >= 50, score: fS, weight: 10,
    explanation: fM >= 2 ? `Consistency reinforced (${fM}).` : fM === 1 ? 'Basic consistency.' : 'No consistency rules.',
    suggestion: fS >= 50 ? undefined : 'Enforce consistent format.' }));

  // p-constraints
  const cM = matchQuality(p, /(?:must|should|do not|always|never|only|required|necessary|important|essential|crucial)/i);
  const cS = graduatedScore(cM, [[4,100],[3,80],[2,60],[1,35],[0,0]]);
  rules.push(makeRule({ id: 'p-constraints', name: 'Constraints', dimension: 'prompt', passed: cS >= 60, score: cS, weight: 10,
    explanation: cM >= 3 ? `Multiple constraints (${cM}).` : cM === 2 ? 'Some constraints.' : cM === 1 ? 'Basic constraint.' : 'No constraints.',
    suggestion: cS >= 60 ? undefined : 'Add explicit constraints.' }));

  // p-platform, p-visual-style, p-component-detail, p-color-definition, p-ui-keywords
  const uis = [[PLATFORM_RE,8,'p-platform','Platform Spec'],[STYLE_RE,8,'p-visual-style','Visual Style'],[COMP_RE,10,'p-component-detail','Component Detail'],[COLOR_RE,8,'p-color-definition','Color Definition'],[UI_RE,6,'p-ui-keywords','UI Terminology']];
  for (const [re, wt, id, nm] of uis) {
    const mM = matchQuality(p, re as RegExp);
    const mS = graduatedScore(mM, [[3,100],[2,70],[1,40],[0,0]]);
    rules.push(makeRule({ id: id as string, name: nm as string, dimension: 'prompt', passed: mS >= 50, score: mS, weight: wt as number,
      explanation: mM >= 2 ? `Strong (${mM} patterns).` : mM === 1 ? 'Present.' : 'Not detected.',
      suggestion: mS >= 50 ? undefined : `Specify ${(nm as string).toLowerCase()}.` }));
  }

  // Memory dimension
  const hM = matchQuality(p, HISTORY_RE); const hS = graduatedScore(hM, [[3,100],[2,70],[1,40],[0,0]]);
  rules.push(makeRule({ id: 'm-history', name: 'Conversation History', dimension: 'memory', passed: hS >= 50, score: hS, weight: 30,
    explanation: hM >= 2 ? `History referenced (${hM}).` : hM === 1 ? 'Single reference.' : 'No history.',
    suggestion: hS >= 50 ? undefined : 'Reference prior messages.' }));

  const mMk = matchQuality(p, MARKUP_RE); const mMS = graduatedScore(mMk, [[3,100],[2,75],[1,50],[0,0]]);
  rules.push(makeRule({ id: 'm-markup', name: 'Turn Markup', dimension: 'memory', passed: mMS >= 50, score: mMS, weight: 30,
    explanation: mMk >= 2 ? `Multiple markers (${mMk}).` : mMk === 1 ? 'Basic marker.' : 'No markers.',
    suggestion: mMS >= 50 ? undefined : 'Use User:/Assistant: markers.' }));

  const pM = matchQuality(p, PERS_CONT_RE); const pS = graduatedScore(pM, [[3,100],[2,70],[1,40],[0,0]]);
  rules.push(makeRule({ id: 'm-persona-continuity', name: 'Persona Continuity', dimension: 'memory', passed: pS >= 50, score: pS, weight: 20,
    explanation: pM >= 2 ? `Persona reinforced (${pM}).` : pM === 1 ? 'Persona stated.' : 'No continuity.',
    suggestion: pS >= 50 ? undefined : 'Reinforce persona throughout.' }));

  const csM = matchQuality(p, CONTEXT_SUM_RE); const csS = graduatedScore(csM, [[2,100],[1,60],[0,0]]);
  rules.push(makeRule({ id: 'm-context-summary', name: 'Context Recap', dimension: 'memory', passed: csS >= 60, score: csS, weight: 20,
    explanation: csM >= 2 ? `Multiple recaps (${csM}).` : csM === 1 ? 'Basic recap.' : 'No recap.',
    suggestion: csS >= 60 ? undefined : 'Summarize context before instructions.' }));

  // Context dimension
  const dF = matchQuality(p, FENCE_RE); const dX = matchQuality(p, XML_RE); const dB = matchQuality(p, BRACKET_RE);
  const dT = dF + dX + dB; const dS = graduatedScore(dT, [[3,100],[2,75],[1,50],[0,0]]);
  rules.push(makeRule({ id: 'c-delims', name: 'Delimiters', dimension: 'context', passed: dS >= 50, score: dS, weight: 25,
    explanation: dT >= 2 ? `Multiple delimiters (${dT}).` : dT === 1 ? 'One delimiter.' : 'No delimiters.',
    suggestion: dS >= 50 ? undefined : 'Use ``` or XML tags.' }));

  const gM = matchQuality(p, GROUND_RE); const gS = graduatedScore(gM, [[3,100],[2,70],[1,40],[0,0]]);
  rules.push(makeRule({ id: 'c-grounding', name: 'Context Grounding', dimension: 'context', passed: gS >= 50, score: gS, weight: 25,
    explanation: gM >= 2 ? `Strong grounding (${gM}).` : gM === 1 ? 'Basic grounding.' : 'No grounding.',
    suggestion: gS >= 50 ? undefined : 'Restrict to provided context.' }));

  const hiM = matchQuality(p, HIER_RE); const hiS = graduatedScore(hiM, [[4,100],[3,80],[2,55],[1,30],[0,0]]);
  rules.push(makeRule({ id: 'c-hierarchy', name: 'Hierarchy', dimension: 'context', passed: hiS >= 50, score: hiS, weight: 20,
    explanation: hiM >= 3 ? `Clear structure (${hiM}).` : hiM === 2 ? 'Some structure.' : hiM === 1 ? 'Basic.' : 'No hierarchy.',
    suggestion: hiS >= 50 ? undefined : 'Use numbered steps.' }));

  const vM = matchQuality(p, VAR_RE); const vS = graduatedScore(vM, [[3,100],[2,70],[1,40],[0,0]]);
  rules.push(makeRule({ id: 'c-variable-use', name: 'Variables', dimension: 'context', passed: vS >= 50, score: vS, weight: 15,
    explanation: vM >= 2 ? `Multiple vars (${vM}).` : vM === 1 ? 'One variable.' : 'No variables.',
    suggestion: vS >= 50 ? undefined : 'Use {{variable}} placeholders.' }));

  const rDM = matchQuality(p, /(?:document|file|text|source|article|report|study|data)/i);
  const rGM = matchQuality(p, GROUND_RE); const rT = rDM + rGM; const rS2 = graduatedScore(rT, [[5,100],[3,70],[1,40],[0,0]]);
  rules.push(makeRule({ id: 'c-references', name: 'External References', dimension: 'context', passed: rS2 >= 50, score: rS2, weight: 15,
    explanation: rT >= 3 ? `Strong references (${rT}).` : rT >= 1 ? 'Some references.' : 'No references.',
    suggestion: rS2 >= 50 ? undefined : 'Reference specific sources.' }));

  // Trust dimension
  const haM = matchQuality(p, HALL_RE); const haS = graduatedScore(haM, [[3,100],[2,75],[1,50],[0,0]]);
  rules.push(makeRule({ id: 't-hallucination', name: 'Hallucination Guard', dimension: 'trust', passed: haS >= 50, score: haS, weight: 30,
    explanation: haM >= 2 ? `Strong safeguards (${haM}).` : haM === 1 ? 'Basic safeguard.' : 'No safeguards.',
    suggestion: haS >= 50 ? undefined : 'Add "if unsure, say so" instruction.' }));

  const ciM = matchQuality(p, CITE_RE); const ciS = graduatedScore(ciM, [[3,100],[2,70],[1,40],[0,0]]);
  rules.push(makeRule({ id: 't-citations', name: 'Citations', dimension: 'trust', passed: ciS >= 50, score: ciS, weight: 20,
    explanation: ciM >= 2 ? `Strong citation demands (${ciM}).` : ciM === 1 ? 'Basic citation.' : 'No citations.',
    suggestion: ciS >= 50 ? undefined : 'Request source citations.' }));

  const coM = matchQuality(p, CONF_RE); const coS = graduatedScore(coM, [[4,100],[3,80],[2,55],[1,30],[0,0]]);
  rules.push(makeRule({ id: 't-confidence', name: 'Confidence Calibration', dimension: 'trust', passed: coS >= 50, score: coS, weight: 15,
    explanation: coM >= 3 ? `Well-calibrated (${coM}).` : coM === 2 ? 'Partial.' : coM === 1 ? 'Basic.' : 'None.',
    suggestion: coS >= 50 ? undefined : 'Ask to express uncertainty.' }));

  const veM = matchQuality(p, VERIF_RE); const veS = graduatedScore(veM, [[3,100],[2,70],[1,40],[0,0]]);
  rules.push(makeRule({ id: 't-verification', name: 'Verification', dimension: 'trust', passed: veS >= 50, score: veS, weight: 20,
    explanation: veM >= 2 ? `Multiple checks (${veM}).` : veM === 1 ? 'Basic check.' : 'No verification.',
    suggestion: veS >= 50 ? undefined : 'Ask to double-check reasoning.' }));

  const faM = matchQuality(p, /(?:accurate|correct|precise|truthful|fact|correctness|verif|validate|true|proven)/i);
  const faS = graduatedScore(faM, [[4,100],[3,80],[2,55],[1,30],[0,0]]);
  rules.push(makeRule({ id: 't-fact-checking', name: 'Factual Accuracy', dimension: 'trust', passed: faS >= 50, score: faS, weight: 15,
    explanation: faM >= 3 ? `Strong accuracy demands (${faM}).` : faM === 2 ? 'Partial.' : faM === 1 ? 'Basic.' : 'None.',
    suggestion: faS >= 50 ? undefined : 'Require factual correctness.' }));

  // Privacy dimension
  const piM = matchQuality(p, PII_RE); const piS = graduatedScore(piM, [[3,100],[2,70],[1,40],[0,0]]);
  rules.push(makeRule({ id: 'p-pii', name: 'PII Safeguards', dimension: 'privacy', passed: piS >= 50, score: piS, weight: 35,
    explanation: piM >= 2 ? `Strong PII protection (${piM}).` : piM === 1 ? 'Basic PII rule.' : 'No PII rules.',
    suggestion: piS >= 50 ? undefined : 'Add PII redaction.' }));

  const isM = matchQuality(p, ISO_RE); const isS = graduatedScore(isM, [[2,100],[1,55],[0,0]]);
  rules.push(makeRule({ id: 'p-isolation', name: 'Data Isolation', dimension: 'privacy', passed: isS >= 55, score: isS, weight: 30,
    explanation: isM >= 2 ? `Clear isolation (${isM}).` : isM === 1 ? 'Basic isolation.' : 'No isolation.',
    suggestion: isS >= 55 ? undefined : 'Declare confidentiality.' }));

  const dmM = matchQuality(p, DATA_MIN_RE); const dmS = graduatedScore(dmM, [[3,100],[2,70],[1,40],[0,0]]);
  rules.push(makeRule({ id: 'p-minimization', name: 'Data Minimization', dimension: 'privacy', passed: dmS >= 50, score: dmS, weight: 35,
    explanation: dmM >= 2 ? `Strong minimization (${dmM}).` : dmM === 1 ? 'Basic.' : 'None.',
    suggestion: dmS >= 50 ? undefined : 'Limit data usage.' }));

  // Security dimension
  const ijM = matchQuality(p, INJECT_RE); const ijS = graduatedScore(ijM, [[3,100],[2,70],[1,40],[0,0]]);
  rules.push(makeRule({ id: 's-injection', name: 'Injection Defense', dimension: 'security', passed: ijS >= 50, score: ijS, weight: 25,
    explanation: ijM >= 2 ? `Strong defenses (${ijM}).` : ijM === 1 ? 'Basic defense.' : 'No defenses.',
    suggestion: ijS >= 50 ? undefined : 'Add injection defense.' }));

  const sfM = matchQuality(p, SAFE_RE); const sfS = graduatedScore(sfM, [[3,100],[2,70],[1,40],[0,0]]);
  rules.push(makeRule({ id: 's-safety', name: 'Content Safety', dimension: 'security', passed: sfS >= 50, score: sfS, weight: 20,
    explanation: sfM >= 2 ? `Strong safety (${sfM}).` : sfM === 1 ? 'Basic safety.' : 'No safety rules.',
    suggestion: sfS >= 50 ? undefined : 'Add content filter.' }));

  const cr = CRED_RE.test(p);
  rules.push(makeRule({ id: 's-credentials', name: 'Credential Check', dimension: 'security', passed: !cr, score: !cr ? 100 : 0, weight: 20,
    explanation: !cr ? 'No hardcoded secrets.' : 'Potential secrets detected.',
    suggestion: !cr ? undefined : 'Remove hardcoded credentials.' }));

  const obM = matchQuality(p, BOUND_RE); const obS = graduatedScore(obM, [[3,100],[2,70],[1,40],[0,0]]);
  rules.push(makeRule({ id: 's-output-boundary', name: 'Output Boundary', dimension: 'security', passed: obS >= 50, score: obS, weight: 20,
    explanation: obM >= 2 ? `Clear boundaries (${obM}).` : obM === 1 ? 'Basic boundary.' : 'No boundaries.',
    suggestion: obS >= 50 ? undefined : 'Restrict output scope.' }));

  const riM = matchQuality(p, ROLE_ISO_RE); const riS = graduatedScore(riM, [[3,100],[2,70],[1,40],[0,0]]);
  rules.push(makeRule({ id: 's-role-isolation', name: 'Role Isolation', dimension: 'security', passed: riS >= 50, score: riS, weight: 15,
    explanation: riM >= 2 ? `Clear role separation (${riM}).` : riM === 1 ? 'Basic separation.' : 'No role separation.',
    suggestion: riS >= 50 ? undefined : 'Separate system from user input.' }));

  // Contradiction rules
  const SHORT_RE = /(?:be concise|keep it short|keep it brief|under \d+ words|briefly|succinct|in short|make it brief)/i;
  const LONG_RE = /(?:in.depth|detailed|thorough|comprehensive|exhaustive|elaborate|go into detail|full explanation|as much detail|write a lot)/i;
  const hSh = SHORT_RE.test(p); const hLo = LONG_RE.test(p); const hLC = hSh && hLo;
  rules.push(makeRule({ id: 'x-con-length', name: 'Length Contradiction', dimension: 'context', passed: !hLC, score: hLC ? 0 : 100, weight: 10,
    explanation: hLC ? 'Conflicts: brevity vs depth.' : hSh ? 'Brevity requested (consistent).' : hLo ? 'Depth requested (consistent).' : 'No length conflict.',
    suggestion: hLC ? 'Pick concise OR in-depth, not both.' : undefined }));

  const JF = /(?:json|JSON|return\s+(?:as\s+)?json|output\s+(?:as\s+)?json|respond\s+(?:in\s+)?json)/; const MF = /(?:markdown|md\b(?!\w)|markdown\s+table)/; const HF = /(?:html\b|<[a-z]+>|div\b|span\b|table\b)/;
  const fl: string[] = []; if (JF.test(p)) fl.push('JSON'); if (MF.test(p)) fl.push('Markdown'); if (HF.test(p)) fl.push('HTML');
  const fc = fl.length >= 2;
  rules.push(makeRule({ id: 'x-con-format', name: 'Format Contradiction', dimension: 'context', passed: !fc, score: fc ? 0 : fl.length === 1 ? 100 : 70, weight: 10,
    explanation: fc ? `Mutually exclusive: ${fl.join(' & ')}.` : fl.length === 1 ? `Single format: ${fl[0]}.` : 'No format specified.',
    suggestion: fc ? `Pick one: ${fl.join(' or ')}.` : undefined }));

  const OV = /(?:ignore (?:all )?(?:my |the |previous |prior )?instructions|disregard (?:all )?(?:my |the )?(?:previous |prior )?instructions|forget everything|forget (?:all )?(?:my |the )?(?:previous |prior )?instructions)/i;
  const hOv = OV.test(p) && p.length > 30;
  rules.push(makeRule({ id: 'x-con-override', name: 'Instruction Override', dimension: 'context', passed: !hOv, score: hOv ? 0 : 100, weight: 15,
    explanation: hOv ? 'Contains "ignore all instructions" — conflicts with other rules.' : 'No override detected.',
    suggestion: hOv ? 'Remove "ignore all instructions" phrasing.' : undefined }));

  // Token efficiency
  const FILLER = /\b(?:please|kindly|I would like you to|could you please|can you please|I need you to|I want you to|I would like|just want|just need|feel free to)\b/gi;
  const fM2 = p.match(FILLER); const fC = fM2 ? fM2.length : 0;
  const estTk = Math.ceil(p.length / 4);
  const tkBase = estTk > 4000 ? 20 : estTk > 2000 ? 60 : estTk > 100 ? 90 : 95;
  const tkS = Math.max(0, tkBase - Math.min(fC * 12, 50));
  rules.push(makeRule({ id: 'x-tokens', name: 'Token Efficiency', dimension: 'prompt', passed: tkS >= 60, score: tkS, weight: 10,
    explanation: fC > 0 ? `~${estTk} tokens, ${fC} filler(s).${estTk > 4000 ? ' Over 4K limit.' : ''}` : estTk > 4000 ? `~${estTk} tokens — over 4K.` : `~${estTk} tokens — efficient.`,
    suggestion: tkS >= 60 ? undefined : fC > 0 ? 'Remove filler phrases.' : 'Condense to stay under 4K.' }));

  // Compute dimensions
  const byDim: Record<string, RuleResult[]> = {};
  for (const d of ['prompt','memory','context','trust','privacy','security']) byDim[d] = [];
  for (const r of rules) byDim[r.dimension].push(r);

  const dimensions: Record<string, DimensionResult> = {};
  let totalWeighted = 0;

  for (const [key, dimRules] of Object.entries(byDim)) {
    let sw = 0, tw = 0, pc = 0;
    for (const r of dimRules) {
      if (r.score > 0) { sw += r.score * r.weight; tw += r.weight; }
      if (r.passed) pc++;
    }
    const raw = tw > 0 ? Math.round(sw / tw) : 40;
    const adj = Math.max(raw, 40);
    dimensions[key] = { key, name: DIM_NAMES[key], score: adj, passed: adj >= 60, factorsCount: dimRules.length, passedCount: pc };
    totalWeighted += adj * DIM_WEIGHTS[key];
  }

  const overall = Math.round(totalWeighted);
  const recs: string[] = [];
  for (const r of rules) {
    if (!r.passed && r.suggestion) {
      recs.push(`${r.severity === 'critical' ? '[CRITICAL] ' : r.severity === 'major' ? '[MAJOR] ' : ''}${r.suggestion}`);
    }
  }

  return {
    overallScore: overall, passed: overall >= 60, dimensions,
    rules, recommendations: recs,
    metadata: { charCount: p.length, wordCount: p.trim() ? p.trim().split(/\s+/).length : 0, timestamp: Date.now() }
  };
}
