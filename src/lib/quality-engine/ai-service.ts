import type { AIAuditResult } from './types';

type AIServiceProvider = 'openai' | 'anthropic' | 'perplexity' | 'openrouter' | 'gemini' | 'huggingface' | 'groq' | 'custom';

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
  groqKey: string;
  groqModel: string;
  customEndpoint: string;
  customKey: string;
  customModel: string;
}

function readEnv(key: string): string {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || '';
  }
  return '';
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
  let groqKey = '';
  let groqModel = 'llama3-70b-8192';
  let customEndpoint = '';
  let customKey = '';
  let customModel = '';
  try {
    openaiKey = localStorage.getItem('aiq_openai_key') || readEnv('AIQ_OPENAI_KEY');
    openaiModel = localStorage.getItem('aiq_openai_model') || readEnv('AIQ_OPENAI_MODEL') || 'gpt-4o';
    anthropicKey = localStorage.getItem('aiq_anthropic_key') || readEnv('AIQ_ANTHROPIC_KEY');
    anthropicModel = localStorage.getItem('aiq_anthropic_model') || readEnv('AIQ_ANTHROPIC_MODEL') || 'claude-3-5-sonnet-20241022';
    perplexityKey = localStorage.getItem('aiq_perplexity_key') || readEnv('AIQ_PERPLEXITY_KEY');
    perplexityModel = localStorage.getItem('aiq_perplexity_model') || readEnv('AIQ_PERPLEXITY_MODEL') || 'sonar-pro';
    openrouterKey = localStorage.getItem('aiq_openrouter_key') || readEnv('AIQ_OPENROUTER_KEY');
    openrouterModel = localStorage.getItem('aiq_openrouter_model') || readEnv('AIQ_OPENROUTER_MODEL') || 'openai/gpt-4o';
    geminiKey = localStorage.getItem('aiq_gemini_api_key') || readEnv('AIQ_GEMINI_KEY');
    hfToken = localStorage.getItem('aiq_hf_token') || readEnv('AIQ_HF_TOKEN');
    groqKey = localStorage.getItem('aiq_groq_key') || readEnv('AIQ_GROQ_KEY');
    groqModel = localStorage.getItem('aiq_groq_model') || readEnv('AIQ_GROQ_MODEL') || 'llama3-70b-8192';
    customEndpoint = localStorage.getItem('aiq_custom_endpoint') || readEnv('AIQ_CUSTOM_ENDPOINT');
    customKey = localStorage.getItem('aiq_custom_key') || readEnv('AIQ_CUSTOM_KEY');
    customModel = localStorage.getItem('aiq_custom_model') || readEnv('AIQ_CUSTOM_MODEL') || 'gpt-4o-mini';
  } catch {}
  let provider: AIServiceProvider = 'huggingface';
  const preferred = getPreferredProvider();
  const preferredHasKey = preferred === 'openai' ? !!openaiKey
    : preferred === 'anthropic' ? !!anthropicKey
    : preferred === 'perplexity' ? !!perplexityKey
    : preferred === 'openrouter' ? !!openrouterKey
    : preferred === 'gemini' ? !!geminiKey
    : preferred === 'huggingface' ? !!hfToken
    : preferred === 'groq' ? !!groqKey
    : preferred === 'custom' ? !!customEndpoint
    : false;
  if (preferred && preferredHasKey) {
    provider = preferred as AIServiceProvider;
  } else if (openaiKey) provider = 'openai';
  else if (anthropicKey) provider = 'anthropic';
  else if (perplexityKey) provider = 'perplexity';
  else if (openrouterKey) provider = 'openrouter';
  else if (geminiKey) provider = 'gemini';
  else if (groqKey) provider = 'groq';
  else if (hfToken) provider = 'huggingface';
  else if (customEndpoint) provider = 'custom';
  return { provider, openaiKey, openaiModel, anthropicKey, anthropicModel, perplexityKey, perplexityModel, openrouterKey, openrouterModel, geminiKey, hfToken, groqKey, groqModel, customEndpoint, customKey, customModel };
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
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://www.aiqualityhq.com',
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

// --- Groq Provider ---

async function callGroq(
  apiKey: string,
  model: string,
  prompt: string,
  systemInstructions: string,
  maxTokens: number = 1024
): Promise<string> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
    throw new Error(`Groq API error (${model}): ${response.status} - ${errText.slice(0, 200)}`);
  }

  const result = await response.json();
  const text = result?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Invalid Groq response structure');
  return cleanResponse(text);
}

