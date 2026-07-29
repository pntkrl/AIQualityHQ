import React, { useState, useMemo, useCallback } from 'react';
import {
  Scissors,
  Copy,
  Check,
  Download,
  RotateCcw,
  BarChart3,
  GitCompareArrows,
  Zap,
  ChevronDown,
  FileText,
  ArrowRight,
  Info,
  Sparkles,
  TrendingDown,
} from 'lucide-react';
import {
  optimizePrompt,
  computeTokenStats,
  computeCostAcrossModels,
  MODEL_REGISTRY,
  getModel,
} from '../../lib/quality-engine/optimizer-engine';
import type {
  OptimizationMode,
  OptimizationResult,
  TokenStats,
} from '../../lib/quality-engine/optimizer-types';

// ---------------------------------------------------------------------------
// Sample Prompt for Demo
// ---------------------------------------------------------------------------

const SAMPLE_PROMPT = `I would like you to please generate a brief summary of the following text for me. In order to do this properly, you should take into consideration all of the key points that are mentioned in the text. It is important to note that the summary should be concise and should basically capture the main ideas. Due to the fact that the text is quite long, you should focus on the most important aspects. Please make sure to include any and all relevant details, and also please note that the summary should be written in a professional tone. At the end of the day, the goal is to provide a comprehensive yet brief overview of the content. I want you to keep in mind that the audience for this summary is a group of executives who have a tendency to prefer bullet-point formats. For the purpose of clarity, please use simple language and avoid jargon as much as possible. In the event that you encounter any technical terms, please provide a brief explanation of each and every one of them. Last but not least, the summary should be approximately 200 words in length.`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PromptLengthOptimizerWorkspace() {
  const [activeTab, setActiveTab] = useState<'optimizer' | 'stats' | 'compare'>('optimizer');
  const [prompt, setPrompt] = useState<string>(SAMPLE_PROMPT);
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o');
  const [mode, setMode] = useState<OptimizationMode>('balanced');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [hasOptimized, setHasOptimized] = useState<boolean>(false);

  // Compute live token stats
  const model = getModel(selectedModel);
  const liveStats: TokenStats = useMemo(
    () => computeTokenStats(prompt, model),
    [prompt, model]
  );

  // Run optimization
  const result: OptimizationResult | null = useMemo(() => {
    if (!hasOptimized || !prompt.trim()) return null;
    return optimizePrompt(prompt, mode, selectedModel);
  }, [hasOptimized, prompt, mode, selectedModel]);

  // Optimized stats
  const optimizedStats: TokenStats | null = useMemo(() => {
    if (!result) return null;
    return computeTokenStats(result.optimizedText, model);
  }, [result, model]);

  // Cross-model cost comparison
  const costComparison = useMemo(() => {
    if (!result) return [];
    return computeCostAcrossModels(result.originalTokens, result.optimizedTokens);
  }, [result]);

  const handleOptimize = useCallback(() => {
    setHasOptimized(true);
  }, []);

  const handleReset = useCallback(() => {
    setPrompt('');
    setHasOptimized(false);
  }, []);

  const handleCopy = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleDownload = useCallback((text: string, filename: string) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, []);

  const handleExportJSON = useCallback(() => {
    if (!result) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(result, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `prompt-optimization-${Date.now()}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [result]);

  const handleLoadSample = useCallback(() => {
    setPrompt(SAMPLE_PROMPT);
    setHasOptimized(false);
  }, []);

  // Token limit warning
  const isOverLimit = liveStats.tokens > model.contextWindow;

  return (
    <div className="w-full max-w-[1200px] mx-auto space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary-subtle border border-primary-border text-primary">
            <Scissors className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-heading-md font-semibold text-text-primary">
              Prompt Length Optimizer
            </h2>
            <p className="text-body-sm text-text-secondary">
              Filler Removal • Redundancy Detection • Abbreviation Substitution • Multi-Model Cost Analysis
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 p-1 bg-surface-secondary rounded-lg border border-border">
          <TabButton
            active={activeTab === 'optimizer'}
            onClick={() => setActiveTab('optimizer')}
            icon={<Scissors className="w-3.5 h-3.5" />}
            label="Optimizer"
          />
          <TabButton
            active={activeTab === 'stats'}
            onClick={() => setActiveTab('stats')}
            icon={<BarChart3 className="w-3.5 h-3.5" />}
            label="Stats"
            disabled={!result}
          />
          <TabButton
            active={activeTab === 'compare'}
            onClick={() => setActiveTab('compare')}
            icon={<GitCompareArrows className="w-3.5 h-3.5" />}
            label="Compare"
            disabled={!result}
          />
        </div>
      </div>

      {/* Optimizer Tab */}
      {activeTab === 'optimizer' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel — Input */}
          <div className="flex flex-col gap-4">
            {/* Controls Row */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Model Selector */}
              <div className="relative flex-1 min-w-[160px]">
                <label className="block text-[10px] font-mono font-semibold uppercase tracking-widest text-text-tertiary mb-1">
                  Target Model
                </label>
                <div className="relative">
                  <select
                    id="model-selector"
                    value={selectedModel}
                    onChange={(e) => { setSelectedModel(e.target.value); setHasOptimized(false); }}
                    className="w-full appearance-none bg-surface border border-border rounded-md px-3 py-2 pr-8 text-sm text-text-primary cursor-pointer transition-fast hover:border-text-tertiary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    {MODEL_REGISTRY.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({formatNumber(m.contextWindow)} ctx)
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
                </div>
              </div>

              {/* Mode Selector */}
              <div className="relative min-w-[130px]">
                <label className="block text-[10px] font-mono font-semibold uppercase tracking-widest text-text-tertiary mb-1">
                  Mode
                </label>
                <div className="relative">
                  <select
                    id="mode-selector"
                    value={mode}
                    onChange={(e) => { setMode(e.target.value as OptimizationMode); setHasOptimized(false); }}
                    className="w-full appearance-none bg-surface border border-border rounded-md px-3 py-2 pr-8 text-sm text-text-primary cursor-pointer transition-fast hover:border-text-tertiary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    <option value="concise">Concise</option>
                    <option value="balanced">Balanced</option>
                    <option value="detailed">Detailed</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Input Textarea */}
            <div className="relative">
              <textarea
                id="prompt-input"
                value={prompt}
                onChange={(e) => { setPrompt(e.target.value); setHasOptimized(false); }}
                placeholder="Paste your prompt here…"
                className="w-full h-[340px] bg-surface border border-border rounded-lg p-4 text-sm text-text-primary font-mono leading-relaxed resize-none transition-fast focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-text-disabled"
                spellCheck={false}
              />
              {/* Floating token counter */}
              <div className="absolute bottom-3 right-3 flex items-center gap-3">
                {isOverLimit && (
                  <span className="text-[10px] font-mono font-semibold text-error bg-error-subtle px-2 py-0.5 rounded">
                    EXCEEDS LIMIT
                  </span>
                )}
                <span className="text-[10px] font-mono text-text-tertiary bg-surface-secondary/80 backdrop-blur-sm px-2 py-0.5 rounded border border-border-subtle">
                  {formatNumber(liveStats.tokens)} tokens · {formatNumber(liveStats.words)} words · {formatNumber(liveStats.chars)} chars
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                id="optimize-button"
                onClick={handleOptimize}
                disabled={!prompt.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-text-on-primary rounded-md text-sm font-medium transition-fast hover:bg-primary-hover active:bg-primary-pressed disabled:opacity-40 disabled:pointer-events-none cursor-pointer button-press"
              >
                <Zap className="w-4 h-4" />
                Optimize
              </button>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2.5 border border-border bg-surface text-text-secondary rounded-md text-sm font-medium transition-fast hover:bg-surface-secondary hover:text-text-primary cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
              <button
                onClick={handleLoadSample}
                className="flex items-center gap-2 px-4 py-2.5 text-text-tertiary text-sm font-medium transition-fast hover:text-text-primary cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                Load Sample
              </button>
            </div>

            {/* Mode Descriptions */}
            <div className="flex items-start gap-2 p-3 rounded-md bg-surface-secondary border border-border-subtle text-xs text-text-secondary">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-text-tertiary" />
              <span>
                {mode === 'concise' && 'Aggressive optimization: removes filler phrases, hedge words, redundancies, and substitutes abbreviations. Maximum token reduction.'}
                {mode === 'balanced' && 'Moderate optimization: removes filler phrases, verbose instructions, and abbreviations while preserving hedge words for natural tone.'}
                {mode === 'detailed' && 'Light optimization: removes only obvious filler phrases and normalizes whitespace. Preserves most original phrasing.'}
              </span>
            </div>
          </div>

          {/* Right Panel — Output */}
          <div className="flex flex-col gap-4">
            {result ? (
              <>
                {/* Reduction Summary Bar */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-score-excellent-subtle border border-score-excellent-border">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-score-excellent" />
                    <span className="text-sm font-semibold text-score-excellent">
                      {result.reductionPercent}% Reduction
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono text-text-secondary">
                    <span>{formatNumber(result.originalTokens)} <ArrowRight className="w-3 h-3 inline" /> {formatNumber(result.optimizedTokens)} tokens</span>
                    <span className="text-score-excellent font-semibold">
                      −{formatNumber(result.originalTokens - result.optimizedTokens)}
                    </span>
                  </div>
                </div>

                {/* Optimized Output */}
                <div className="relative">
                  <div className="w-full h-[340px] bg-surface border border-border rounded-lg p-4 text-sm text-text-primary font-mono leading-relaxed overflow-auto">
                    {result.optimizedText}
                  </div>
                  {/* Floating stats */}
                  <div className="absolute bottom-3 right-3 text-[10px] font-mono text-text-tertiary bg-surface-secondary/80 backdrop-blur-sm px-2 py-0.5 rounded border border-border-subtle">
                    {optimizedStats && `${formatNumber(optimizedStats.tokens)} tokens · ${formatNumber(optimizedStats.words)} words · ${formatNumber(optimizedStats.chars)} chars`}
                  </div>
                </div>

                {/* Output Actions */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleCopy(result.optimizedText, 'output')}
                    className="flex items-center gap-2 px-4 py-2 border border-border bg-surface text-text-secondary rounded-md text-sm font-medium transition-fast hover:bg-surface-secondary hover:text-text-primary cursor-pointer"
                  >
                    {copiedId === 'output' ? <Check className="w-3.5 h-3.5 text-score-excellent" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedId === 'output' ? 'Copied' : 'Copy'}
                  </button>
                  <button
                    onClick={() => handleDownload(result.optimizedText, 'optimized-prompt.txt')}
                    className="flex items-center gap-2 px-4 py-2 border border-border bg-surface text-text-secondary rounded-md text-sm font-medium transition-fast hover:bg-surface-secondary hover:text-text-primary cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </button>
                  <button
                    onClick={handleExportJSON}
                    className="flex items-center gap-2 px-4 py-2 text-text-tertiary text-sm font-medium transition-fast hover:text-text-primary cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Export JSON
                  </button>
                </div>

                {/* Cost Savings Callout */}
                <div className="flex items-center justify-between p-3 rounded-md bg-surface-secondary border border-border-subtle">
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span>
                      Est. input cost with <span className="font-semibold text-text-primary">{model.name}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="text-text-tertiary line-through">${result.originalCostInput.toFixed(6)}</span>
                    <span className="text-text-primary font-semibold">${result.optimizedCostInput.toFixed(6)}</span>
                    <span className="text-score-excellent font-semibold">
                      Save ${result.costSavings.toFixed(6)}
                    </span>
                  </div>
                </div>

                {/* Transformations Applied */}
                {result.transformations.length > 0 && (
                  <div className="border border-border-subtle rounded-lg overflow-hidden">
                    <div className="px-4 py-2.5 bg-surface-secondary border-b border-border-subtle">
                      <span className="text-xs font-semibold text-text-primary">
                        {result.transformationCount} Transformations Applied
                      </span>
                    </div>
                    <div className="max-h-[200px] overflow-auto divide-y divide-border-subtle">
                      {result.transformations.slice(0, 50).map((t, i) => (
                        <div key={i} className="flex items-start gap-3 px-4 py-2 text-xs hover:bg-surface-secondary transition-fast">
                          <span className="shrink-0 px-1.5 py-0.5 rounded bg-primary-subtle text-primary font-mono text-[10px] font-semibold mt-0.5">
                            {t.type.split('-')[0].toUpperCase()}
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="text-text-secondary">{t.description}</span>
                            <div className="flex items-center gap-2 mt-0.5 font-mono text-[11px]">
                              <span className="text-error line-through truncate max-w-[200px]">{t.original}</span>
                              <ArrowRight className="w-3 h-3 text-text-disabled shrink-0" />
                              <span className="text-score-excellent truncate max-w-[200px]">{t.replacement}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Empty State */
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] border border-dashed border-border rounded-lg bg-surface-secondary/30">
                <Scissors className="w-10 h-10 text-text-disabled mb-3" />
                <p className="text-sm font-medium text-text-secondary">No optimization yet</p>
                <p className="text-xs text-text-tertiary mt-1 max-w-[280px] text-center">
                  Enter a prompt on the left, choose your target model and mode, then click Optimize.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats Tab */}
      {activeTab === 'stats' && result && (
        <div className="space-y-6">
          {/* Summary Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="Original Tokens" value={formatNumber(result.originalTokens)} />
            <MetricCard label="Optimized Tokens" value={formatNumber(result.optimizedTokens)} accent />
            <MetricCard label="Reduction" value={`${result.reductionPercent}%`} accent />
            <MetricCard label="Transformations" value={String(result.transformationCount)} />
          </div>

          {/* Reduction Bar Visualization */}
          <div className="border border-border-subtle rounded-lg p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Token Reduction</h3>
            <div className="space-y-3">
              {/* Original bar */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-text-tertiary font-mono w-16 shrink-0 text-right">Original</span>
                <div className="flex-1 h-7 bg-surface-secondary rounded-md overflow-hidden relative">
                  <div
                    className="h-full bg-error/20 border-r-2 border-error rounded-md transition-all duration-500"
                    style={{ width: '100%' }}
                  />
                  <span className="absolute inset-y-0 right-3 flex items-center text-xs font-mono font-semibold text-text-primary">
                    {formatNumber(result.originalTokens)}
                  </span>
                </div>
              </div>
              {/* Optimized bar */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-text-tertiary font-mono w-16 shrink-0 text-right">Optimized</span>
                <div className="flex-1 h-7 bg-surface-secondary rounded-md overflow-hidden relative">
                  <div
                    className="h-full bg-score-excellent/20 border-r-2 border-score-excellent rounded-md transition-all duration-500"
                    style={{ width: `${Math.max(5, 100 - result.reductionPercent)}%` }}
                  />
                  <span className="absolute inset-y-0 left-3 flex items-center text-xs font-mono font-semibold text-text-primary"
                    style={{ left: `max(12px, calc(${Math.max(5, 100 - result.reductionPercent)}% - 60px))` }}
                  >
                    {formatNumber(result.optimizedTokens)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Cross-Model Cost Table */}
          <div className="border border-border-subtle rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-surface-secondary border-b border-border-subtle">
              <h3 className="text-sm font-semibold text-text-primary">Cost Savings Across Models</h3>
              <p className="text-xs text-text-tertiary mt-0.5">Estimated input cost per request based on token count</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border-subtle bg-surface-secondary/50">
                    <th className="text-left px-4 py-2.5 font-semibold text-text-secondary">Model</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-text-secondary">Provider</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-text-secondary">$/1M Input</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-text-secondary">Original Cost</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-text-secondary">Optimized Cost</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-score-excellent">Savings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {costComparison.map((row) => (
                    <tr key={row.model.id} className={`hover:bg-surface-secondary transition-fast ${row.model.id === selectedModel ? 'bg-primary-subtle/30' : ''}`}>
                      <td className="px-4 py-2.5 font-medium text-text-primary">
                        {row.model.name}
                        {row.model.id === selectedModel && (
                          <span className="ml-1.5 text-[9px] font-mono font-semibold text-primary bg-primary-subtle px-1.5 py-0.5 rounded">SELECTED</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-text-tertiary">{row.model.provider}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-text-secondary">${row.model.inputPricePerMillion.toFixed(2)}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-text-secondary">${row.originalCost.toFixed(6)}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-text-primary font-semibold">${row.optimizedCost.toFixed(6)}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-score-excellent font-semibold">
                        −${row.savings.toFixed(6)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Transformation Breakdown */}
          <div className="border border-border-subtle rounded-lg p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Transformation Breakdown</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(groupTransformations(result.transformations)).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between px-3 py-2 bg-surface-secondary rounded-md border border-border-subtle">
                  <span className="text-xs text-text-secondary capitalize">{type.replace(/-/g, ' ')}</span>
                  <span className="text-xs font-mono font-semibold text-text-primary">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Word / Character Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-border-subtle rounded-lg p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-3">Word Count</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-mono font-semibold text-text-primary">{formatNumber(result.optimizedWords)}</span>
                <span className="text-xs text-text-tertiary font-mono">/ {formatNumber(result.originalWords)} original</span>
              </div>
              <div className="w-full h-2 bg-surface-secondary rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${result.originalWords > 0 ? (result.optimizedWords / result.originalWords) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div className="border border-border-subtle rounded-lg p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-3">Character Count</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-mono font-semibold text-text-primary">{formatNumber(result.optimizedChars)}</span>
                <span className="text-xs text-text-tertiary font-mono">/ {formatNumber(result.originalChars)} original</span>
              </div>
              <div className="w-full h-2 bg-surface-secondary rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${result.originalChars > 0 ? (result.optimizedChars / result.originalChars) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compare Tab */}
      {activeTab === 'compare' && result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">Side-by-Side Comparison</h3>
            <div className="flex items-center gap-3 text-xs text-text-tertiary">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-error/20 border border-error/40" /> Original
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-score-excellent/20 border border-score-excellent/40" /> Optimized
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Original */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between px-4 py-2 bg-error/5 border border-error/20 rounded-t-lg">
                <span className="text-xs font-semibold text-error">Original</span>
                <span className="text-[10px] font-mono text-text-tertiary">{formatNumber(result.originalTokens)} tokens · {formatNumber(result.originalWords)} words</span>
              </div>
              <div className="h-[400px] bg-surface border-x border-b border-error/20 rounded-b-lg p-4 text-sm text-text-primary font-mono leading-relaxed overflow-auto">
                {result.originalText}
              </div>
            </div>

            {/* Optimized */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between px-4 py-2 bg-score-excellent/5 border border-score-excellent/20 rounded-t-lg">
                <span className="text-xs font-semibold text-score-excellent">Optimized ({result.reductionPercent}% shorter)</span>
                <span className="text-[10px] font-mono text-text-tertiary">{formatNumber(result.optimizedTokens)} tokens · {formatNumber(result.optimizedWords)} words</span>
              </div>
              <div className="h-[400px] bg-surface border-x border-b border-score-excellent/20 rounded-b-lg p-4 text-sm text-text-primary font-mono leading-relaxed overflow-auto">
                {result.optimizedText}
              </div>
            </div>
          </div>

          {/* Copy Actions */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => handleCopy(result.originalText, 'compare-original')}
              className="flex items-center gap-2 px-4 py-2 border border-border bg-surface text-text-secondary rounded-md text-xs font-medium transition-fast hover:bg-surface-secondary cursor-pointer"
            >
              {copiedId === 'compare-original' ? <Check className="w-3 h-3 text-score-excellent" /> : <Copy className="w-3 h-3" />}
              Copy Original
            </button>
            <button
              onClick={() => handleCopy(result.optimizedText, 'compare-optimized')}
              className="flex items-center gap-2 px-4 py-2 border border-border bg-surface text-text-secondary rounded-md text-xs font-medium transition-fast hover:bg-surface-secondary cursor-pointer"
            >
              {copiedId === 'compare-optimized' ? <Check className="w-3 h-3 text-score-excellent" /> : <Copy className="w-3 h-3" />}
              Copy Optimized
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-Components
// ---------------------------------------------------------------------------

function TabButton({
  active,
  onClick,
  icon,
  label,
  disabled = false,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-fast cursor-pointer ${
        active
          ? 'bg-surface text-text-primary shadow-subtle border border-border-subtle'
          : disabled
            ? 'text-text-disabled cursor-not-allowed'
            : 'text-text-secondary hover:text-text-primary hover:bg-surface/50'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function MetricCard({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex flex-col gap-1 p-4 bg-surface border border-border-subtle rounded-lg">
      <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-text-tertiary">{label}</span>
      <span className={`text-xl font-mono font-semibold ${accent ? 'text-primary' : 'text-text-primary'}`}>
        {value}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(n >= 10_000 ? 0 : 1) + 'K';
  return n.toLocaleString();
}

function groupTransformations(
  transformations: { type: string }[]
): Record<string, number> {
  const groups: Record<string, number> = {};
  for (const t of transformations) {
    groups[t.type] = (groups[t.type] || 0) + 1;
  }
  return groups;
}
