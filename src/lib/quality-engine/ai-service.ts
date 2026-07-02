type AIServiceProvider = 'openai' | 'anthropic' | 'perplexity' | 'openrouter' | 'gemini' | 'huggingface';

interface AIServiceConfig {
  provider: AIServiceProvider;
  openaiKey: string;
  openaiModel: string;
  anthropicKey: string;
  anthropicModel: string;
  perplexityKey: string;
  perplexityModel: string;
  openrouterKey: string;
  openrouterModel: string;
  geminiKey: string;
  hfToken: string;
}

function getConfig(): AIServiceConfig {
  let openaiKey = '';
  let openaiModel = 'gpt-4o';
  let anthropicKey = '';
  let anthropicModel = 'claude-3-5-sonnet-20241022';
  let perplexityKey = '';
  let perplexityModel = 'sonar-pro';
  let openrouterKey = '';
  let openrouterModel = 'openai/gpt-4o';
  let geminiKey = '';
  let hfToken = '';
  try {
    openaiKey = localStorage.getItem('aiq_openai_key') || '';
    openaiModel = localStorage.getItem('aiq_openai_model') || 'gpt-4o';
    anthropicKey = localStorage.getItem('aiq_anthropic_key') || '';
    anthropicModel = localStorage.getItem('aiq_anthropic_model') || 'claude-3-5-sonnet-20241022';
    perplexityKey = localStorage.getItem('aiq_perplexity_key') || '';
    perplexityModel = localStorage.getItem('aiq_perplexity_model') || 'sonar-pro';
    openrouterKey = localStorage.getItem('aiq_openrouter_key') || '';
    openrouterModel = localStorage.getItem('aiq_openrouter_model') || 'openai/gpt-4o';
    geminiKey = localStorage.getItem('aiq_gemini_api_key') || '';
    hfToken = localStorage.getItem('aiq_hf_token') || '';
  } catch {}
  let provider: AIServiceProvider = 'huggingface';
  if (openaiKey) provider = 'openai';
  else if (anthropicKey) provider = 'anthropic';
  else if (perplexityKey) provider = 'perplexity';
  else if (openrouterKey) provider = 'openrouter';
  else if (geminiKey) provider = 'gemini';
  else if (hfToken) provider = 'huggingface';
  return { provider, openaiKey, openaiModel, anthropicKey, anthropicModel, perplexityKey, perplexityModel, openrouterKey, openrouterModel, geminiKey, hfToken };
}

function cleanResponse(text: string): string {
  let resultText = text.trim();
  if (resultText.startsWith('```') && resultText.endsWith('```')) {
    const firstLineEnd = resultText.indexOf('\n');
    resultText = resultText.substring(firstLineEnd + 1, resultText.length - 3).trim();
  } else if (resultText.startsWith('```') && resultText.endsWith('`')) {
    const firstLineEnd = resultText.indexOf('\n');
    resultText = resultText.substring(firstLineEnd + 1, resultText.length - 1).trim();
  }
  return resultText;
}

function buildSystemPrompt(failedRuleSuggestions: string[]): string {
  const failedInstructions = failedRuleSuggestions.map(s => `- ${s}`).join('\n');
  return `You are a Senior Prompt Engineer. Rewrite the prompt to fix these failed constraints:
${failedInstructions}

Enhancement pipeline:
1. Assess platform (web/mobile/desktop), page type, visual style, UI components.
2. Replace vague terms with specific UI/UX component names.
3. Structure content with clear sections or numbered steps.
4. Include design context (colors, hex values, functional roles).
5. Use standard UI/UX terminology (call-to-action, hero section, card grid).

Integrate fixes naturally without losing original intent, variables ({{var}}, [var]), or core instructions. Do not add conversational intro/outro. Respond ONLY with the raw rewritten prompt.`;
}

// --- OpenAI Provider ---

