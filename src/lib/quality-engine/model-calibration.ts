export interface ModelRecommendation {
  model: string;
  fit: 'excellent' | 'good' | 'fair' | 'poor';
  reason: string;
}

export function calibratePrompt(prompt: string): ModelRecommendation[] {
  const p = prompt.toLowerCase();

  const codeIndicators = /(?:code|function|class|api|endpoint|json|sql|regex|debug|algorithm|syntax|refactor|typescript|python|javascript|import|export|const|let|var|def |impl|trait)/i;
  const creativeIndicators = /(?:story|poem|creative|write|narrative|tone|style|voice|metaphor|imagery|engaging|captivat|entertain)/i;
  const reasoningIndicators = /(?:reason|logic|explain why|step.by.step|chain.of.thought|think through|analyze|evaluate|compare|contrast|syllogism|deduce)/i;
  const structuredIndicators = /(?:json|table|csv|format|schema|structured|parse|extract|classify|categorize|transform|map|filter|match)/i;
  const longContextIndicators = /(?:long|lengthy|extensive|large|full|complete|entire|whole|comprehensive|document|book|report|many pages|long.term|memory|history|chat)/i;
  const creativeWritingIndicators = /(?:creative|story|narrative|dialogue|script|scene|character|plot|describe|imaginative)/i;
  const safetyIndicators = /(?:safety|harm|toxic|filter|moderate|guardrail|abuse|hate|offensive|inappropriate|dangerous|illegal|unethical)/i;
  const multilingualIndicators = /(?:translate|language|french|spanish|german|chinese|japanese|hindi|arabic|multilingual|english|foreign)/i;

  const isCode = codeIndicators.test(p);
  const isCreative = creativeIndicators.test(p);
  const isReasoning = reasoningIndicators.test(p);
  const isStructured = structuredIndicators.test(p);
  const isLong = longContextIndicators.test(p) || p.length > 2000;
  const isCreativeWriting = creativeWritingIndicators.test(p);
  const isSafety = safetyIndicators.test(p);
  const isMultilingual = multilingualIndicators.test(p);

  const results: ModelRecommendation[] = [];

  // Claude — strong at code, reasoning, creative writing, structured output
  let claudeFit: 'excellent' | 'good' | 'fair' | 'poor' = 'good';
  const claudeReasons: string[] = [];
  if (isCode) { claudeFit = 'excellent'; claudeReasons.push('top-tier code generation'); }
  if (isReasoning) { claudeFit = 'excellent'; claudeReasons.push('strong step-by-step reasoning'); }
  if (isCreativeWriting) { claudeReasons.push('good creative writing with nuance'); }
  if (isSafety) { claudeReasons.push('industry-leading safety guardrails'); }
  if (isLong) { claudeReasons.push('supports 200K token context'); }
  if (isStructured && !isCode) claudeReasons.push('handles structured output well');
  if (isMultilingual) claudeReasons.push('strong multilingual support');
  if (claudeReasons.length === 0) claudeReasons.push('versatile general performance');
  results.push({ model: 'Claude', fit: claudeFit, reason: claudeReasons.join(', ') });

  // GPT-4o — strong all-rounder, creative, structured
  let gptFit: 'excellent' | 'good' | 'fair' | 'poor' = 'good';
  const gptReasons: string[] = [];
  if (isCreative) { gptFit = 'excellent'; gptReasons.push('excels at creative generation'); }
  if (isStructured) { gptReasons.push('strong JSON/structured output'); }
  if (isCode && !isReasoning) gptReasons.push('solid code generation');
  if (isReasoning) gptReasons.push('good reasoning with chain-of-thought');
  if (isMultilingual) { gptFit = 'excellent'; gptReasons.push('best-in-class multilingual'); }
  if (gptReasons.length === 0) gptReasons.push('strong all-rounder');
  results.push({ model: 'GPT-4o', fit: gptFit, reason: gptReasons.join(', ') });

  // Gemini — long context, multilingual, reasoning
  let gemFit: 'excellent' | 'good' | 'fair' | 'poor' = 'good';
  const gemReasons: string[] = [];
  if (isLong) { gemFit = 'excellent'; gemReasons.push('1M token context window'); }
  if (isMultilingual) { gemFit = 'excellent'; gemReasons.push('native multilingual (Mega)'); }
  if (isReasoning) gemReasons.push('strong reasoning');
  if (isStructured) gemReasons.push('handles structured tasks');
  if (isCreative) gemReasons.push('good creative ability');
  if (gemReasons.length === 0) gemReasons.push('fast & capable across tasks');
  results.push({ model: 'Gemini', fit: gemFit, reason: gemReasons.join(', ') });

  // DeepSeek — strong at code, reasoning
  let deepFit: 'excellent' | 'good' | 'fair' | 'poor' = 'fair';
  const deepReasons: string[] = [];
  if (isCode) { deepFit = 'excellent'; deepReasons.push('top-tier code (R1)'); }
  if (isReasoning) { deepFit = 'excellent'; deepReasons.push('expert-level reasoning (R1)'); }
  if (isStructured) deepReasons.push('handles structured output');
  if (isLong) deepReasons.push('128K context');
  if (deepReasons.length === 0) deepReasons.push('general capability');
  results.push({ model: 'DeepSeek', fit: deepFit, reason: deepReasons.join(', ') });

  results.sort((a, b) => {
    const rank = { excellent: 4, good: 3, fair: 2, poor: 1 };
    return rank[b.fit] - rank[a.fit];
  });

  return results;
}
