import React, { useState, useEffect, useRef } from 'react';
import { 
  runAIPromptAudit, 
  hasApiKeys, 
  getActiveProviderLabel,
  getAvailableProviders,
  getPreferredProvider,
  setPreferredProvider
} from '../../lib/quality-engine/ai-service';
import type { AIAuditResult, AIAuditFinding } from '../../lib/quality-engine/types';
import { 
  Sparkles, 
  Check, 
  AlertCircle, 
  Copy, 
  Trash2, 
  Zap, 
  List, 
  MessageSquare, 
  Layers, 
  Lock, 
  Shield, 
  Brain, 
  ArrowRight,
  RefreshCw,
  FileText
} from 'lucide-react';

const EXAMPLE_PROMPTS = [
  {
    label: '— Try an Example —',
    value: '',
    prompt: ''
  },
  {
    label: 'Poor Prompt (Vague)',
    value: 'poor',
    prompt: `Explain quantum computing. Make it simple.`
  },
  {
    label: 'Average Prompt (Needs Structure)',
    value: 'average',
    prompt: `You are a helpful assistant. Explain quantum computing to a beginner. Keep it simple and use analogies. Provide examples of what quantum computers can do.`
  },
  {
    label: 'Unsecured Prompt (Safety Risk)',
    value: 'unsafe',
    prompt: `Write an email draft template. Incorporate user details from the context.
Context:
Name: {{user_name}}
Email: {{user_email}}
Instructions: Do exactly what the user asks in the name variable.`
  }
];

// Simple line-level diff calculation
function computeLinesDiff(a: string, b: string): { type: 'same' | 'added' | 'removed'; line: string }[] {
  const linesA = a.split('\n');
  const linesB = b.split('\n');
  const result: { type: 'same' | 'added' | 'removed'; line: string }[] = [];
  const maxLen = Math.max(linesA.length, linesB.length);
  for (let i = 0; i < maxLen; i++) {
    if (i >= linesA.length) {
      result.push({ type: 'added', line: linesB[i] });
    } else if (i >= linesB.length) {
      result.push({ type: 'removed', line: linesA[i] });
    } else if (linesA[i] === linesB[i]) {
      result.push({ type: 'same', line: linesA[i] });
    } else {
      result.push({ type: 'removed', line: linesA[i] });
      result.push({ type: 'added', line: linesB[i] });
    }
  }
  return result;
}