async function callOpenAI(
  apiKey: string,
  model: string,
  prompt: string,
  systemInstructions: string,
  maxTokens: number = 1024
): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemInstructions },
        { role: 'user', content: `Original Prompt:\n"""\n${prompt}\n"""` }
      ],
      max_tokens: maxTokens,
      temperature: 0.2
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API error (${model}): ${response.status} - ${errText.slice(0, 200)}`);
  }

  const result = await response.json();
  const text = result?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Invalid OpenAI response structure');
  return cleanResponse(text);
}

// --- Anthropic Provider ---

async function callAnthropic(
  apiKey: string,
  model: string,
  prompt: string,
  systemInstructions: string,
  maxTokens: number = 1024
): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: systemInstructions,
      messages: [
        { role: 'user', content: `Original Prompt:\n"""\n${prompt}\n"""` }
      ],
      temperature: 0.2
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Anthropic API error (${model}): ${response.status} - ${errText.slice(0, 200)}`);
  }

  const result = await response.json();
  const text = result?.content?.[0]?.text;
  if (!text) throw new Error('Invalid Anthropic response structure');
  return cleanResponse(text);
}

// --- Perplexity Provider ---

async function callPerplexity(
  apiKey: string,
  model: string,
  prompt: string,
  systemInstructions: string,
  maxTokens: number = 1024
): Promise<string> {
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemInstructions },
        { role: 'user', content: `Original Prompt:\n"""\n${prompt}\n"""` }
      ],
      max_tokens: maxTokens,
      temperature: 0.2
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Perplexity API error (${model}): ${response.status} - ${errText.slice(0, 200)}`);
  }

  const result = await response.json();
  const text = result?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Invalid Perplexity response structure');
  return cleanResponse(text);
}

// --- Gemini Provider ---

async function callGemini(
  apiKey: string,
  prompt: string,
  systemInstructions: string,
  maxTokens: number = 1024
): Promise<string> {
  const model = 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        role: 'user',
        parts: [{ text: `${systemInstructions}\n\nOriginal Prompt:\n"""\n${prompt}\n"""` }]
      }],
      generationConfig: { maxOutputTokens: maxTokens, temperature: 0.2 }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errText.slice(0, 200)}`);
  }

  const result = await response.json();
  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Invalid Gemini response structure');
  return cleanResponse(text);
}

// --- OpenRouter Provider ---