// --- Custom OpenAI-Compatible Endpoint ---

async function callCustomEndpoint(
  endpoint: string,
  apiKey: string,
  model: string,
  prompt: string,
  systemInstructions: string,
  maxTokens: number = 1024
): Promise<string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

  const response = await fetch(endpoint.replace(/\/$/, '') + '/chat/completions', {
    method: 'POST',
    headers,
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
    throw new Error(`Custom endpoint error (${model}): ${response.status} - ${errText.slice(0, 200)}`);
  }

  const result = await response.json();
  const text = result?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Invalid response from custom endpoint');
  return cleanResponse(text);
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
  if (config.groqKey) {
    try { return await callGroq(config.groqKey, config.groqModel, prompt, systemInstructions, maxTokens); }
    catch (e) { console.warn('Groq failed:', e); }
  }
  if (config.hfToken) {
    try { return await tryHfModels([HF_MODELS.medium, HF_MODELS.light], prompt, systemInstructions, maxTokens); }
    catch (e) { console.warn('HuggingFace failed:', e); }
  }
  if (config.customEndpoint) {
    try { return await callCustomEndpoint(config.customEndpoint, config.customKey, config.customModel, prompt, systemInstructions, maxTokens); }
    catch (e) { console.warn('Custom endpoint failed:', e); }
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

// --- Provider Selection ---

export const PROVIDERS: { id: AIServiceProvider; label: string; keyLabel: string }[] = [
  { id: 'openai', label: 'OpenAI', keyLabel: 'GPT-4o' },
  { id: 'anthropic', label: 'Anthropic', keyLabel: 'Claude 3.5 Sonnet' },
  { id: 'perplexity', label: 'Perplexity', keyLabel: 'Sonar Pro' },
  { id: 'openrouter', label: 'OpenRouter', keyLabel: 'Multi-model' },
  { id: 'gemini', label: 'Gemini', keyLabel: '2.0 Flash' },
  { id: 'groq', label: 'Groq', keyLabel: 'Open source (fast)' },
  { id: 'huggingface', label: 'Hugging Face', keyLabel: 'Open source' },
  { id: 'custom', label: 'Custom Endpoint', keyLabel: 'OpenAI-compatible' },
];

export function getAvailableProviders(): { id: AIServiceProvider; label: string; hasKey: boolean }[] {
  const cfg = getConfig();
  return [
    { id: 'openai', label: 'OpenAI', hasKey: !!cfg.openaiKey },
    { id: 'anthropic', label: 'Anthropic', hasKey: !!cfg.anthropicKey },
    { id: 'perplexity', label: 'Perplexity', hasKey: !!cfg.perplexityKey },
    { id: 'openrouter', label: 'OpenRouter', hasKey: !!cfg.openrouterKey },
    { id: 'gemini', label: 'Gemini', hasKey: !!cfg.geminiKey },
    { id: 'groq', label: 'Groq', hasKey: !!cfg.groqKey },
    { id: 'huggingface', label: 'Hugging Face', hasKey: !!cfg.hfToken },
    { id: 'custom', label: 'Custom Endpoint', hasKey: !!cfg.customEndpoint },
  ];
}

export function getPreferredProvider(): string {
  try { return localStorage.getItem('aiq_preferred_provider') || ''; } catch { return ''; }
}

export function setPreferredProvider(provider: string): void {
  try { localStorage.setItem('aiq_preferred_provider', provider); } catch {}
}

// --- Public API ---

export function hasApiKeys(): boolean {
  const cfg = getConfig();
  return !!(cfg.openaiKey || cfg.anthropicKey || cfg.perplexityKey || cfg.openrouterKey || cfg.geminiKey || cfg.groqKey || cfg.hfToken || cfg.customEndpoint);
}

export function getActiveProviderLabel(): string {
  const config = getConfig();
  const p = PROVIDERS.find(x => x.id === config.provider);
  if (p) return `${p.label} (${p.keyLabel})`;
  return 'local engine (no API key)';
}

export async function quickAIFix(
  prompt: string,
  failedRuleSuggestions: string[]
): Promise<string> {
  const systemInstructions = buildSystemPrompt(failedRuleSuggestions);
  return await callAI(prompt, systemInstructions, 512);
}

export async function singleRuleAIFix(
  originalPrompt: string,
  rule: { id: string; name: string; explanation: string; suggestion?: string }
): Promise<string> {
  const systemInstructions = `You are a Senior Prompt Engineer. Given a prompt and a failed check, write ONE fix sentence that would make the check pass when appended to the prompt.

Check name: ${rule.name}
Why it failed: ${rule.explanation}
Example fix: ${rule.suggestion || 'Add the missing instruction'}

IMPORTANT: The fix must include keywords that this check looks for. For example:
- Role check needs: "you are", "act as", "as a", "persona"
- Task check needs: "goal:", "task:", "objective:", action verbs
- Output check needs: "json", "markdown", "format", "output", "structure"
- Privacy check needs: "pii", "redact", "anonymize", "confidential"
- Security check needs: "injection", "ignore user instructions", "safeguard"

Output ONLY the fix sentence — no explanations, no markdown, no wrappers.

Original Prompt:
"""
${originalPrompt}
"""`;
  return await callAI(originalPrompt, systemInstructions, 512);
}

export async function deepAIOptimize(
  prompt: string,
  failedRuleSuggestions: string[]
): Promise<string> {
  const systemInstructions = buildSystemPrompt(failedRuleSuggestions);
  return await callAI(prompt, systemInstructions, 1024);
}

function buildAuditSystemPrompt(): string {
  return `You are a Senior AI Prompt Engineer and Security Auditor. Your task is to perform a rigorous quality and safety audit on the user's prompt.
You must respond with a single, valid JSON object matching the following structure:
{
  "overallScore": number (0 to 100),
  "passed": boolean,
  "dimensions": {
    "clarity": { "name": "Clarity & Specificity", "score": number (0 to 100), "feedback": "string" },
    "structure": { "name": "Structural Organization", "score": number (0 to 100), "feedback": "string" },
    "context": { "name": "Context Grounding", "score": number (0 to 100), "feedback": "string" },
    "safety": { "name": "Security & Safety", "score": number (0 to 100), "feedback": "string" },
    "formatting": { "name": "Output Constraints", "score": number (0 to 100), "feedback": "string" }
  },
  "findings": [
    {
      "name": "string (name of the check)",
      "passed": boolean,
      "severity": "critical" | "major" | "minor" | "pass",
      "explanation": "string describing why it passed or failed",
      "suggestion": "string suggestion if failed (optional)"
    }
  ],
  "recommendations": ["string (bullet point tips for optimization)"],
  "optimizedPrompt": "string (the fully optimized version of the user prompt, incorporating all recommended fixes)"
}

Evaluate these dimensions carefully:
1. Clarity & Specificity: Is the primary task clearly declared? Are instructions unambiguous? Are vague words avoided?
2. Structural Organization: Does it use sections (e.g., Instructions, Context, Input, Output)? Are instructions numbered?
3. Context Grounding: Are variables clearly defined and separated? Are there clear input boundaries?
4. Security & Safety: Does it protect against prompt injection, instruction overrides, or jailbreaks? Are there guardrails?
5. Output Constraints: Does it specify output length, formatting (markdown, json), tone/style, or fallback behaviors?

Do not include any pre-text, post-text, markdown blocks, or commentary in your response outside the JSON. Respond ONLY with raw, valid JSON.`;
}

export async function runAIPromptAudit(prompt: string): Promise<AIAuditResult> {
  const systemInstructions = buildAuditSystemPrompt();
  // We use callAI with a larger token limit (2048) to allow a complete JSON audit report + optimized prompt
  const rawResponse = await callAI(prompt, systemInstructions, 2048);
  
  try {
    // Strip possible markdown json wrap that wasn't cleaned by cleanResponse
    let jsonText = rawResponse.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.substring(7);
    }
    if (jsonText.endsWith('```')) {
      jsonText = jsonText.substring(0, jsonText.length - 3);
    }
    jsonText = jsonText.trim();

    const parsed = JSON.parse(jsonText) as AIAuditResult;
    parsed.metadata = {
      model: getActiveProviderLabel(),
      timestamp: Date.now(),
      charCount: prompt.length,
      wordCount: prompt.trim() === '' ? 0 : prompt.trim().split(/\s+/).length
    };
    return parsed;
  } catch (err) {
    console.error("Failed to parse AI Audit JSON response:", rawResponse, err);
    throw new Error("The AI returned an invalid audit report format. Please try again.");
  }
}