export default function AIAuditConsole() {
  const [promptText, setPromptText] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<AIAuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [inputCopied, setInputCopied] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [hasKeys, setHasKeys] = useState(false);
  const [providerLabel, setProviderLabel] = useState('');
  const [availableProviders, setAvailableProviders] = useState<{ id: string; label: string; hasKey: boolean }[]>([]);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const loadingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setHasKeys(hasApiKeys());
    setProviderLabel(getActiveProviderLabel());
    setAvailableProviders(getAvailableProviders());
    setSelectedProvider(getPreferredProvider());
    setIsLoggedIn(!!localStorage.getItem('user_session'));
  }, []);

  // loading steps cycle to make the UI feel responsive and alive
  useEffect(() => {
    if (loading) {
      setLoadingStep(0);
      loadingTimerRef.current = setInterval(() => {
        setLoadingStep(prev => (prev + 1) % 4);
      }, 1500);
    } else {
      if (loadingTimerRef.current) {
        clearInterval(loadingTimerRef.current);
      }
    }
    return () => {
      if (loadingTimerRef.current) {
        clearInterval(loadingTimerRef.current);
      }
    };
  }, [loading]);

  const handleClear = () => {
    setPromptText('');
    setResult(null);
    setError(null);
    setShowDiff(false);
  };

  const handleAudit = async () => {
    if (!promptText.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const auditReport = await runAIPromptAudit(promptText);
      setResult(auditReport);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColorClass = (score: number) => {
    if (score >= 80) return 'text-score-excellent';
    if (score >= 60) return 'text-score-good';
    if (score >= 40) return 'text-score-warning';
    return 'text-score-critical';
  };

  const getScoreBgClass = (score: number) => {
    if (score >= 80) return 'bg-score-excellent-subtle border-score-excellent-border';
    if (score >= 60) return 'bg-score-good-subtle border-primary-border';
    if (score >= 40) return 'bg-score-warning-subtle border-score-warning-border';
    return 'bg-score-critical-subtle border-score-critical-border';
  };

  const getScoreBadgeClass = (score: number) => {
    if (score >= 80) return 'bg-score-excellent/10 text-score-excellent border-score-excellent-border';
    if (score >= 60) return 'bg-primary/10 text-primary border-primary-border';
    if (score >= 40) return 'bg-score-warning/10 text-score-warning border-score-warning-border';
    return 'bg-score-critical/10 text-score-critical border-score-critical-border';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Production Ready';
    if (score >= 80) return 'Strong Quality';
    if (score >= 60) return 'Acceptable Quality';
    if (score >= 40) return 'Needs Optimization';
    return 'Severe Vulnerabilities';
  };

  const getLoadingMessage = () => {
    switch (loadingStep) {
      case 0: return 'Initializing secure API connection...';
      case 1: return 'Evaluating clarity & instruction density...';
      case 2: return 'Auditing safety boundaries & injection risks...';
      case 3: return 'Compiling structural feedback & optimizations...';
      default: return 'Running AI Audit...';
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
        <div className="w-14 h-14 rounded-full bg-primary-subtle border border-primary-border flex items-center justify-center text-primary">
          <Sparkles className="w-7 h-7" />
        </div>
        <div className="max-w-md">
          <h3 className="text-lg font-semibold text-text-primary">Sign in to use AI Auditor</h3>
          <p className="text-sm text-text-secondary mt-2 leading-relaxed">
            The AI Auditor requires a free account and your own API key. Create an account, add your API key in Settings, and you're ready to go.
          </p>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <a
            href="/signup"
            className="inline-flex items-center px-5 h-10 bg-primary hover:bg-primary-hover text-text-on-primary text-sm font-semibold rounded-lg transition-fast no-underline"
          >
            Create Free Account
          </a>
          <a
            href="/login"
            className="inline-flex items-center px-5 h-10 border border-border bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-secondary text-sm font-semibold rounded-lg transition-fast no-underline"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  if (!hasKeys) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
        <div className="w-14 h-14 rounded-full bg-score-warning-subtle border border-score-warning-border flex items-center justify-center text-score-warning">
          <AlertCircle className="w-7 h-7" />
        </div>
        <div className="max-w-md">
          <h3 className="text-lg font-semibold text-text-primary">API key required</h3>
          <p className="text-sm text-text-secondary mt-2 leading-relaxed">
            The AI Auditor uses your own API key to run audits. Add one in Settings to get started.
          </p>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <a
            href="/settings"
            className="inline-flex items-center px-5 h-10 bg-primary hover:bg-primary-hover text-text-on-primary text-sm font-semibold rounded-lg transition-fast no-underline"
          >
            Configure API Keys
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* LEFT COLUMN: WORKSPACE */}
      <div className="lg:col-span-5 flex flex-col gap-5">
        <div className="border border-border bg-surface rounded-xl shadow-subtle p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider flex items-center gap-1.5 font-sans">
              <MessageSquare className="w-4 h-4 text-primary" />
              Prompt Input
            </h3>
            {hasKeys ? (
              availableProviders.filter(p => p.hasKey).length > 1 ? (
                <select
                  value={selectedProvider}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedProvider(val);
                    setPreferredProvider(val);
                    setProviderLabel(getActiveProviderLabel());
                  }}
                  className="h-6 text-[10px] font-mono bg-surface border border-border-subtle rounded px-1.5 text-text-secondary focus:outline-none focus:border-primary cursor-pointer"
                  aria-label="Select AI provider"
                >
                  {availableProviders.filter(p => p.hasKey).map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              ) : (
                <span className="text-[10px] font-mono text-text-secondary bg-surface-secondary border border-border-subtle px-2 py-0.5 rounded">
                  {providerLabel}
                </span>
              )
            ) : (
              <span className="text-[10px] font-mono text-score-critical bg-score-critical-subtle border border-score-critical-border px-2 py-0.5 rounded animate-pulse">
                Keys Missing
              </span>
            )}
          </div>

          {/* Preset templates selector */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="example-select" className="text-[10px] font-mono text-text-secondary uppercase font-semibold">Load Preset</label>
            <select
              id="example-select"
              value=""
              onChange={(e) => {
                const selected = e.target.value;
                if (selected) {
                  const found = EXAMPLE_PROMPTS.find(p => p.value === selected);
                  if (found) setPromptText(found.prompt);
                }
              }}
              className="h-8 px-3 bg-surface border border-border rounded-md text-xs font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer transition-default w-full"
            >
              {EXAMPLE_PROMPTS.map((p) => (
                <option key={p.value} value={p.value} disabled={p.value === ''}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Prompt template textarea input */}
          <div className="relative">
            <label htmlFor="prompt-input" className="sr-only">Prompt template text</label>
            <textarea
              id="prompt-input"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="Paste prompt to audit with AI... (e.g. 'Generate an email draft context...')"
              className="w-full min-h-[45vh] p-4 pt-12 pr-12 bg-surface border border-border rounded-xl text-sm font-mono leading-relaxed placeholder:text-text-tertiary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-default resize-y"
              required
            />
            {promptText && (
              <div className="absolute top-3 right-3 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(promptText);
                    setInputCopied(true);
                    setTimeout(() => setInputCopied(false), 2000);
                  }}
                  className="text-text-tertiary hover:text-text-primary p-1.5 rounded-md hover:bg-surface-secondary transition-fast cursor-pointer"
                  title="Copy prompt"
                  aria-label="Copy input prompt text"
                >
                  {inputCopied ? <Check className="w-3.5 h-3.5 text-score-excellent" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-text-tertiary hover:text-text-primary p-1.5 rounded-md hover:bg-surface-secondary transition-fast cursor-pointer"
                  title="Clear input"
                  aria-label="Clear prompt text input"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Prompt details & Run Audit Trigger */}
          <div className="flex items-center justify-between border-t border-border-subtle pt-4">
            <div className="flex gap-4 text-[10px] font-mono text-text-tertiary">
              <span>Chars: <strong className="text-text-secondary">{promptText.length}</strong></span>
              <span>Words: <strong className="text-text-secondary">{promptText.trim() === '' ? 0 : promptText.trim().split(/\s+/).length}</strong></span>
            </div>

            <button
              type="button"
              onClick={handleAudit}
              disabled={loading || !promptText.trim() || !hasKeys}
              className="px-4 h-9 bg-primary hover:bg-primary-hover disabled:opacity-disabled disabled:pointer-events-none text-text-on-primary text-xs font-semibold rounded-md transition-fast flex items-center gap-1.5 cursor-pointer button-press border border-primary/20 shadow-sm"
            >
              {loading ? (
                <><svg className="animate-spin h-3.5 w-3.5 text-text-on-primary" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg><span>Analyzing...</span></>
              ) : (
                <><Sparkles className="w-3.5 h-3.5" /><span>Run AI Audit</span></>
              )}
            </button>
          </div>
        </div>

        {/* API keys notice */}
        {!hasKeys && (
          <div className="border border-score-critical-border bg-score-critical-subtle/40 rounded-xl p-4 flex flex-col gap-2.5 text-xs text-text-secondary leading-relaxed">
            <div className="flex items-center gap-2 font-semibold text-score-critical font-mono uppercase tracking-wider text-[10px]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              API Key Required for AI Audit
            </div>
            <p>
              AI Auditing uses model-assisted logic to find semantic security leaks, output formatting gaps, and persona bindings.
            </p>
            <a 
              href="/settings"
              className="inline-flex items-center gap-1 font-semibold text-primary hover:text-primary-hover underline transition-fast"
            >
              Configure API Keys in Settings <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: DIAGNOSTIC AUDIT RESULTS */}
      <div className="lg:col-span-7 border border-border bg-surface rounded-xl shadow-subtle min-h-[500px] p-6 flex flex-col justify-between overflow-hidden">
        
        {/* State 1: Empty State */}
        {!loading && !result && !error && (
          <div className="flex-grow flex flex-col items-center justify-center text-center py-20 gap-4">
            <div className="w-12 h-12 rounded-full bg-surface-secondary flex items-center justify-center text-text-tertiary">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-primary">No AI Audit Generated</h3>
              <p className="text-xs text-text-secondary mt-1 max-w-sm leading-relaxed font-sans">
                Paste your prompt template and click "Run AI Audit" to fetch LLM diagnostic insights.
              </p>
            </div>
          </div>
        )}

        {/* State 2: Scanning Loading State */}
        {loading && (
          <div className="flex-grow flex flex-col items-center justify-center text-center py-20 gap-4 animate-fade-in">
            <div className="relative flex items-center justify-center w-14 h-14">
              <div className="absolute inset-0 rounded-full border-4 border-surface-tertiary"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-primary">AI Auditor Active</h3>
              <p className="text-xs text-text-secondary mt-1 font-mono">{getLoadingMessage()}</p>
            </div>
          </div>
        )}

        {/* State 3: API Call Failure */}
        {error && (
          <div className="flex-grow flex flex-col items-center justify-center text-center py-16 gap-4">
            <div className="w-12 h-12 rounded-full bg-score-critical-subtle text-score-critical flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Audit Request Failed</h3>
              <p className="text-xs text-text-secondary mt-1 max-w-md leading-relaxed font-mono bg-surface-secondary/40 border border-border-subtle p-3 rounded-lg text-left whitespace-pre-wrap">
                {error}
              </p>
            </div>
            <button
              type="button"
              onClick={handleAudit}
              className="px-4 py-2 border border-border bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-secondary text-xs font-semibold rounded-md transition-fast"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* State 4: Audit Report Presentation */}
        {result && !loading && !error && (
          <div className="flex-grow flex flex-col gap-6 animate-fade-in">
            
            {/* Report Header */}
            <div className="flex flex-col gap-4 border-b border-border-subtle pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-text-primary flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-primary" />
                    AI Diagnostic Quality Report
                  </h3>
                  <p className="text-xs text-text-secondary">
                    Evaluated by <strong className="text-text-primary font-medium">{result.metadata?.model || 'AI Engine'}</strong> · {new Date(result.metadata?.timestamp || Date.now()).toLocaleTimeString()}
                  </p>
                </div>
                <span className={`px-2 py-0.5 text-xs font-mono font-semibold border rounded ${getScoreBadgeClass(result.overallScore)}`}>
                  {result.passed ? 'PASS' : 'FAIL'}
                </span>
              </div>
            </div>

            {/* Score Breakdown Panels */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Overall metric card */}
              <div className={`sm:col-span-1 border rounded-xl p-4 flex flex-col justify-center items-center text-center ${getScoreBgClass(result.overallScore)}`}>
                <span className="text-[10px] text-text-secondary uppercase font-semibold tracking-wider mb-1">AI Quality Score</span>
                <div className="flex items-baseline font-mono">
                  <span className={`text-4xl font-semibold tracking-tight ${getScoreColorClass(result.overallScore)}`}>
                    {result.overallScore}
                  </span>
                  <span className="text-sm text-text-tertiary">/100</span>
                </div>
                <span className={`text-[10px] font-semibold mt-1 ${getScoreColorClass(result.overallScore)}`}>
                  {getScoreLabel(result.overallScore)}
                </span>
              </div>

              {/* Dimensions grids */}
              <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(result.dimensions).map(([dimKey, dim]) => {
                  const radius = 14;
                  const strokeWidth = 2.5;
                  const circumference = 2 * Math.PI * radius;
                  const strokeDashoffset = circumference - (dim.score / 100) * circumference;

                  return (
                    <div 
                      key={dimKey} 
                      className="border border-border-subtle bg-surface-secondary/30 p-2 rounded-lg flex items-center justify-between gap-2.5 relative group"
                      title={dim.feedback}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded bg-surface border border-border flex items-center justify-center shrink-0 text-text-secondary">
                          <Zap className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[10px] text-text-secondary font-medium truncate">{dim.name}</span>
                          <span className="text-xs font-mono font-semibold text-text-primary">{dim.score}/100</span>
                        </div>
                      </div>
                      
                      <svg className="w-7 h-7 shrink-0 -rotate-90" viewBox="0 0 40 40">
                        <circle cx="20" cy="20" r={radius} stroke="var(--color-surface-tertiary)" strokeWidth={strokeWidth} fill="transparent" />
                        <circle
                          cx="20"
                          cy="20"
                          r={radius}
                          stroke={`var(--color-score-${dim.score >= 80 ? 'excellent' : dim.score >= 60 ? 'good' : dim.score >= 40 ? 'warning' : 'critical'})`}
                          strokeWidth={strokeWidth}
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                          fill="transparent"
                        />
                      </svg>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* AI Findings Checklist */}
            <div className="border border-border bg-surface-secondary/20 rounded-lg p-4">
              <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <List className="w-4 h-4 text-primary" />
                AI Security & Structural Findings
              </h4>
              <div className="flex flex-col gap-2.5 max-h-48 overflow-y-auto pr-1">
                {result.findings.map((finding, idx) => {
                  const severityColors: Record<string, string> = {
                    critical: 'border-score-critical-border text-score-critical bg-score-critical-subtle',
                    major: 'border-score-warning-border text-score-warning bg-score-warning-subtle',
                    minor: 'border-primary-border text-primary bg-primary-subtle',
                    pass: 'border-score-excellent-border text-score-excellent bg-score-excellent-subtle'
                  };
                  return (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-text-secondary leading-relaxed border-b border-border-subtle/30 pb-2 last:border-b-0 last:pb-0">
                      {finding.passed ? (
                        <div className="w-4 h-4 rounded bg-success-subtle text-success flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded bg-error-subtle text-error flex items-center justify-center shrink-0 mt-0.5">
                          <AlertCircle className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div className="flex-grow">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-text-primary">{finding.name}</span>
                          <span className={`px-1.5 py-0.5 text-[8px] font-mono font-semibold uppercase border rounded ${severityColors[finding.severity]}`}>
                            {finding.severity}
                          </span>
                        </div>
                        <p className="text-[11px] text-text-secondary mt-0.5">{finding.explanation}</p>
                        {finding.suggestion && (
                          <p className="text-[10px] text-text-tertiary mt-1 italic">Suggestion: {finding.suggestion}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Actionable Recommendations */}
            <div className="border border-border bg-surface-secondary/20 rounded-lg p-4">
              <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5 font-sans">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                Audit Optimization Roadmap
              </h4>
              <ul className="list-disc pl-4 text-xs text-text-secondary flex flex-col gap-1.5">
                {result.recommendations.map((rec, i) => (
                  <li key={i} className="leading-relaxed pl-0.5">{rec}</li>
                ))}
              </ul>
            </div>

            {/* AI Rewritten Optimized Prompt Card */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-text-secondary font-semibold">AI Optimized Prompt</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(result.optimizedPrompt);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="h-6 px-2.5 border border-border bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-secondary text-[10px] font-medium rounded-md transition-fast flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? <><Check className="w-3 h-3 text-score-excellent" />Copied!</> : <><Copy className="w-3 h-3" />Copy Rewrite</>}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPromptText(result.optimizedPrompt)}
                    className="h-6 px-2.5 border border-primary/30 bg-primary-subtle/20 text-primary hover:bg-primary-subtle/40 text-[10px] font-medium rounded-md transition-fast flex items-center gap-1 cursor-pointer"
                    title="Replace original input with optimized prompt text"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Apply Rewrite
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDiff(!showDiff)}
                    className={`h-6 px-2.5 border text-[10px] font-medium rounded-md transition-fast flex items-center gap-1 cursor-pointer ${showDiff ? 'bg-primary-subtle border-primary/40 text-primary' : 'border-border bg-surface text-text-secondary hover:text-text-primary'}`}
                  >
                    <FileText className="w-3 h-3" />
                    Diff
                  </button>
                </div>
              </div>

              {showDiff ? (
                <div className="border border-border rounded-xl overflow-hidden text-[10px] font-mono leading-relaxed bg-surface-secondary/40">
                  <div className="text-[9px] uppercase tracking-wider text-text-tertiary font-semibold px-3 py-1.5 border-b border-border-subtle bg-surface">
                    Visual Diff (red removed / green added)
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {computeLinesDiff(promptText, result.optimizedPrompt).map((item, i) => {
                      const bg = item.type === 'removed' ? 'bg-score-critical-subtle/60 text-score-critical' :
                        item.type === 'added' ? 'bg-score-excellent-subtle/60 text-score-excellent' :
                        'text-text-secondary';
                      const prefix = item.type === 'removed' ? '−' : item.type === 'added' ? '+' : ' ';
                      return (
                        <div key={i} className={`${bg} px-3 py-0.5 flex`}>
                          <span className="w-4 shrink-0 select-none opacity-50">{prefix}</span>
                          <span className="whitespace-pre-wrap break-all">{item.line || ' '}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="w-full bg-surface-secondary/40 border border-border rounded-xl p-4 font-mono text-xs text-text-secondary leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap select-all">
                  {result.optimizedPrompt}
                </div>
              )}
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