async function callOpenRouter(
  apiKey: string,
  model: string,
  prompt: string,
  systemInstructions: string,
  maxTokens: number = 1024
): Promise<string> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'AIQualityHQ'
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemInstructions },
        { role: 'user', content: `Original Prompt:\n"""\n${prompt}\n"""` }
      ],
      max_tokens: maxTokens,
      temperature: 0.2
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter API error (${model}): ${response.status} - ${errText.slice(0, 200)}`);
  }

  const result = await response.json();
  const text = result?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Invalid OpenRouter response structure');
  return cleanResponse(text);
}

// --- HuggingFace Provider ---

const HF_MODELS = {
  light: 'microsoft/Phi-3-mini-4k-instruct',
  medium: 'Qwen/Qwen2.5-7B-Instruct',
  heavy: 'meta-llama/Llama-3.2-3B-Instruct',
} as const;

async function callHuggingFace(
  model: string,
  prompt: string,
  systemInstructions: string,
  maxTokens: number = 1024
): Promise<string> {
  const url = `https://api-inference.huggingface.co/models/${model}`;
  const isQwen = model.includes('Qwen');
  const promptFormat = isQwen
    ? `<|im_start|>system\n${systemInstructions}<|im_end|>\n<|im_start|>user\nOriginal Prompt:\n"""\n${prompt}\n"""<|im_end|>\n<|im_start|>assistant\n`
    : `${systemInstructions}\n\nOriginal Prompt:\n"""\n${prompt}\n"""`;

  let hfToken = '';
  try { hfToken = localStorage.getItem('aiq_hf_token') || ''; } catch {}
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (hfToken?.trim()) headers['Authorization'] = `Bearer ${hfToken.trim()}`;

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      inputs: promptFormat,
      parameters: { max_new_tokens: maxTokens, temperature: 0.2, return_full_text: false }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Hugging Face API error (${model}): ${response.status} - ${errText.slice(0, 200)}`);
  }

  const result = await response.json();
  let generatedText = "";
  if (Array.isArray(result) && result[0]?.generated_text) generatedText = result[0].generated_text;
  else if (result.generated_text) generatedText = result.generated_text;
  else throw new Error("Invalid response structure from Hugging Face API");

  if (isQwen) {
    const marker = "<|im_start|>assistant\n";
    const idx = generatedText.indexOf(marker);
    if (idx !== -1) generatedText = generatedText.substring(idx + marker.length);
    generatedText = generatedText.replace(/<\|im_end\|>$/, "");
  }

  return cleanResponse(generatedText);
}

async function tryHfModels(
  models: readonly string[],
  prompt: string,
  systemInstructions: string,
  maxTokens: number = 1024
): Promise<string> {
  const errors: string[] = [];
  for (const model of models) {
    try {
      return await callHuggingFace(model, prompt, systemInstructions, maxTokens);
    } catch (e) {
      errors.push(`  ${model}: ${e instanceof Error ? e.message : 'unknown error'}`);
    }
  }
  throw new Error(`All HF models failed:\n${errors.join('\n')}`);
}

// --- Unified routing helpers ---

async function tryStringRequest(
  prompt: string,
  systemInstructions: string,
  maxTokens: number
): Promise<string | null> {
  const config = getConfig();

  if (config.openaiKey) {
    try { return await callOpenAI(config.openaiKey, config.openaiModel, prompt, systemInstructions, maxTokens); }
    catch (e) { console.warn('OpenAI failed:', e); }
  }
  if (config.anthropicKey) {
    try { return await callAnthropic(config.anthropicKey, config.anthropicModel, prompt, systemInstructions, maxTokens); }
    catch (e) { console.warn('Anthropic failed:', e); }
  }
  if (config.perplexityKey) {
    try { return await callPerplexity(config.perplexityKey, config.perplexityModel, prompt, systemInstructions, maxTokens); }
    catch (e) { console.warn('Perplexity failed:', e); }
  }
  if (config.openrouterKey) {
    try { return await callOpenRouter(config.openrouterKey, config.openrouterModel, prompt, systemInstructions, maxTokens); }
    catch (e) { console.warn('OpenRouter failed:', e); }
  }
  if (config.geminiKey) {
    try { return await callGemini(config.geminiKey, prompt, systemInstructions, maxTokens); }
    catch (e) { console.warn('Gemini failed:', e); }
  }
  if (config.hfToken) {
    try { return await tryHfModels([HF_MODELS.medium, HF_MODELS.light], prompt, systemInstructions, maxTokens); }
    catch (e) { console.warn('HuggingFace failed:', e); }
  }
  return null;
}

async function callAI(
  prompt: string,
  systemInstructions: string,
  maxTokens: number = 1024
): Promise<string> {
  const result = await tryStringRequest(prompt, systemInstructions, maxTokens);
  if (result !== null) return result;
  // Last resort: try HF without auth (likely to fail, but quick)
  if (hasApiKeys()) {
    return await tryHfModels([HF_MODELS.light, HF_MODELS.medium, HF_MODELS.heavy], prompt, systemInstructions, maxTokens);
  }
  throw new Error('No API keys configured. Add one in Settings to use AI optimization.');
}

// --- Public API ---

export function hasApiKeys(): boolean {
  const cfg = getConfig();
  return !!(cfg.openaiKey || cfg.anthropicKey || cfg.perplexityKey || cfg.openrouterKey || cfg.geminiKey || cfg.hfToken);
}

export function getActiveProviderLabel(): string {
  const config = getConfig();
  if (config.openaiKey) return `OpenAI (${config.openaiModel})`;
  if (config.anthropicKey) return `Anthropic (${config.anthropicModel})`;
  if (config.perplexityKey) return `Perplexity (${config.perplexityModel})`;
  if (config.openrouterKey) return `OpenRouter (${config.openrouterModel})`;
  if (config.geminiKey) return 'Gemini 2.0 Flash (free tier)';
  if (config.hfToken) return 'Hugging Face (open source)';
  return 'local engine (no API key)';
}

export async function quickAIFix(
  prompt: string,
  failedRuleSuggestions: string[]
): Promise<string> {
  const systemInstructions = buildSystemPrompt(failedRuleSuggestions);
  return await callAI(prompt, systemInstructions, 512);
}

export async function deepAIOptimize(
  prompt: string,
  failedRuleSuggestions: string[]
): Promise<string> {
  const systemInstructions = buildSystemPrompt(failedRuleSuggestions);
  return await callAI(prompt, systemInstructions, 1024);
}
