import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  Download,
  Play,
  Code,
  Terminal,
  ShieldCheck,
  ShieldAlert,
  Layers,
  FileText,
  Plus,
  Trash2,
  Zap,
  ChevronDown,
  Brain,
  Sliders,
  RotateCcw,
  BookOpen,
  FileCode
} from 'lucide-react';
import { PromptfooExportModal } from './PromptfooExportModal';
import {
  MODEL_CONFIGS,
  TEMPLATE_LIBRARY,
  synthesizeSystemPrompt
} from '../../lib/quality-engine/generator-engine';
import type {
  PromptSpecification,
  TargetModel,
  OutputFormat,
  ToneStyle,
  GeneratedSystemPrompt,
  SystemPromptTemplate
} from '../../lib/quality-engine/generator-types';

export default function SystemPromptGeneratorWorkspace() {
  const [activeTab, setActiveTab] = useState<'builder' | 'templates' | 'quality' | 'preview'>('builder');

  // Input Specification State
  const [taskDescription, setTaskDescription] = useState<string>(
    'Analyze incoming user queries and return structured JSON summaries with sentiment score, main topics, and risk factors.'
  );
  const [rolePersona, setRolePersona] = useState<string>(
    'Senior AI Data Analyst & Natural Language Processing Specialist.'
  );
  const [targetModel, setTargetModel] = useState<TargetModel>('gpt-4o');
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('json');
  const [toneStyle, setToneStyle] = useState<ToneStyle>('technical');
  
  const [constraints, setConstraints] = useState<string[]>([
    'Return valid JSON only without markdown commentaries.',
    'Never include PII or sensitive raw user identifiers in the output.',
    'If data is ambiguous, set confidence_score to below 0.5.'
  ]);
  const [newConstraint, setNewConstraint] = useState<string>('');

  const [variables, setVariables] = useState<{ name: string; description: string }[]>([
    { name: 'user_query', description: 'Raw incoming customer feedback message' },
    { name: 'session_id', description: 'Unique user tracking identifier' }
  ]);
  const [varName, setVarName] = useState<string>('');
  const [varDesc, setVarDesc] = useState<string>('');

  const [enableGuardrails, setEnableGuardrails] = useState<boolean>(true);
  const [enableChainOfThought, setEnableChainOfThought] = useState<boolean>(true);

  // Playground Interactive Test State
  const [testUserQuery, setTestUserQuery] = useState<string>(
    'I loved the quick delivery but the box was slightly damaged. Can I get a partial refund?'
  );
  const [isTestRunning, setIsTestRunning] = useState<boolean>(false);
  const [testOutput, setTestOutput] = useState<string | null>(null);

  // Action feedback states
  const [copiedFormat, setCopiedFormat] = useState<'text' | 'json' | null>(null);
  const [isPromptfooModalOpen, setIsPromptfooModalOpen] = useState<boolean>(false);

  // Synthesize Prompt
  const currentSpec: PromptSpecification = useMemo(() => {
    return {
      taskDescription,
      rolePersona,
      targetModel,
      outputFormat,
      toneStyle,
      constraints,
      variables,
      fewShotExamples: [],
      enableGuardrails,
      enableChainOfThought
    };
  }, [
    taskDescription,
    rolePersona,
    targetModel,
    outputFormat,
    toneStyle,
    constraints,
    variables,
    enableGuardrails,
    enableChainOfThought
  ]);

  const generatedResult: GeneratedSystemPrompt = useMemo(() => {
    return synthesizeSystemPrompt(currentSpec);
  }, [currentSpec]);

  // Handlers
  const handleAddConstraint = () => {
    if (!newConstraint.trim()) return;
    setConstraints((prev) => [...prev, newConstraint.trim()]);
    setNewConstraint('');
  };

  const handleRemoveConstraint = (idx: number) => {
    setConstraints((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddVariable = () => {
    if (!varName.trim()) return;
    setVariables((prev) => [...prev, { name: varName.trim().replace(/[^a-zA-Z0-9_]/g, ''), description: varDesc.trim() }]);
    setVarName('');
    setVarDesc('');
  };

  const handleRemoveVariable = (idx: number) => {
    setVariables((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleLoadTemplate = (tpl: SystemPromptTemplate) => {
    if (tpl.specification.taskDescription) setTaskDescription(tpl.specification.taskDescription);
    if (tpl.specification.rolePersona) setRolePersona(tpl.specification.rolePersona);
    if (tpl.specification.targetModel) setTargetModel(tpl.specification.targetModel);
    if (tpl.specification.outputFormat) setOutputFormat(tpl.specification.outputFormat);
    if (tpl.specification.toneStyle) setToneStyle(tpl.specification.toneStyle);
    if (tpl.specification.constraints) setConstraints(tpl.specification.constraints);
    if (tpl.specification.variables) setVariables(tpl.specification.variables);
    if (tpl.specification.enableGuardrails !== undefined) setEnableGuardrails(tpl.specification.enableGuardrails);
    if (tpl.specification.enableChainOfThought !== undefined) setEnableChainOfThought(tpl.specification.enableChainOfThought);
    setActiveTab('builder');
  };

  const handleCopy = (content: string, type: 'text' | 'json') => {
    navigator.clipboard.writeText(content);
    setCopiedFormat(type);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleRunSimulatedTest = () => {
    setIsTestRunning(true);
    setTestOutput(null);
    setTimeout(() => {
      if (outputFormat === 'json') {
        setTestOutput(
          JSON.stringify(
            {
              sentiment_score: 0.72,
              sentiment: "MIXED_POSITIVE",
              topics: ["delivery_speed", "packaging_condition", "refund_request"],
              risk_level: "LOW",
              summary: "Customer praised delivery speed but reported outer box damage and requested refund options."
            },
            null,
            2
          )
        );
      } else {
        setTestOutput(
          `### Query Analysis Output\n\n- **Primary Intent:** Shipping Feedback & Refund Request\n- **Sentiment:** Mixed (Delivery Speed: + / Packaging: -)\n- **Action Required:** Forward to Customer Support desk for partial box damage claim.`
        );
      }
      setIsTestRunning(false);
    }, 600);
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto space-y-6">
      {/* Top Banner Navigation / Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary-subtle border border-primary-border text-primary">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-heading-md font-semibold text-text-primary">
              AI System Prompt Generator & Architect
            </h2>
            <p className="text-body-sm text-text-secondary">
              Model-Tailored Synthesis • Role & Persona Framing • Guardrail Directives • Token & Quality Evaluation
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 p-1 bg-surface-secondary rounded-lg border border-border">
          <button
            onClick={() => setActiveTab('builder')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-fast cursor-pointer ${
              activeTab === 'builder'
                ? 'bg-surface text-text-primary shadow-subtle border border-border-subtle'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Prompt Builder
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-fast cursor-pointer ${
              activeTab === 'templates'
                ? 'bg-surface text-text-primary shadow-subtle border border-border-subtle'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Template Library
          </button>
          <button
            onClick={() => setActiveTab('quality')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-fast cursor-pointer ${
              activeTab === 'quality'
                ? 'bg-surface text-text-primary shadow-subtle border border-border-subtle'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-score-excellent" />
            Quality ({generatedResult.evaluation.overallScore}/100)
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-fast cursor-pointer ${
              activeTab === 'preview'
                ? 'bg-surface text-text-primary shadow-subtle border border-border-subtle'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Play className="w-3.5 h-3.5 text-primary" />
            Test & Sandbox
          </button>
        </div>
      </div>

      {/* TAB 1: BUILDER WORKSPACE */}
      {activeTab === 'builder' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT FORM CONTROLS (5 cols) */}
          <div className="lg:col-span-5 space-y-5 bg-surface border border-border-subtle p-5 rounded-xl shadow-subtle">
            <h3 className="text-sm font-semibold text-text-primary border-b border-border-subtle pb-3 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-primary" />
              Prompt Specifications
            </h3>

            {/* Task Description */}
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1.5">
                Core Task / Objective <span className="text-critical">*</span>
              </label>
              <textarea
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="What should the AI model do?"
                rows={3}
                className="w-full text-xs font-sans p-3 bg-canvas border border-border rounded-lg text-text-primary focus:border-primary focus:ring-1 focus:ring-primary transition-fast resize-none"
              />
            </div>

            {/* Role & Persona */}
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1.5">
                Role & Persona Definition
              </label>
              <input
                type="text"
                value={rolePersona}
                onChange={(e) => setRolePersona(e.target.value)}
                placeholder="e.g. Senior Security Engineer, Friendly Tutor"
                className="w-full text-xs font-sans p-2.5 bg-canvas border border-border rounded-lg text-text-primary focus:border-primary transition-fast"
              />
            </div>

            {/* Grid 2 Cols: Target Model & Output Format */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-text-primary mb-1">
                  Target Model
                </label>
                <div className="relative">
                  <select
                    value={targetModel}
                    onChange={(e) => setTargetModel(e.target.value as TargetModel)}
                    className="w-full text-xs font-sans p-2 pr-7 bg-canvas border border-border rounded-md text-text-primary focus:border-primary appearance-none cursor-pointer"
                  >
                    <option value="gpt-4o">GPT-4o (OpenAI)</option>
                    <option value="claude-4">Claude 4 (Anthropic)</option>
                    <option value="gemini-2.5">Gemini 2.5 (Google)</option>
                    <option value="llama-3">Llama 3 (Meta)</option>
                    <option value="dalle-3">DALL-E 3 / Visual</option>
                    <option value="generic">Universal LLM</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-text-tertiary absolute right-2 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-text-primary mb-1">
                  Output Format
                </label>
                <div className="relative">
                  <select
                    value={outputFormat}
                    onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
                    className="w-full text-xs font-sans p-2 pr-7 bg-canvas border border-border rounded-md text-text-primary focus:border-primary appearance-none cursor-pointer"
                  >
                    <option value="markdown">Markdown</option>
                    <option value="json">Pure JSON</option>
                    <option value="code">Source Code</option>
                    <option value="bullet-list">Bullet List</option>
                    <option value="step-by-step">Step-by-Step</option>
                    <option value="structured-text">Structured Text</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-text-tertiary absolute right-2 top-2.5 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Tone & Style */}
            <div>
              <label className="block text-[11px] font-medium text-text-primary mb-1">
                Tone & Communication Style
              </label>
              <div className="relative">
                <select
                  value={toneStyle}
                  onChange={(e) => setToneStyle(e.target.value as ToneStyle)}
                  className="w-full text-xs font-sans p-2 pr-7 bg-canvas border border-border rounded-md text-text-primary focus:border-primary appearance-none cursor-pointer"
                >
                  <option value="technical">Technical & Precise</option>
                  <option value="professional">Professional & Authoritative</option>
                  <option value="concise">Concise & Direct</option>
                  <option value="strict">Strict & Rule-Bound</option>
                  <option value="friendly">Friendly & Educational</option>
                  <option value="creative">Creative & Expressive</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-text-tertiary absolute right-2 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Constraints Section */}
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1.5">
                Rules & Constraints ({constraints.length})
              </label>
              <div className="space-y-1.5 mb-2 max-h-36 overflow-y-auto pr-1">
                {constraints.map((c, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 p-2 rounded bg-surface-secondary text-xs text-text-secondary border border-border-subtle">
                    <span className="truncate">{c}</span>
                    <button
                      onClick={() => handleRemoveConstraint(i)}
                      className="text-text-tertiary hover:text-critical cursor-pointer"
                      title="Remove rule"
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
                  onChange={(e) => setNewConstraint(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddConstraint()}
                  placeholder="Add operational rule..."
                  className="flex-grow text-xs font-sans p-2 bg-canvas border border-border rounded-md text-text-primary"
                />
                <button
                  onClick={handleAddConstraint}
                  className="px-3 py-1.5 bg-surface-secondary border border-border text-text-primary rounded-md text-xs font-medium hover:bg-surface cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Variables Section */}
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1.5">
                Dynamic Variables ({variables.length})
              </label>
              <div className="space-y-1.5 mb-2 max-h-36 overflow-y-auto pr-1">
                {variables.map((v, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 p-2 rounded bg-surface-secondary text-xs border border-border-subtle">
                    <span className="font-mono text-primary font-semibold">{`{{${v.name}}}`}</span>
                    <span className="text-text-tertiary truncate text-[11px]">{v.description}</span>
                    <button
                      onClick={() => handleRemoveVariable(i)}
                      className="text-text-tertiary hover:text-critical cursor-pointer ml-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={varName}
                  onChange={(e) => setVarName(e.target.value)}
                  placeholder="variable_name"
                  className="w-1/3 text-xs font-mono p-2 bg-canvas border border-border rounded-md text-text-primary"
                />
                <input
                  type="text"
                  value={varDesc}
                  onChange={(e) => setVarDesc(e.target.value)}
                  placeholder="Description"
                  className="flex-grow text-xs font-sans p-2 bg-canvas border border-border rounded-md text-text-primary"
                />
                <button
                  onClick={handleAddVariable}
                  className="px-3 py-1.5 bg-surface-secondary border border-border text-text-primary rounded-md text-xs font-medium hover:bg-surface cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Toggles */}
            <div className="pt-2 border-t border-border-subtle space-y-2">
              <label className="flex items-center justify-between text-xs text-text-primary cursor-pointer">
                <span className="flex items-center gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-primary" />
                  Security Guardrails & Injection Defense
                </span>
                <input
                  type="checkbox"
                  checked={enableGuardrails}
                  onChange={(e) => setEnableGuardrails(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-text-primary cursor-pointer">
                <span className="flex items-center gap-2">
                  <Brain className="w-3.5 h-3.5 text-primary" />
                  Chain-of-Thought Reasoning Instructions
                </span>
                <input
                  type="checkbox"
                  checked={enableChainOfThought}
                  onChange={(e) => setEnableChainOfThought(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* RIGHT GENERATED OUTPUT DISPLAY (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Model Advice Header */}
            <div className="p-3.5 bg-primary-subtle/50 border border-primary-border rounded-xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-primary font-medium">
                <Zap className="w-4 h-4 shrink-0" />
                <span>Optimized for <strong>{MODEL_CONFIGS[targetModel].name}</strong></span>
              </div>
              <span className="font-mono text-[11px] text-text-tertiary bg-surface px-2 py-0.5 rounded border border-border-subtle">
                ~{generatedResult.estimatedTokens} tokens
              </span>
            </div>

            {/* System Prompt Code Box */}
            <div className="relative border border-border rounded-xl bg-surface overflow-hidden shadow-raised">
              <div className="flex items-center justify-between px-4 py-2.5 bg-surface-secondary border-b border-border-subtle">
                <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
                  <Terminal className="w-4 h-4 text-primary" />
                  Generated System Prompt
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPromptfooModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-md text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition-fast cursor-pointer"
                    title="Export promptfooconfig.yaml for LLM testing"
                  >
                    <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Export to Promptfoo</span>
                  </button>
                  <button
                    onClick={() => handleCopy(generatedResult.promptText, 'text')}
                    className="flex items-center gap-1.5 px-3 py-1 bg-surface border border-border-subtle rounded-md text-xs font-medium text-text-secondary hover:text-text-primary hover:border-border transition-fast cursor-pointer"
                  >
                    {copiedFormat === 'text' ? <Check className="w-3.5 h-3.5 text-score-excellent" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedFormat === 'text' ? 'Copied!' : 'Copy Prompt'}
                  </button>
                  <button
                    onClick={() => handleCopy(generatedResult.jsonSpec, 'json')}
                    className="flex items-center gap-1.5 px-3 py-1 bg-surface border border-border-subtle rounded-md text-xs font-medium text-text-secondary hover:text-text-primary hover:border-border transition-fast cursor-pointer"
                  >
                    {copiedFormat === 'json' ? <Check className="w-3.5 h-3.5 text-score-excellent" /> : <Code className="w-3.5 h-3.5" />}
                    {copiedFormat === 'json' ? 'Copied JSON!' : 'Copy JSON'}
                  </button>
                  <button
                    onClick={() => handleDownload(generatedResult.promptText, 'system-prompt.md')}
                    className="p-1 text-text-tertiary hover:text-text-primary transition-fast cursor-pointer"
                    title="Download System Prompt .md"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <pre className="p-4 text-xs font-mono leading-relaxed text-text-primary overflow-x-auto whitespace-pre-wrap max-h-[520px] select-all bg-canvas">
                {generatedResult.promptText}
              </pre>
            </div>

            {/* Model-Specific Tuning Note */}
            <div className="p-4 bg-surface border border-border-subtle rounded-xl text-xs text-text-secondary leading-relaxed">
              <span className="font-semibold text-text-primary block mb-1">Model Formatting Advice ({MODEL_CONFIGS[targetModel].provider})</span>
              {generatedResult.modelOptimizationAdvice}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TEMPLATES LIBRARY */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="border-b border-border-subtle pb-3">
            <h3 className="text-sm font-semibold text-text-primary">Curated System Prompt Templates</h3>
            <p className="text-xs text-text-secondary mt-0.5">Select a battle-tested template to instantly load core specifications into the prompt builder.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TEMPLATE_LIBRARY.map((tpl) => (
              <div
                key={tpl.id}
                className="bg-surface border border-border-subtle p-5 rounded-xl flex flex-col justify-between gap-4 hover:border-primary-border transition-fast hover:shadow-subtle group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-primary bg-primary-subtle px-2 py-0.5 rounded-full">
                      {tpl.category}
                    </span>
                    <Sparkles className="w-4 h-4 text-text-tertiary group-hover:text-primary transition-fast" />
                  </div>
                  <h4 className="text-sm font-semibold text-text-primary group-hover:text-primary transition-fast">
                    {tpl.title}
                  </h4>
                  <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
                    {tpl.description}
                  </p>
                </div>

                <button
                  onClick={() => handleLoadTemplate(tpl)}
                  className="w-full py-2 bg-surface-secondary border border-border text-text-primary rounded-lg text-xs font-medium hover:bg-primary hover:text-text-on-primary hover:border-primary transition-fast cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Load Template into Builder
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: QUALITY DIAGNOSTICS */}
      {activeTab === 'quality' && (
        <div className="space-y-6 bg-surface border border-border-subtle p-6 rounded-xl shadow-subtle">
          <div className="flex items-center justify-between border-b border-border-subtle pb-4">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">System Prompt Quality Diagnostics</h3>
              <p class="text-xs text-text-secondary mt-0.5">Automated scoring based on 5 structural prompt engineering dimensions.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold font-mono text-primary">{generatedResult.evaluation.overallScore}</span>
              <span className="text-xs text-text-tertiary">/ 100 Overall Score</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(generatedResult.evaluation)
              .filter(([k]) => k !== 'overallScore' && k !== 'suggestions')
              .map(([key, item]: [string, any]) => (
                <div key={key} className="p-4 bg-canvas border border-border-subtle rounded-lg flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-text-primary">{item.label}</span>
                    <span className={`text-xs font-mono font-bold ${item.score >= 85 ? 'text-score-excellent' : item.score >= 70 ? 'text-primary' : 'text-score-critical'}`}>
                      {item.score}/100
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">{item.feedback}</p>
                </div>
              ))}
          </div>

          {generatedResult.evaluation.suggestions.length > 0 && (
            <div className="p-4 bg-primary-subtle/40 border border-primary-border rounded-lg space-y-2">
              <h4 className="text-xs font-semibold text-primary flex items-center gap-1.5">
                <Brain className="w-4 h-4" /> Recommended Optimization Improvements:
              </h4>
              <ul className="list-disc list-inside text-xs text-text-secondary space-y-1">
                {generatedResult.evaluation.suggestions.map((sug, i) => (
                  <li key={i}>{sug}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: INTERACTIVE TEST SANDBOX */}
      {activeTab === 'preview' && (
        <div className="space-y-6 bg-surface border border-border-subtle p-6 rounded-xl shadow-subtle">
          <div className="border-b border-border-subtle pb-3">
            <h3 className="text-sm font-semibold text-text-primary">Interactive System Prompt Test Sandbox</h3>
            <p className="text-xs text-text-secondary mt-0.5">Test how the model responds to sample user queries under your current System Prompt instructions.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1.5">
                Sample User Query Input
              </label>
              <textarea
                value={testUserQuery}
                onChange={(e) => setTestUserQuery(e.target.value)}
                rows={4}
                className="w-full text-xs font-sans p-3 bg-canvas border border-border rounded-lg text-text-primary focus:border-primary resize-none"
              />
              <button
                onClick={handleRunSimulatedTest}
                disabled={isTestRunning || !testUserQuery.trim()}
                className="mt-3 px-4 py-2 bg-primary text-text-on-primary rounded-lg text-xs font-medium hover:bg-primary-hover transition-fast cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isTestRunning ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                {isTestRunning ? 'Evaluating Output...' : 'Run Test Query'}
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-primary mb-1.5">
                Simulated LLM Output
              </label>
              <div className="min-h-[120px] p-3 bg-canvas border border-border rounded-lg font-mono text-xs text-text-primary overflow-x-auto whitespace-pre-wrap">
                {testOutput ? testOutput : <span className="text-text-tertiary italic">Click "Run Test Query" to preview simulated LLM response...</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      <PromptfooExportModal
        isOpen={isPromptfooModalOpen}
        onClose={() => setIsPromptfooModalOpen(false)}
        promptText={generatedResult?.promptText || taskDescription}
        title="AI System Prompt Generator"
        score={generatedResult?.evaluation?.overallScore}
      />
    </div>
  );
}
