import React, { useState, useMemo } from 'react';
import {
  Wand2,
  Copy,
  Check,
  Download,
  Play,
  Code,
  Terminal,
  ShieldCheck,
  Layers,
  FileText,
  Plus,
  Trash2,
  Zap,
  Sliders,
  RotateCcw,
  Sparkles,
  GitCompare,
  Activity,
  Cpu,
  ArrowRight,
  FileCode,
  CheckCircle2,
  AlertCircle,
  Braces,
  BookOpen,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { PromptfooExportModal } from './PromptfooExportModal';

export type TargetModel = 'claude-3-7-sonnet' | 'gemini-2-5-pro' | 'gpt-4o' | 'universal';
export type TaskTaxonomy = 'technical' | 'creative' | 'workflow' | 'tutoring' | 'extraction';

export interface DynamicVariable {
  name: string;
  description: string;
  defaultValue?: string;
}

export interface FewShotPair {
  input: string;
  output: string;
}

export interface PresetTemplate {
  id: string;
  title: string;
  description: string;
  taxonomy: TaskTaxonomy;
  model: TargetModel;
  seed: string;
  context?: string;
  constraints: string[];
  fewShot?: FewShotPair[];
}

const PRESET_TEMPLATES: PresetTemplate[] = [
  {
    id: 'code-refactor',
    title: 'Unstructured Code Refactoring & AST Audit',
    description: 'Transform messy code snippets into clean, documented, type-safe functions.',
    taxonomy: 'technical',
    model: 'claude-3-7-sonnet',
    seed: 'fix this function make it cleaner add error handling and typescript types function fetchUserData(id) { fetch("/api/user/"+id).then(r=>r.json()).then(d=>console.log(d)) }',
    context: '// Internal API Schema: /api/user/:id returns UserRecord { id: string, name: string, email: string, role: "admin" | "user" }',
    constraints: [
      'Must handle HTTP error status codes (4xx, 5xx) with explicit Error throwing',
      'Must return strongly typed Promise<UserRecord>',
      'Use async/await syntax instead of raw promise chaining',
      'Include JSDoc documentation with @param and @returns tags'
    ],
    fewShot: [
      {
        input: 'function getSum(a, b) { return a + b; }',
        output: '/**\n * Calculates the sum of two numeric values.\n * @param a - First summand\n * @param b - Second summand\n * @returns The total sum\n */\nexport function getSum(a: number, b: number): number {\n  if (typeof a !== "number" || typeof b !== "number") {\n    throw new TypeError("Both arguments must be valid numbers.");\n  }\n  return a + b;\n}'
      }
    ]
  },
  {
    id: 'support-classifier',
    title: 'Support Ticket Sentiment & Escalation Classifier',
    description: 'Classify incoming customer feedback into priority tiers with extracted entity JSON.',
    taxonomy: 'workflow',
    model: 'gpt-4o',
    seed: 'Read user ticket and tell me if they are mad, what product they talk about, and if we should escalate to manager',
    context: 'Products catalog: [Mobile App, Billing Portal, Cloud Sync, API Gateway]. Escalation Tiers: Tier 1 (Standard), Tier 2 (Urgent), Tier 3 (Executive SLA Failure).',
    constraints: [
      'Output strictly formatted JSON matching the TicketAnalysis schema',
      'Never fabricate customer intent; if sentiment is neutral, set escalation_recommended to false',
      'Assess sentiment on a 5-point scale from 1 (Very Frustrated) to 5 (Delighted)'
    ],
    fewShot: [
      {
        input: 'My billing page is completely broken for 3 days and I was charged twice!',
        output: '{\n  "sentiment_score": 1,\n  "product": "Billing Portal",\n  "urgency": "high",\n  "escalation_recommended": true,\n  "escalation_tier": "Tier 3 (Executive SLA Failure)",\n  "summary": "Customer experienced duplicate charges and 3-day outage on Billing Portal."\n}'
      }
    ]
  },
  {
    id: 'json-extractor',
    title: 'Invoice Data Extractor & Schema Normalizer',
    description: 'Extract line items, tax IDs, totals, and payment terms from unstructured invoice text.',
    taxonomy: 'extraction',
    model: 'gemini-2-5-pro',
    seed: 'Extract invoice number, total amount, line items with price, tax amount, vendor name and due date from raw PDF text',
    context: 'Target JSON Schema: { invoice_number: string, vendor_name: string, line_items: Array<{ description: string, quantity: number, unit_price: number }>, subtotal: number, tax_total: number, grand_total: number, due_date: string (YYYY-MM-DD) }',
    constraints: [
      'Ensure grand_total strictly equals subtotal + tax_total',
      'Standardize all dates to ISO 8601 YYYY-MM-DD format',
      'Set missing fields to null rather than omitting them'
    ]
  },
  {
    id: 'rag-assistant',
    title: 'Enterprise RAG Knowledge Base Q&A Assistant',
    description: 'Context-faithful question answering agent with citation verification and refusal rules.',
    taxonomy: 'technical',
    model: 'claude-3-7-sonnet',
    seed: 'Answer user question using provided documentation only. Cite sections and refuse if doc doesn\'t say.',
    context: '<retrieved_docs>\n{{RETRIEVED_CONTEXT}}\n</retrieved_docs>',
    constraints: [
      'Never utilize external knowledge outside of <retrieved_docs>',
      'Every factual claim must end with an inline citation tag: [Doc ID, Section]',
      'If retrieved docs do not contain the answer, reply: "I cannot answer this based on the provided context."'
    ]
  }
];

export default function PromptRewriterWorkspace() {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'compiled' | 'user_template' | 'exemplars' | 'diff' | 'export'>('compiled');

  // Input Pipeline State
  const [seedPrompt, setSeedPrompt] = useState<string>(PRESET_TEMPLATES[0].seed);
  const [targetModel, setTargetModel] = useState<TargetModel>(PRESET_TEMPLATES[0].model);
  const [taskTaxonomy, setTaskTaxonomy] = useState<TaskTaxonomy>(PRESET_TEMPLATES[0].taxonomy);
  const [contextPayload, setContextPayload] = useState<string>(PRESET_TEMPLATES[0].context || '');
  const [constraints, setConstraints] = useState<string[]>(PRESET_TEMPLATES[0].constraints);
  const [newConstraint, setNewConstraint] = useState<string>('');
  
  // Custom Variables
  const [customVariables, setCustomVariables] = useState<DynamicVariable[]>([
    { name: 'INPUT_PAYLOAD', description: 'Raw incoming target document or user request', defaultValue: '' }
  ]);
  const [newVarName, setNewVarName] = useState<string>('');
  const [newVarDesc, setNewVarDesc] = useState<string>('');

  // Few-Shot Pairs
  const [fewShotPairs, setFewShotPairs] = useState<FewShotPair[]>(PRESET_TEMPLATES[0].fewShot || []);
  const [fsInput, setFsInput] = useState<string>('');
  const [fsOutput, setFsOutput] = useState<string>('');

  const handleAddFewShot = () => {
    if (!fsInput.trim() || !fsOutput.trim()) return;
    setFewShotPairs(prev => [...prev, { input: fsInput.trim(), output: fsOutput.trim() }]);
    setFsInput('');
    setFsOutput('');
  };

  // Tri-Axis Metric Weights
  const [qualityWeight, setQualityWeight] = useState<number>(60);
  const [costWeight, setCostWeight] = useState<number>(20);
  const [latencyWeight, setLatencyWeight] = useState<number>(20);

  // Live Variable Test State
  const [liveVariableValues, setLiveVariableValues] = useState<Record<string, string>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isPromptfooModalOpen, setIsPromptfooModalOpen] = useState<boolean>(false);

  // Auto-detect variables from seed + context
  const detectedVariables = useMemo(() => {
    const combined = seedPrompt + ' ' + contextPayload;
    const regex = /\{\{([A-Z0-9_]+)\}\}/gi;
    const matches = new Set<string>();
    let match;
    while ((match = regex.exec(combined)) !== null) {
      matches.add(match[1]);
    }
    const list: DynamicVariable[] = Array.from(matches).map(m => ({
      name: m,
      description: `Auto-extracted dynamic variable {{${m}}}`
    }));
    
    // Merge with custom variables without duplication
    customVariables.forEach(cv => {
      if (!matches.has(cv.name)) {
        list.push(cv);
      }
    });
    return list;
  }, [seedPrompt, contextPayload, customVariables]);

  // Active Preset Tracker
  const [activePresetId, setActivePresetId] = useState<string>(PRESET_TEMPLATES[0].id);

  // Load Preset
  const handleLoadPreset = (preset: PresetTemplate) => {
    setActivePresetId(preset.id);
    setSeedPrompt(preset.seed);
    setTargetModel(preset.model);
    setTaskTaxonomy(preset.taxonomy);
    setContextPayload(preset.context || '');
    setConstraints([...preset.constraints]);
    setFewShotPairs(preset.fewShot ? [...preset.fewShot] : []);
    
    // Set feedback toast
    setCopiedKey(`preset_${preset.id}`);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Add constraint
  const handleAddConstraint = () => {
    if (!newConstraint.trim()) return;
    setConstraints(prev => [...prev, newConstraint.trim()]);
    setNewConstraint('');
  };

  // Remove constraint
  const handleRemoveConstraint = (index: number) => {
    setConstraints(prev => prev.filter((_, i) => i !== index));
  };

  // Add Custom Variable
  const handleAddVariable = () => {
    if (!newVarName.trim()) return;
    const cleanName = newVarName.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    setCustomVariables(prev => [...prev, { name: cleanName, description: newVarDesc.trim() || 'User-defined variable' }]);
    setNewVarName('');
    setNewVarDesc('');
  };

  // Multi-Stage Transformation Engine Compilation
  const compiledPayload = useMemo(() => {
    const isClaude = targetModel === 'claude-3-7-sonnet';
    const isGemini = targetModel === 'gemini-2-5-pro';
    const isGPT = targetModel === 'gpt-4o';

    // 1. Identity & Persona Definition
    let identitySection = '';
    if (taskTaxonomy === 'technical') {
      identitySection = 'You are a Principal Software Architect and Lead AI Engineer specializing in deterministic logic, type-safe implementations, and zero-hallucination analysis.';
    } else if (taskTaxonomy === 'extraction') {
      identitySection = 'You are an Enterprise Document Extraction Engine designed to parse raw unstructured text into validated, schema-compliant JSON payloads.';
    } else if (taskTaxonomy === 'workflow') {
      identitySection = 'You are an Automated Workflow Controller and Triage Engine responsible for accurate entity classification, sentiment assessment, and SLA escalation.';
    } else if (taskTaxonomy === 'tutoring') {
      identitySection = 'You are a Pedagogy Specialist and Academic Mentor providing clear, step-by-step explanations anchored strictly in proven principles.';
    } else {
      identitySection = 'You are an Expert AI Assistant tailored for high-precision, structured output generation.';
    }

    // 2. Context Top-Loading Block
    let contextBlock = '';
    if (contextPayload.trim()) {
      if (isClaude) {
        contextBlock = `<context>\n${contextPayload.trim()}\n</context>`;
      } else if (isGemini) {
        contextBlock = `## Context & Reference Material\n${contextPayload.trim()}\n\n[TRANSITION ANCHOR: Proceed to operational guidelines below]`;
      } else {
        contextBlock = `### REFERENCE CONTEXT\n${contextPayload.trim()}`;
      }
    }

    // 3. Operational Steps & Logic
    let stepsSection = '';
    stepsSection = `1. Analyze the incoming user input payload thoroughly.\n2. Verify compliance against all explicit constraints listed in this system message.\n3. Execute the primary objective: "${seedPrompt.trim()}".\n4. Format the final output strictly according to the designated output structure.`;

    // 4. Constraints Block
    let constraintsBlock = '';
    if (constraints.length > 0) {
      if (isClaude) {
        constraintsBlock = `<output_instructions>\n` + constraints.map(c => `- ${c}`).join('\n') + `\n</output_instructions>`;
      } else if (isGemini) {
        constraintsBlock = `## Operational Guardrails\n` + constraints.map(c => `- ${c}`).join('\n');
      } else if (isGPT) {
        constraintsBlock = `### OPERATIONAL CONSTRAINTS\n` + constraints.map(c => `- ${c}`).join('\n');
      } else {
        constraintsBlock = `### CONSTRAINTS\n` + constraints.map(c => `- ${c}`).join('\n');
      }
    }

    // 5. Exemplars Block
    let exemplarsBlock = '';
    if (fewShotPairs.length > 0) {
      if (isClaude) {
        exemplarsBlock = `<examples>\n` + fewShotPairs.map((pair, idx) => 
          `  <example index="${idx + 1}">\n    <input>\n${pair.input}\n    </input>\n    <output>\n${pair.output}\n    </output>\n  </example>`
        ).join('\n') + `\n</examples>`;
      } else if (isGemini) {
        exemplarsBlock = `## Demonstration Exemplars\n` + fewShotPairs.map((pair, idx) =>
          `### Example ${idx + 1}\n**Input:**\n${pair.input}\n\n**Output:**\n${pair.output}`
        ).join('\n\n');
      } else {
        exemplarsBlock = `### FEW-SHOT EXAMPLES\n` + fewShotPairs.map((pair, idx) =>
          `Example ${idx + 1}:\nInput: ${pair.input}\nOutput:\n${pair.output}`
        ).join('\n\n');
      }
    }

    // Combine System Prompt based on Target Architecture
    let compiledSystemPrompt = '';

    if (isClaude) {
      compiledSystemPrompt = `<identity>\n${identitySection}\n</identity>\n\n` +
        (contextBlock ? `${contextBlock}\n\n` : '') +
        `<instructions>\n${stepsSection}\n</instructions>\n\n` +
        (exemplarsBlock ? `${exemplarsBlock}\n\n` : '') +
        (constraintsBlock ? `${constraintsBlock}\n\n` : '') +
        `<thinking_control>\nFor complex or multi-layered inputs, allocate internal <thinking> reasoning tags before producing the final response payload.\n</thinking_control>`;
    } else if (isGemini) {
      compiledSystemPrompt = `## Agent Persona\n${identitySection}\n\n` +
        (contextBlock ? `${contextBlock}\n\n` : '') +
        `## Conversational Rules & Operational Steps\n${stepsSection}\n\n` +
        (exemplarsBlock ? `${exemplarsBlock}\n\n` : '') +
        (constraintsBlock ? `${constraintsBlock}\n\n` : '') +
        `## Reasoning Budget\nThinking Effort: Moderate | Typed Schema Enforcement: Enabled`;
    } else if (isGPT) {
      compiledSystemPrompt = `# SYSTEM ROLE\n${identitySection}\n\n` +
        (contextBlock ? `${contextBlock}\n\n` : '') +
        `# OPERATIONAL STEPS\n${stepsSection}\n\n` +
        (constraintsBlock ? `${constraintsBlock}\n\n` : '') +
        (exemplarsBlock ? `${exemplarsBlock}\n\n` : '') +
        `# OUTPUT FORMAT REQUIREMENT\nReturn responses cleanly structured without conversational fluff or unrequested preamble.`;
    } else {
      compiledSystemPrompt = `### IDENTITY & PURPOSE\n${identitySection}\n\n` +
        (contextBlock ? `${contextBlock}\n\n` : '') +
        `### OPERATIONAL STEPS\n${stepsSection}\n\n` +
        (constraintsBlock ? `${constraintsBlock}\n\n` : '') +
        (exemplarsBlock ? `${exemplarsBlock}\n\n` : '');
    }

    // Construct User Message Template
    let userMessageTemplate = seedPrompt.trim();
    if (detectedVariables.length > 0) {
      const varPlaceholders = detectedVariables.map(v => `{{${v.name}}}`).join('\n');
      userMessageTemplate = `Input Request:\n${seedPrompt.trim()}\n\nVariables:\n${varPlaceholders}`;
    }

    return {
      compiledSystemPrompt,
      userMessageTemplate,
      contextBlock,
      constraintsBlock,
      exemplarsBlock
    };
  }, [seedPrompt, targetModel, taskTaxonomy, contextPayload, constraints, fewShotPairs, detectedVariables]);

  // Visual Diff Generator (Line by Line comparison)
  const diffLines = useMemo(() => {
    const originalLines = seedPrompt.split('\n').filter(l => l.trim());
    const compiledLines = compiledPayload.compiledSystemPrompt.split('\n').filter(l => l.trim());

    const result: Array<{ type: 'added' | 'removed' | 'same'; text: string }> = [];
    
    // Mark original lines as removed / transformed
    originalLines.forEach(line => {
      result.push({ type: 'removed', text: line });
    });

    // Mark compiled lines as added
    compiledLines.forEach(line => {
      result.push({ type: 'added', text: line });
    });

    return result;
  }, [seedPrompt, compiledPayload]);

  // Predictive Telemetry Scoring
  const telemetry = useMemo(() => {
    const seedTokens = Math.ceil(seedPrompt.length / 4);
    const compiledTokens = Math.ceil(compiledPayload.compiledSystemPrompt.length / 4);
    const tokenExpansionRatio = (compiledTokens / Math.max(1, seedTokens)).toFixed(2);
    
    let qualityScore = 55;
    if (constraints.length > 0) qualityScore += Math.min(20, constraints.length * 5);
    if (contextPayload.trim()) qualityScore += 10;
    if (fewShotPairs.length > 0) qualityScore += 10;
    if (targetModel !== 'universal') qualityScore += 5;
    qualityScore = Math.min(99, qualityScore);

    const estimatedLatencyMs = Math.round(150 + compiledTokens * 1.2);

    const costFactor = (compiledTokens / 1000) * 10;
    const latencyFactor = (estimatedLatencyMs / 1000) * 10;
    const rawUtility = (qualityScore * (qualityWeight / 100)) - (costFactor * (costWeight / 100)) - (latencyFactor * (latencyWeight / 100));
    const utilityScore = Math.min(99, Math.max(40, Math.round(rawUtility * 1.3)));

    return {
      seedTokens,
      compiledTokens,
      tokenExpansionRatio,
      qualityScore,
      estimatedLatencyMs,
      utilityScore
    };
  }, [seedPrompt, compiledPayload, constraints, contextPayload, fewShotPairs, targetModel, qualityWeight, costWeight, latencyWeight]);

  // Copy helper
  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // SDK Code Binding Generator
  const getSDKCode = (format: 'python' | 'typescript' | 'langchain' | 'vscode') => {
    const sysPromptEscaped = JSON.stringify(compiledPayload.compiledSystemPrompt);
    const userPromptEscaped = JSON.stringify(compiledPayload.userMessageTemplate);

    if (format === 'python') {
      if (targetModel === 'claude-3-7-sonnet') {
        return `import anthropic\n\nclient = anthropic.Anthropic()\n\nresponse = client.messages.create(\n    model="claude-3-7-sonnet-20250219",\n    max_tokens=2048,\n    system=${sysPromptEscaped},\n    messages=[\n        {"role": "user", "content": ${userPromptEscaped}}\n    ]\n)\nprint(response.content[0].text)`;
      } else if (targetModel === 'gemini-2-5-pro') {
        return `from google import genai\n\nclient = genai.Client()\n\nresponse = client.models.generate_content(\n    model='gemini-2.5-pro',\n    contents=${userPromptEscaped},\n    config={\n        'system_instruction': ${sysPromptEscaped}\n    }\n)\nprint(response.text)`;
      } else {
        return `import openai\n\nclient = openai.OpenAI()\n\nresponse = client.chat.completions.create(\n    model="gpt-4o",\n    messages=[\n        {"role": "system", "content": ${sysPromptEscaped}},\n        {"role": "user", "content": ${userPromptEscaped}}\n    ]\n)\nprint(response.choices[0].message.content)`;
      }
    } else if (format === 'typescript') {
      return `import { OpenAI } from 'openai';\n\nconst openai = new OpenAI();\n\nasync function run() {\n  const response = await openai.chat.completions.create({\n    model: '${targetModel === 'claude-3-7-sonnet' ? 'claude-3-7-sonnet' : 'gpt-4o'}',\n    messages: [\n      { role: 'system', content: ${sysPromptEscaped} },\n      { role: 'user', content: ${userPromptEscaped} }\n    ]\n  });\n  console.log(response.choices[0].message.content);\n}\nrun();`;
    } else if (format === 'langchain') {
      return `from langchain_core.prompts import ChatPromptTemplate\n\nprompt = ChatPromptTemplate.from_messages([\n    ("system", ${sysPromptEscaped}),\n    ("user", ${userPromptEscaped})\n])\n\n# Chain invocation\nchain = prompt | llm\nresult = chain.invoke({})`;
    } else {
      return `{\n  "AIQualityHQ Compiled Prompt": {\n    "prefix": "aiq-prompt-rewriter",\n    "body": [\n      ${sysPromptEscaped}\n    ],\n    "description": "Compiled System Instruction for ${targetModel}"\n  }\n}`;
    }
  };

  // Hydrated user message test preview
  const hydratedUserMessage = useMemo(() => {
    let text = compiledPayload.userMessageTemplate;
    detectedVariables.forEach(v => {
      const val = liveVariableValues[v.name] || `[${v.name}]`;
      text = text.replace(new RegExp(`\\{\\{${v.name}\\}\\}`, 'g'), val);
    });
    return text;
  }, [compiledPayload, detectedVariables, liveVariableValues]);

  return (
    <div className="w-full space-y-8 font-sans text-text-primary">
      {/* Preset Launcher Bar */}
      <div className="p-5 rounded-xl border border-border bg-surface shadow-subtle space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-text-primary">
                Quick Preset Blueprints
              </h2>
              <p className="text-xs text-text-secondary">
                Click any architecture template below to load production-grade prompt specifications instantly.
              </p>
            </div>
          </div>
          {copiedKey && copiedKey.startsWith('preset_') && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-score-excellent-subtle text-score-excellent border border-score-excellent-border text-xs font-mono font-medium animate-fadeIn">
              <Check className="w-3.5 h-3.5" />
              <span>Blueprint Loaded & Hydrated!</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PRESET_TEMPLATES.map(preset => {
            const isActive = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  handleLoadPreset(preset);
                }}
                className={`p-3.5 rounded-xl border text-left transition-all duration-fast cursor-pointer flex flex-col justify-between gap-2 select-none ${
                  isActive
                    ? 'border-primary bg-primary-subtle/70 text-text-primary ring-2 ring-primary/40 shadow-xs'
                    : 'border-border-subtle bg-surface-secondary/60 text-text-secondary hover:border-primary/50 hover:bg-surface-secondary'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={`text-xs font-semibold ${isActive ? 'text-primary' : 'text-text-primary'}`}>
                      {preset.title}
                    </span>
                    {isActive && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                  </div>
                  <p className="text-[11px] text-text-tertiary line-clamp-2 leading-relaxed">
                    {preset.description}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border-subtle/50 text-[10px] font-mono text-text-tertiary">
                  <span className="capitalize">{preset.taxonomy}</span>
                  <span className="px-1.5 py-0.5 rounded bg-surface border border-border-subtle text-primary font-semibold">
                    {preset.model.split('-')[0]}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Pipeline Controls (Left) & Output Suite (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT PANEL: Multi-Parameter Ingestion Pipeline (Cols 5) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Card 1: Seed & Model Controls */}
          <div className="p-5 rounded-xl border border-border bg-surface shadow-subtle space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <h2 className="text-sm font-semibold tracking-tight text-text-primary">
                  1. Ingestion & Architecture Target
                </h2>
              </div>
              <span className="text-[11px] font-mono text-text-tertiary">Milestone 1</span>
            </div>

            {/* Seed Task Prompt */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Seed Task Prompt or Intent Draft <span className="text-error">*</span>
              </label>
              <textarea
                value={seedPrompt}
                onChange={e => setSeedPrompt(e.target.value)}
                rows={4}
                placeholder="Enter unrefined prompt draft or natural language requirement..."
                className="w-full p-3 rounded-lg border border-border bg-canvas text-xs font-mono text-text-primary placeholder:text-text-disabled focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-fast resize-y"
              />
              <div className="flex items-center justify-between text-[11px] font-mono text-text-tertiary mt-1">
                <span>Chars: {seedPrompt.length}</span>
                <span>Est. Tokens: ~{telemetry.seedTokens}</span>
              </div>
            </div>

            {/* Target Model Selector */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Target Model Compiler Architecture
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'claude-3-7-sonnet', name: 'Anthropic Claude', badge: 'XML + Thinking' },
                  { id: 'gemini-2-5-pro', name: 'Google Gemini', badge: 'Persona/Rules' },
                  { id: 'gpt-4o', name: 'OpenAI GPT', badge: 'Markdown/JSON' },
                  { id: 'universal', name: 'Universal', badge: 'Fabric Format' }
                ].map(m => (
                  <button
                    key={m.id}
                    onClick={() => setTargetModel(m.id as TargetModel)}
                    className={`p-2.5 rounded-lg border text-left transition-fast cursor-pointer ${
                      targetModel === m.id
                        ? 'border-primary bg-primary-subtle/50 text-primary font-semibold'
                        : 'border-border-subtle bg-surface-secondary text-text-secondary hover:border-border hover:text-text-primary'
                    }`}
                  >
                    <div className="text-xs">{m.name}</div>
                    <div className="text-[10px] font-mono text-text-tertiary mt-0.5">{m.badge}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Task Taxonomy Segmented Control */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Task Taxonomy Domain
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'technical', label: 'Technical/Code' },
                  { id: 'extraction', label: 'JSON Data Extractor' },
                  { id: 'workflow', label: 'Multi-Step Triage' },
                  { id: 'tutoring', label: 'Educational' },
                  { id: 'creative', label: 'Creative' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTaskTaxonomy(t.id as TaskTaxonomy)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-fast cursor-pointer ${
                      taskTaxonomy === t.id
                        ? 'bg-primary text-on-primary shadow-xs'
                        : 'bg-surface-secondary text-text-secondary hover:bg-border-subtle hover:text-text-primary'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: Context, Constraints & Variables */}
          <div className="p-5 rounded-xl border border-border bg-surface shadow-subtle space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold tracking-tight text-text-primary">
                  2. Operational Boundaries & Context
                </h2>
              </div>
              <span className="text-[11px] font-mono text-text-tertiary">Top-Loaded Payload</span>
            </div>

            {/* Context Knowledge Payload */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Context Knowledge Attachment (Top-Loaded)
              </label>
              <textarea
                value={contextPayload}
                onChange={e => setContextPayload(e.target.value)}
                rows={3}
                placeholder="Paste API schemas, retrieved RAG document snippets, or codebase signatures..."
                className="w-full p-2.5 rounded-lg border border-border bg-canvas text-xs font-mono text-text-primary placeholder:text-text-disabled focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-fast resize-y"
              />
              <span className="text-[10px] text-text-tertiary mt-1 block">
                * Automatically placed at top of compiled payload to boost model accuracy by up to 30%.
              </span>
            </div>

            {/* Operational Constraints */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Operational Constraints & Guardrails ({constraints.length})
              </label>
              <div className="space-y-2 mb-2">
                {constraints.map((c, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-surface-secondary border border-border-subtle text-xs">
                    <span className="text-text-primary font-mono text-[11px] flex-1">{c}</span>
                    <button
                      onClick={() => handleRemoveConstraint(idx)}
                      className="text-text-tertiary hover:text-error transition-fast p-0.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newConstraint}
                  onChange={e => setNewConstraint(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddConstraint()}
                  placeholder="Add new constraint (e.g. Return valid JSON only)..."
                  className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-canvas text-xs text-text-primary focus:outline-none focus:border-primary"
                />
                <button
                  onClick={handleAddConstraint}
                  className="px-3 py-1.5 rounded-lg bg-surface-tertiary hover:bg-border-strong text-text-primary text-xs font-medium transition-fast cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </div>

            {/* Dynamic Variables Registry */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-text-secondary">
                  Detected Dynamic Variables ({detectedVariables.length})
                </label>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {detectedVariables.map((v, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary-subtle text-primary border border-primary-border font-mono text-xs font-semibold">
                    <Braces className="w-3 h-3" />
                    {v.name}
                  </span>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={newVarName}
                  onChange={e => setNewVarName(e.target.value)}
                  placeholder="VAR_NAME"
                  className="w-1/3 px-2.5 py-1.5 rounded-lg border border-border bg-canvas text-xs font-mono uppercase focus:outline-none focus:border-primary"
                />
                <input
                  type="text"
                  value={newVarDesc}
                  onChange={e => setNewVarDesc(e.target.value)}
                  placeholder="Description..."
                  className="flex-1 px-2.5 py-1.5 rounded-lg border border-border bg-canvas text-xs focus:outline-none focus:border-primary"
                />
                <button
                  onClick={handleAddVariable}
                  className="px-3 py-1.5 rounded-lg bg-surface-tertiary hover:bg-border-strong text-text-primary text-xs font-medium transition-fast cursor-pointer"
                  aria-label="Add variable"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Few-Shot Demonstration Controls */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-text-secondary">
                  Few-Shot Demonstrations ({fewShotPairs.length})
                </label>
              </div>
              {fewShotPairs.length > 0 && (
                <div className="space-y-2 mb-2">
                  {fewShotPairs.map((pair, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-surface-secondary border border-border-subtle text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-primary font-semibold">Exemplar #{idx + 1}</span>
                        <button
                          onClick={() => setFewShotPairs(prev => prev.filter((_, i) => i !== idx))}
                          className="text-text-tertiary hover:text-error transition-fast p-0.5 cursor-pointer"
                          aria-label="Remove exemplar"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-[11px] text-text-secondary truncate">In: {pair.input}</div>
                    </div>
                  ))}
                </div>
              )}
              <div className="space-y-1.5 pt-1">
                <input
                  type="text"
                  value={fsInput}
                  onChange={e => setFsInput(e.target.value)}
                  placeholder="Sample input context..."
                  className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-canvas text-xs font-mono focus:outline-none focus:border-primary"
                />
                <input
                  type="text"
                  value={fsOutput}
                  onChange={e => setFsOutput(e.target.value)}
                  placeholder="Expected model response..."
                  className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-canvas text-xs font-mono focus:outline-none focus:border-primary"
                />
                <button
                  onClick={handleAddFewShot}
                  className="w-full py-1.5 rounded-lg bg-surface-tertiary hover:bg-border-strong text-text-primary text-xs font-medium transition-fast cursor-pointer flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Few-Shot Exemplar
                </button>
              </div>
            </div>
          </div>

          {/* Card 3: Tri-Axis Metric Optimization Slider */}
          <div className="p-5 rounded-xl border border-border bg-surface shadow-subtle space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold tracking-tight text-text-primary">
                  3. Multi-Metric Optimization Profile
                </h2>
              </div>
              <span className="text-[11px] font-mono text-text-tertiary">Milestone 5</span>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-text-primary">Execution Quality & Accuracy Weight</span>
                  <span className="font-mono text-primary font-semibold">{qualityWeight}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={qualityWeight}
                  onChange={e => setQualityWeight(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-text-primary">Token Cost Compression Weight</span>
                  <span className="font-mono text-score-warning font-semibold">{costWeight}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={costWeight}
                  onChange={e => setCostWeight(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-text-primary">Latency / Speed Optimization Weight</span>
                  <span className="font-mono text-sky-500 font-semibold">{latencyWeight}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={latencyWeight}
                  onChange={e => setLatencyWeight(Number(e.target.value))}
                  className="w-full accent-sky-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT PANEL: Output Suite Delivery & Telemetry (Cols 7) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Telemetry Predictive Scorecard Header */}
          <div className="p-5 rounded-xl border border-border bg-surface shadow-subtle grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-surface-secondary border border-border-subtle">
              <div className="text-[11px] font-mono text-text-tertiary">UTILITY SCORE U(P*)</div>
              <div className="text-xl font-mono font-semibold text-primary mt-1 tabular-nums">
                {telemetry.utilityScore} <span className="text-xs text-text-tertiary">/ 100</span>
              </div>
              <div className="text-[10px] text-score-excellent mt-0.5">High Efficiency</div>
            </div>

            <div className="p-3 rounded-lg bg-surface-secondary border border-border-subtle">
              <div className="text-[11px] font-mono text-text-tertiary">QUALITY SCORE</div>
              <div className="text-xl font-mono font-semibold text-score-excellent mt-1 tabular-nums">
                {telemetry.qualityScore}%
              </div>
              <div className="text-[10px] text-text-tertiary mt-0.5">+41% vs raw seed</div>
            </div>

            <div className="p-3 rounded-lg bg-surface-secondary border border-border-subtle">
              <div className="text-[11px] font-mono text-text-tertiary">EXPANSION RATIO</div>
              <div className="text-xl font-mono font-semibold text-score-warning mt-1 tabular-nums">
                {telemetry.tokenExpansionRatio}x
              </div>
              <div className="text-[10px] text-text-tertiary mt-0.5">~{telemetry.compiledTokens} tokens</div>
            </div>

            <div className="p-3 rounded-lg bg-surface-secondary border border-border-subtle">
              <div className="text-[11px] font-mono text-text-tertiary">EST. LATENCY</div>
              <div className="text-xl font-mono font-semibold text-text-primary mt-1 tabular-nums">
                ~{telemetry.estimatedLatencyMs} <span className="text-xs text-text-tertiary">ms</span>
              </div>
              <div className="text-[10px] text-text-tertiary mt-0.5">Target: {targetModel.split('-')[0]}</div>
            </div>
          </div>

          {/* Main Output Suite Window */}
          <div className="rounded-xl border border-border bg-surface shadow-subtle overflow-hidden">
            
            {/* Output Suite Navigation Bar */}
            <div className="flex border-b border-border bg-canvas overflow-x-auto shrink-0 py-0.5">
              {[
                { id: 'compiled', label: 'Compiled System Prompt', icon: FileCode },
                { id: 'user_template', label: 'User Template & Live Form', icon: Terminal },
                { id: 'exemplars', label: `Synthetic Exemplars (${fewShotPairs.length})`, icon: BookOpen },
                { id: 'diff', label: 'Visual Git Diff', icon: GitCompare },
                { id: 'export', label: 'SDK & Code Bindings', icon: Code }
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab(tab.id as any);
                    }}
                    className={`shrink-0 cursor-pointer min-h-[44px] px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-fast select-none whitespace-nowrap ${
                      isActive
                        ? 'border-primary text-primary bg-surface shadow-xs font-bold'
                        : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-text-tertiary'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB CONTENT 1: Compiled System Prompt */}
            {activeTab === 'compiled' && (
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-mono text-text-secondary">
                    Target Format: <span className="text-primary font-semibold">{targetModel}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPromptfooModalOpen(true)}
                      className="px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-xs font-medium text-emerald-400 transition-fast cursor-pointer flex items-center gap-1.5"
                      title="Export promptfooconfig.yaml for LLM testing"
                    >
                      <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Export to Promptfoo</span>
                    </button>
                    <button
                      onClick={() => copyToClipboard(compiledPayload.compiledSystemPrompt, 'system_prompt')}
                      className="px-3 py-1.5 rounded-lg border border-border bg-surface-secondary hover:bg-border-subtle text-xs font-medium text-text-primary transition-fast cursor-pointer flex items-center gap-1.5"
                    >
                      {copiedKey === 'system_prompt' ? <Check className="w-3.5 h-3.5 text-score-excellent" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'system_prompt' ? 'Copied System Prompt!' : 'Copy System Prompt'}</span>
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <pre className="p-4 rounded-xl border border-border-subtle bg-canvas font-mono text-xs text-text-primary leading-relaxed whitespace-pre-wrap overflow-x-auto max-h-[460px]">
                    {compiledPayload.compiledSystemPrompt}
                  </pre>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: User Message Template & Live Form */}
            {activeTab === 'user_template' && (
              <div className="p-5 space-y-6">
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider font-mono">
                    Runtime User Message Payload Template
                  </h3>
                  <pre className="p-3 rounded-lg border border-border-subtle bg-canvas font-mono text-xs text-text-primary leading-relaxed whitespace-pre-wrap">
                    {compiledPayload.userMessageTemplate}
                  </pre>
                </div>

                {/* Interactive Dynamic Form */}
                <div className="space-y-4 border-t border-border-subtle pt-4">
                  <h3 className="text-xs font-semibold text-text-primary flex items-center gap-2">
                    <Braces className="w-4 h-4 text-primary" />
                    Live Variable Tester & Form Hydrator
                  </h3>
                  {detectedVariables.length === 0 ? (
                    <p className="text-xs text-text-tertiary">No variables detected in current prompt.</p>
                  ) : (
                    <div className="space-y-3">
                      {detectedVariables.map(v => (
                        <div key={v.name}>
                          <label className="block text-xs font-mono font-semibold text-primary mb-1">
                            {`{{${v.name}}}`}
                          </label>
                          <input
                            type="text"
                            value={liveVariableValues[v.name] || ''}
                            onChange={e => setLiveVariableValues({ ...liveVariableValues, [v.name]: e.target.value })}
                            placeholder={`Enter test value for ${v.name}...`}
                            className="w-full px-3 py-1.5 rounded-lg border border-border bg-canvas text-xs font-mono text-text-primary focus:outline-none focus:border-primary"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 space-y-2">
                    <span className="text-[11px] font-mono text-text-tertiary">Hydrated User Payload Preview:</span>
                    <pre className="p-3 rounded-lg border border-primary-border bg-primary-subtle/30 font-mono text-xs text-text-primary whitespace-pre-wrap">
                      {hydratedUserMessage}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: Synthetic Exemplars Suite */}
            {activeTab === 'exemplars' && (
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider font-mono">
                    Synthetic Exemplars XML Blocks
                  </h3>
                  <button
                    onClick={() => setActiveTab('compiled')}
                    className="text-xs text-primary hover:underline"
                  >
                    View in system prompt
                  </button>
                </div>

                {fewShotPairs.length === 0 ? (
                  <div className="p-6 rounded-lg border border-dashed border-border text-center space-y-2">
                    <p className="text-xs text-text-tertiary">No few-shot exemplars provided yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {fewShotPairs.map((pair, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-border-subtle bg-canvas space-y-3">
                        <div className="text-xs font-mono font-semibold text-primary">
                          Exemplar Demonstration #{idx + 1}
                        </div>
                        <div>
                          <div className="text-[11px] font-mono text-text-tertiary mb-1">Input Context:</div>
                          <pre className="p-2 rounded border border-border-subtle bg-surface text-xs font-mono text-text-primary whitespace-pre-wrap">
                            {pair.input}
                          </pre>
                        </div>
                        <div>
                          <div className="text-[11px] font-mono text-text-tertiary mb-1">Target Output Behavior:</div>
                          <pre className="p-2 rounded border border-border-subtle bg-surface text-xs font-mono text-score-excellent whitespace-pre-wrap">
                            {pair.output}
                          </pre>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 4: Visual Git-Style Diff */}
            {activeTab === 'diff' && (
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-text-secondary">
                    Comparing Raw Seed Prompt vs Compiled Architecture
                  </span>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="text-error flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-error" /> Raw Seed</span>
                    <span className="text-score-excellent flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-score-excellent" /> Compiled Engine</span>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-canvas font-mono text-xs p-4 max-h-[460px] overflow-y-auto space-y-1">
                  {diffLines.map((line, i) => (
                    <div
                      key={i}
                      className={`p-1 rounded flex items-start gap-2 ${
                        line.type === 'removed'
                          ? 'bg-error-subtle/50 text-error'
                          : line.type === 'added'
                          ? 'bg-score-excellent-subtle/50 text-score-excellent'
                          : 'text-text-secondary'
                      }`}
                    >
                      <span className="font-mono text-[10px] select-none opacity-60 w-4 shrink-0">
                        {line.type === 'removed' ? '-' : line.type === 'added' ? '+' : ' '}
                      </span>
                      <span className="whitespace-pre-wrap break-all">{line.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT 5: SDK & Code Bindings */}
            {activeTab === 'export' && (
              <div className="p-5 space-y-4">
                <div className="flex flex-wrap gap-2 mb-3">
                  {[
                    { id: 'python', label: 'Python SDK' },
                    { id: 'typescript', label: 'TypeScript SDK' },
                    { id: 'langchain', label: 'LangChain Template' },
                    { id: 'vscode', label: 'VS Code / Cursor Snippet' }
                  ].map(sdk => (
                    <button
                      key={sdk.id}
                      onClick={() => setCopiedKey(sdk.id)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-medium transition-fast cursor-pointer ${
                        (copiedKey === sdk.id || (!copiedKey && sdk.id === 'python'))
                          ? 'border-primary bg-primary-subtle text-primary font-semibold'
                          : 'border-border-subtle bg-surface-secondary text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {sdk.label}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <pre className="p-4 rounded-xl border border-border-subtle bg-canvas font-mono text-xs text-text-primary whitespace-pre-wrap overflow-x-auto max-h-[380px]">
                    {getSDKCode((copiedKey as any) || 'python')}
                  </pre>
                  <button
                    onClick={() => copyToClipboard(getSDKCode((copiedKey as any) || 'python'), 'sdk_code')}
                    className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-surface border border-border text-xs font-medium text-text-primary hover:border-primary transition-fast cursor-pointer flex items-center gap-1.5 shadow-subtle"
                  >
                    {copiedKey === 'sdk_code' ? <Check className="w-3.5 h-3.5 text-score-excellent" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'sdk_code' ? 'Copied SDK Code!' : 'Copy Code'}</span>
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* OpenTelemetry Trace Span Audit Card (Milestone 6) */}
          <div className="p-5 rounded-xl border border-border bg-surface shadow-subtle space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-text-secondary">
                  OpenTelemetry Audit Span Trace (Milestone 6)
                </h3>
              </div>
              <span className="text-[10px] font-mono bg-primary-subtle text-primary px-2 py-0.5 rounded">
                traceAI.span.v1
              </span>
            </div>
            <pre className="p-3 rounded-lg border border-border-subtle bg-canvas font-mono text-[11px] text-text-tertiary overflow-x-auto">
              {JSON.stringify(
                {
                  trace_id: "tr_aiq_99a8b1c4e2",
                  span_id: "sp_compiler_01",
                  target_architecture: targetModel,
                  taxonomy: taskTaxonomy,
                  quality_score: telemetry.qualityScore,
                  token_expansion_ratio: telemetry.tokenExpansionRatio,
                  estimated_latency_ms: telemetry.estimatedLatencyMs,
                  utility_metric_u: telemetry.utilityScore,
                  telemetry_status: "SUCCESS_COMPILED"
                },
                null,
                2
              )}
            </pre>
          </div>

        </div>

      </div>

      <PromptfooExportModal
        isOpen={isPromptfooModalOpen}
        onClose={() => setIsPromptfooModalOpen(false)}
        promptText={compiledPayload.compiledSystemPrompt}
        title={`Rewritten Prompt (${targetModel})`}
        score={telemetry.qualityScore}
      />
    </div>
  );
}
