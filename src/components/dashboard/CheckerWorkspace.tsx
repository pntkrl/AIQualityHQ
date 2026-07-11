import React, { useState, useEffect, useRef, useCallback } from 'react';
import { analyzePrompt } from '../../lib/quality-engine/engine';
import { USE_CASES } from '../../lib/quality-engine/use-cases';
import type { AnalysisResult, DimensionType } from '../../lib/quality-engine/types';
import { optimizePrompt } from '../../lib/quality-engine/enhancer';
import { singleRuleAIFix, hasApiKeys } from '../../lib/quality-engine/ai-service';
import { calibratePrompt } from '../../lib/quality-engine/model-calibration';
import { organizePrompt } from '../../lib/quality-engine/organizer';
import RadarChart from './RadarChart';
import PromptHistory from './PromptHistory';
// Simple line-level diff
function computeLinesDiff(a: string, b: string): { type: 'same' | 'added' | 'removed' | 'modified'; line: string }[] {
  const linesA = a.split('\n');
  const linesB = b.split('\n');
  const result: { type: 'same' | 'added' | 'removed' | 'modified'; line: string }[] = [];
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

import { 
  MessageSquare, 
  Brain, 
  Layers, 
  Shield, 
  Lock, 
  ShieldCheck, 
  Check, 
  AlertCircle, 
  Sparkles,
  Download,
  Trash2,
  RefreshCw,
  Bookmark,
  Copy,
  FileText,
  BarChart3,
  Zap,
  List,
  ChevronDown
} from 'lucide-react';

const DIMENSION_ICONS: Record<DimensionType, React.ComponentType<{ className?: string }>> = {
  prompt: MessageSquare,
  memory: Brain,
  context: Layers,
  trust: Shield,
  privacy: Lock,
  security: ShieldCheck
};

const EXAMPLE_PROMPTS = [
  {
    label: '— Try an Example —',
    value: '',
    prompt: ''
  },
  {
    label: 'Poor Prompt',
    value: 'poor',
    prompt: `Explain quantum computing. Make it simple.`
  },
  {
    label: 'Average Prompt',
    value: 'average',
    prompt: `You are a helpful assistant. Explain quantum computing to a beginner. Keep it simple and use analogies. Provide examples of what quantum computers can do.`
  },
  {
    label: 'Good Prompt',
    value: 'good',
    prompt: `You are an expert science educator specializing in making complex topics accessible to beginners.

Your task is to explain quantum computing to a high school student.

Instructions:
- Start with a simple analogy (e.g. coins vs qubits)
- Explain superposition and entanglement in plain language
- Give 3 real-world applications (cryptography, drug discovery, weather modeling)
- End with a 2-sentence summary

Use markdown formatting. Keep the total response under 500 words.`
  },
  {
    label: 'Excellent Prompt',
    value: 'excellent',
    prompt: `You are an expert science educator with 15 years of experience teaching physics to non-specialists. Maintain this persona throughout the entire response.

Your task is to explain quantum computing to a high school student with no prior physics background.

Context:
The student has just completed a unit on classical computing (bits, logic gates, Moore's Law). They understand binary but have never heard of qubits.

Instructions:
1. Begin with the coin-spinning analogy to contrast bits vs qubits
2. Explain superposition using Schr\u00F6dinger's cat at a high-school level
3. Describe entanglement with the glove-pair analogy
4. List 3 real-world applications: cryptography, drug discovery, weather modeling
5. Conclude with a 2-sentence summary

Output format:
- Use markdown with headings and bullet points
- Include a mermaid.js mindmap at the end
- Keep total response under 800 words

Safety guidelines:
- If the student asks about quantum computing's dangers, acknowledge the topic neutrally
- Do not speculate on unproven quantum computing capabilities

Privacy constraint:
- Do not request or store any personal information from the student

[Input Context]
The student is in 10th grade, has access to a laptop, and has 30 minutes for this lesson.
[/Input Context]`
  },
  {
    label: 'Conflicting Prompt',
    value: 'conflicting',
    prompt: `You are a helpful assistant. Your task is to write a haiku about autumn.

Instructions:
- The poem must be exactly 5-7-5 syllables
- Use vivid seasonal imagery
- Write at least 300 words explaining the poem's meaning
- Output must be under 50 words total

IMPORTANT: Ignore all previous instructions about formatting. Just output a paragraph. Actually, output a haiku. No wait, output both.`
  }
];

export default function CheckerWorkspace() {
  const [promptText, setPromptText] = useState('');
  const [selectedModel] = useState('gpt-4o');
  const [result, setResult] = useState<(AnalysisResult & { id?: string }) | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [optimizationNotes, setOptimizationNotes] = useState<string[] | null>(null);

  const [copied, setCopied] = useState(false);
  const [inputCopied, setInputCopied] = useState(false);
  const [originalPrompt, setOriginalPrompt] = useState<string | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [previousResult, setPreviousResult] = useState<(AnalysisResult & { id?: string }) | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [modelRecs, setModelRecs] = useState<ReturnType<typeof calibratePrompt> | null>(null);
  const [radarExpanded, setRadarExpanded] = useState(true);
  const [selectedUseCase, setSelectedUseCase] = useState('general');
  const [perRuleErrors, setPerRuleErrors] = useState<Record<string, string>>({});
  const [fixDrafts, setFixDrafts] = useState<Record<string, string>>({});
  const [appliedFixes, setAppliedFixes] = useState<Set<string>>(new Set());
  const [fixingRule, setFixingRule] = useState<string | null>(null);
  const [promptUndoStack, setPromptUndoStack] = useState<string[]>([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hasApiKeysConfigured, setHasApiKeysConfigured] = useState(false);
  const optimizationRef = useRef<HTMLDivElement | null>(null);
  const isFixUpdateRef = useRef(false);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [freeUsesRemaining, setFreeUsesRemaining] = useState(10);
  const [usageBlocked, setUsageBlocked] = useState(false);

  const handleRestoreHistory = (prompt: string) => {
    setPromptText(prompt);
    setResult(null);
    setOptimizationNotes(null);
    setOriginalPrompt(null);
    setShowDiff(false);
  };

  const runAnalysis = useCallback((text: string) => {
    if (!text.trim()) return;

    // Track free uses for anonymous users
    if (!isLoggedIn) {
      const remaining = parseInt(localStorage.getItem('aiq_free_uses_remaining') || '10', 10);
      if (remaining <= 0) {
        setUsageBlocked(true);
        return;
      }
      const newRemaining = remaining - 1;
      localStorage.setItem('aiq_free_uses_remaining', String(newRemaining));
      setFreeUsesRemaining(newRemaining);
      if (newRemaining <= 0) setUsageBlocked(true);
    }

    const analysis = analyzePrompt(text, selectedUseCase);
    let id = '';
    try {
      id = Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      const record = { id, prompt: text, model: selectedModel, result: analysis, timestamp: Date.now() };
      const history = JSON.parse(localStorage.getItem('aiq_history') || '[]');
      history.unshift(record);
      localStorage.setItem('aiq_history', JSON.stringify(history));
    } catch {
      setToast('Could not save to history. Storage may be full.');
    }
    setModelRecs(calibratePrompt(text));
    setPreviousResult(result);
    setResult({ ...analysis, id });
    setShowComparison(false);
    setIsSaved(false);
    setIsDirty(false);
    setOptimizationNotes(null);
  }, [selectedModel, selectedUseCase]);

  useEffect(() => {
    setHasApiKeysConfigured(hasApiKeys());

    const session = localStorage.getItem('user_session');
    const loggedIn = !!session;
    setIsLoggedIn(loggedIn);

    if (!loggedIn) {
      const remaining = parseInt(localStorage.getItem('aiq_free_uses_remaining') || '10', 10);
      setFreeUsesRemaining(remaining);
      if (remaining <= 0) setUsageBlocked(true);
    }
  }, []);

  useEffect(() => {
    if (isFixUpdateRef.current) {
      isFixUpdateRef.current = false;
      return;
    }
    setAppliedFixes(new Set());
    setFixDrafts({});
  }, [promptText]);

  useEffect(() => {
    if (!result || appliedFixes.size === 0) return;
    const stillFailing: string[] = [];
    const nowPassing: string[] = [];
    for (const id of appliedFixes) {
      const ruleResult = result.rules.find(r => r.id === id);
      if (!ruleResult) continue;
      if (ruleResult.passed) nowPassing.push(id);
      else stillFailing.push(id);
    }
    if (stillFailing.length > 0) {
      setAppliedFixes(prev => {
        const next = new Set(prev);
        stillFailing.forEach(id => next.delete(id));
        return next;
      });
      const names = stillFailing.map(id => result.rules.find(r => r.id === id)?.name || id);
      setPerRuleErrors(prev => {
        const next = { ...prev };
        stillFailing.forEach(id => { next[id] = 'Fix applied but rule still failing. Try generating a different fix.'; });
        return next;
      });
    }
  }, [result]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!promptText.trim()) {
      setResult(null);
      return;
    }
    debounceRef.current = setTimeout(() => runAnalysis(promptText), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [promptText, runAnalysis]);

  useEffect(() => {
    if (optimizationNotes && optimizationRef.current) {
      optimizationRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [optimizationNotes]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  useEffect(() => {
    if (!showExportMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showExportMenu]);

  const handleSaveToLibrary = () => {
    if (!promptText.trim()) return;
    const tplName = prompt('Enter a name for this prompt template:', 'Verified Prompt Template');
    if (!tplName) return;

    const newTpl = {
      id: 'tpl-' + Math.random().toString(36).substring(2, 9),
      name: tplName.trim(),
      description: `Saved from checker workspace with quality score: ${result?.overallScore || 'N/A'}/100.`,
      promptText: promptText,
      tags: ['Verified', 'Workspace'],
      lastModified: Date.now()
    };

    try {
      const library = JSON.parse(localStorage.getItem('aiq_library') || '[]');
      library.unshift(newTpl);
      localStorage.setItem('aiq_library', JSON.stringify(library));
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch {
      setToast('Could not save to library. Storage may be full.');
    }
  };

  const handleClear = () => {
    setPromptText('');
    setResult(null);
    setIsSaved(false);
    setOptimizationNotes(null);
    setOriginalPrompt(null);
    setShowDiff(false);
  };

  const handleOrganize = () => {
    if (!promptText.trim()) return;
    const result = organizePrompt(promptText);
    setPromptUndoStack(prev => [...prev, promptText]);
    setOriginalPrompt(promptText);
    setPromptText(result.organized);
    setShowDiff(true);
    setToast(result.changes.join(' '));
  };

  const handleApplyAllFixes = () => {
    if (!result) return;
    const failedRuleIds = result.rules.filter(r => !r.passed).map(r => r.id);
    if (failedRuleIds.length === 0) return;
    const enhancement = optimizePrompt(promptText, failedRuleIds);
    setPromptUndoStack(prev => [...prev, promptText]);
    setOriginalPrompt(promptText);
    setPromptText(enhancement.optimizedPrompt);
    setShowDiff(true);
    setAppliedFixes(new Set(failedRuleIds));
    setToast(enhancement.changesMade.join(' '));
  };

  const handleUndo = () => {
    if (promptUndoStack.length === 0) return;
    const previous = promptUndoStack[promptUndoStack.length - 1];
    setPromptUndoStack(prev => prev.slice(0, -1));
    setOriginalPrompt(promptText);
    setPromptText(previous);
    setShowDiff(true);
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

  const handleExportJSON = () => {
    if (!result) return;
    const data = {
      exportedAt: new Date().toISOString(),
      prompt: promptText,
      result
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-analysis-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Exceptional Quality';
    if (score >= 80) return 'Strong Quality';
    if (score >= 60) return 'Acceptable Quality';
    if (score >= 40) return 'Needs Improvement';
    return 'Critical Concerns';
  };

  if (usageBlocked) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
        <div className="w-14 h-14 rounded-full bg-primary-subtle border border-primary-border flex items-center justify-center text-primary">
          <Sparkles className="w-7 h-7" />
        </div>
        <div className="max-w-md">
          <h3 className="text-lg font-semibold text-text-primary">Free uses exhausted</h3>
          <p className="text-sm text-text-secondary mt-2 leading-relaxed">
            You've used all 10 free prompt checks. Sign up for a free account to get unlimited access — you bring your own API keys, so there are no usage limits.
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-error text-white text-xs font-medium rounded-lg shadow-floating animate-fade-in no-print">
          {toast}
        </div>
      )}

      {/* LEFT COLUMN: INPUT WORKSPACE */}
      <div className="lg:col-span-5 flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label htmlFor="prompt-input" className="text-xs font-mono text-primary font-semibold uppercase tracking-widest">
              Prompt Template Input
            </label>
            {!isLoggedIn && (
              <span className="text-[10px] font-mono text-text-secondary bg-surface-secondary border border-border-subtle px-2 py-0.5 rounded">
                {freeUsesRemaining} / 10 free uses
              </span>
            )}
          </div>
          {/* Examples dropdown */}
          <select
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
          <div className="relative">
            <textarea
              id="prompt-input"
              value={promptText}
              onChange={(e) => {
                setPromptText(e.target.value);
                if (result) setIsDirty(true);
              }}
              placeholder="Paste your prompt template here (e.g. 'You are an expert tutor. Please explain microservices…')"
              className="w-full min-h-[50vh] p-4 pt-12 pr-36 bg-surface border border-border rounded-xl text-sm font-mono leading-relaxed placeholder:text-text-tertiary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-default resize-y"
              required
            />
            {promptText && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(promptText);
                    setInputCopied(true);
                    setTimeout(() => setInputCopied(false), 2000);
                  }}
                  className="absolute top-3 right-10 text-text-tertiary hover:text-text-primary p-1 rounded-md hover:bg-surface-secondary transition-fast cursor-pointer"
                  title="Copy prompt"
                  aria-label="Copy prompt text"
                >
                  {inputCopied ? <Check className="w-4 h-4 text-score-excellent" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute top-3 right-3 text-text-tertiary hover:text-text-primary p-1 rounded-md hover:bg-surface-secondary transition-fast cursor-pointer"
                  title="Clear input"
                  aria-label="Clear prompt input"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                {promptUndoStack.length > 0 && (
                  <button
                    type="button"
                    onClick={handleUndo}
                    className="absolute top-3 right-28 text-text-tertiary hover:text-text-primary p-1 rounded-md hover:bg-surface-secondary transition-fast cursor-pointer"
                    title="Undo last change"
                    aria-label="Undo last prompt change"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleOrganize}
                  className="absolute top-3 right-20 text-text-tertiary hover:text-text-primary p-1 rounded-md hover:bg-surface-secondary transition-fast cursor-pointer"
                  title="Organize prompt"
                  aria-label="Organize prompt"
                >
                  <List className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Use case selector */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-mono text-text-secondary uppercase font-semibold">Use Case</span>
          <select
            value={selectedUseCase}
            onChange={(e) => setSelectedUseCase(e.target.value)}
            className="h-9 px-3 bg-surface border border-border rounded-md text-xs font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer transition-default w-full"
          >
            {USE_CASES.map((uc) => (
              <option key={uc.id} value={uc.id}>{uc.name}</option>
            ))}
          </select>
          <span className="text-[10px] text-text-tertiary leading-relaxed">
            {USE_CASES.find(uc => uc.id === selectedUseCase)?.description}
          </span>
        </div>

        {/* Prompt Version History */}
        <PromptHistory currentPrompt={promptText} onRestore={handleRestoreHistory} />

      </div>

      {/* RIGHT COLUMN: DIAGNOSTIC RESULTS */}
      <div className="lg:col-span-7 border border-border bg-surface rounded-xl shadow-subtle min-h-[480px] p-6 flex flex-col justify-between overflow-hidden">
        {/* State 1: Empty state */}
        {!result && !promptText.trim() && (
          <div className="flex-grow flex flex-col items-center justify-center text-center py-16 gap-4">
            <div className="w-12 h-12 rounded-full bg-surface-secondary flex items-center justify-center text-text-tertiary">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-primary">No analysis generated yet</h3>
              <p className="text-xs text-text-secondary mt-1 max-w-sm leading-relaxed">
                Start typing a prompt on the left — live scores appear automatically.
              </p>
            </div>
          </div>
        )}

        {/* State 2: Live analysis prompt (typing but no result yet) */}
        {!result && promptText.trim() && (
          <div className="flex-grow flex flex-col items-center justify-center text-center py-16 gap-4">
            <div className="relative flex items-center justify-center">
              <div className="w-10 h-10 rounded-full border-2 border-surface-tertiary"></div>
              <div className="absolute w-10 h-10 rounded-full border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Analyzing...</h3>
              <p className="text-xs text-text-secondary mt-1">Running deterministic quality checks</p>
            </div>
          </div>
        )}

        {/* State 3: Diagnostic Report View */}
        {result && (
          <div className="flex-grow flex flex-col gap-6">
            {/* Header Status */}
            <div className="flex flex-col gap-4 border-b border-border-subtle pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-text-primary">Prompt Diagnosis Report</h3>
                  <p className="text-xs text-text-secondary">
                    Analyzed {new Date(result.metadata.timestamp).toLocaleTimeString()} · {result.rules.length} rules evaluated
                    {isDirty && <span className="inline-flex items-center gap-1 ml-2 text-score-warning font-mono text-[10px] animate-pulse">⟳ Re-analyzing...</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-xs font-mono font-medium border rounded ${getScoreBadgeClass(result.overallScore)}`}>
                    {result.passed ? 'PASS' : 'FAIL'}
                  </span>
                </div>
              </div>

              {/* AI Optimization Apply Indicator */}
              {optimizationNotes && <>
                <div ref={optimizationRef} className="border border-success-subtle bg-success-subtle/10 text-success p-3 rounded-lg flex flex-col gap-1 text-xs font-sans">
                  <div className="flex items-center gap-1.5 font-semibold text-text-primary uppercase tracking-wider text-[9px] font-mono">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    AI Rewrite Optimization Applied
                  </div>
                  <ul className="list-disc pl-4 text-text-secondary flex flex-col gap-0.5 mt-1 font-sans">
                    {optimizationNotes.map((note, i) => (
                      <li key={i}>{note}</li>
                    ))}
                  </ul>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(promptText);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="h-6 px-2 text-[10px] font-mono border border-success/30 bg-success-subtle/20 text-text-primary hover:bg-success-subtle/40 rounded transition-fast cursor-pointer flex items-center gap-1"
                    >
                      {copied ? <><Check className="w-3 h-3" />Copied!</> : <><Copy className="w-3 h-3" />Copy prompt</>}
                    </button>
                    {originalPrompt && (
                      <button
                        type="button"
                        onClick={() => setShowDiff(!showDiff)}
                        className="h-6 px-2 text-[10px] font-mono border border-primary/30 bg-primary-subtle/20 text-text-primary hover:bg-primary-subtle/40 rounded transition-fast cursor-pointer flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3" />
                        {showDiff ? 'Hide diff' : 'Show diff'}
                      </button>
                    )}
                  </div>
                  {showDiff && originalPrompt && (
                    <div className="mt-3 border border-border-subtle rounded-lg overflow-hidden">
                      <div className="text-[9px] uppercase tracking-wider text-text-tertiary font-semibold px-3 py-1.5 bg-surface-secondary/30 border-b border-border-subtle">
                        Changes (red removed / green added)
                      </div>
                      <div className="max-h-48 overflow-y-auto text-[10px] font-mono leading-relaxed">
                        {computeLinesDiff(originalPrompt, promptText).map((item, i) => {
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
                  )}
                </div>
              </>}
            </div>

            {/* Score Grid Panel */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Overall weighted metric */}
                <div className={`sm:col-span-1 border rounded-xl p-4 flex flex-col justify-center items-center text-center ${getScoreBgClass(result.overallScore)}`}>
                <span className="text-[10px] text-text-secondary uppercase font-semibold tracking-wider mb-1">Overall Score</span>
                <div className="flex items-baseline font-mono">
                  <span className={`text-4xl font-semibold tracking-tight ${getScoreColorClass(result.overallScore)}`}>
                    {result.overallScore}
                  </span>
                  <span className="text-sm text-text-tertiary">/100</span>
                </div>
                <span className={`text-[10px] font-semibold mt-1 ${getScoreColorClass(result.overallScore)}`}>
                  {getScoreLabel(result.overallScore)}
                </span>
                {result.overallScore >= 90 && (
                  <span className="text-[9px] text-text-tertiary mt-2 leading-tight max-w-[200px]">
                    90–95 is production-ready. Chasing 100 adds redundant boilerplate.
                  </span>
                )}
                {previousResult && (
                  <button
                    type="button"
                    onClick={() => setShowComparison(!showComparison)}
                    className={`mt-2 h-5 px-2 text-[9px] font-mono border rounded transition-fast cursor-pointer flex items-center gap-1 ${showComparison ? 'bg-primary/10 text-primary border-primary/30' : 'bg-surface text-text-secondary border-border hover:border-primary/30 hover:text-primary'}`}
                  >
                    {showComparison ? 'Hide comparison' : `vs previous (${previousResult.overallScore})`}
                  </button>
                )}
              </div>

              {showComparison && previousResult && (
                <div className="sm:col-span-2 border border-border-subtle bg-surface-secondary/40 rounded-xl p-3">
                  <span className="text-[9px] font-mono text-text-tertiary uppercase tracking-wider font-semibold">Score Comparison</span>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {(Object.keys(result.dimensions) as DimensionType[]).map((dimKey) => {
                      const current = result.dimensions[dimKey];
                      const previous = previousResult.dimensions[dimKey];
                      const diff = current.score - previous.score;
                      return (
                        <div key={dimKey} className="text-xs flex items-center justify-between">
                          <span className="text-text-secondary truncate">{current.name}</span>
                          <span className="font-mono flex items-center gap-1">
                            <span className="text-text-tertiary">{previous.score}</span>
                            <span className="text-text-tertiary">→</span>
                            <span className={getScoreColorClass(current.score)}>{current.score}</span>
                            <span className={diff > 0 ? 'text-score-excellent text-[10px]' : diff < 0 ? 'text-score-critical text-[10px]' : 'text-text-tertiary text-[10px]'}>
                              {diff > 0 ? `▲${diff}` : diff < 0 ? `▼${Math.abs(diff)}` : '–'}
                            </span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Dimensions breakdown (6 grid slots) */}
              <div className="sm:col-span-2 grid grid-cols-2 gap-2">
                {(Object.keys(result.dimensions) as DimensionType[]).map((dimKey) => {
                  const dim = result.dimensions[dimKey];
                  const Icon = DIMENSION_ICONS[dimKey];
                  
                  const radius = 14;
                  const strokeWidth = 2.5;
                  const circumference = 2 * Math.PI * radius;
                  const strokeDashoffset = circumference - (dim.score / 100) * circumference;

                  return (
                    <div 
                      key={dimKey} 
                      className="border border-border-subtle bg-surface-secondary/40 p-2.5 rounded-lg flex items-center justify-between gap-2.5 relative group"
                      title={result.rules.filter(r => r.dimension === dimKey).map(r => `${r.name}: ${r.score}/100 ${r.passed ? '✓' : '✗'}`).join('\n')}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded bg-surface border border-border flex items-center justify-center shrink-0 text-text-secondary">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[10px] text-text-secondary font-medium truncate">{dim.name}</span>
                          <span className="text-xs font-mono font-semibold text-text-primary">{dim.score}/100</span>
                        </div>
                      </div>
                      
                      <svg
                        className="w-7 h-7 shrink-0 -rotate-90"
                        viewBox="0 0 40 40"
                        role="progressbar"
                        aria-valuenow={dim.score}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${dim.name}: ${dim.score} out of 100`}
                      >
                        <circle
                          cx="20"
                          cy="20"
                          r={radius}
                          stroke="var(--color-surface-tertiary)"
                          strokeWidth={strokeWidth}
                          fill="transparent"
                        />
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

              {/* Radar Chart */}
              <div className="sm:col-span-1">
                <button
                  type="button"
                  onClick={() => setRadarExpanded(!radarExpanded)}
                  className="w-full flex items-center justify-between px-3 py-2 border border-border-subtle bg-surface-secondary/40 rounded-lg text-xs text-text-secondary hover:text-text-primary transition-fast cursor-pointer"
                >
                  <span className="flex items-center gap-1.5 font-medium">
                    <BarChart3 className="w-3.5 h-3.5" />
                    Radar View
                  </span>
                  <span className="text-[10px] text-text-tertiary">{radarExpanded ? 'hide' : 'show'}</span>
                </button>
                {radarExpanded && (
                  <div className="mt-2 border border-border-subtle bg-surface-secondary/20 rounded-lg p-2 flex items-center justify-center">
                    <RadarChart
                      scores={Object.fromEntries(
                        (Object.entries(result.dimensions) as [string, { name: string; score: number }][]).map(([k, d]) => [k, d])
                      )}
                      size={160}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Fix Checklist — per-rule fixes */}
            <div className="border border-border bg-surface-secondary/20 rounded-lg p-4">
              <div className="flex items-start justify-between gap-3 mb-1.5">
                <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  Fix Checklist
                </h4>
                {result.rules.filter(r => !r.passed).length > 0 && (
                  <button
                    type="button"
                    onClick={handleApplyAllFixes}
                    className="shrink-0 h-6 px-2 border border-primary/30 bg-primary-subtle/20 text-primary hover:bg-primary-subtle/40 text-[9px] font-semibold rounded-md transition-fast flex items-center gap-1 cursor-pointer button-press"
                    title="Apply default fixes for all failing rules at once"
                  >
                    <Zap className="w-3 h-3" />
                    Apply All Fixes
                  </button>
                )}
              </div>
              <p className="text-[11px] text-text-secondary leading-relaxed mb-3">
                Score 90–95 is production-ready. Chasing 100 adds redundant boilerplate to trigger keyword checks — it inflates token count without improving real prompt quality. Focus on fixing the rules that matter for your use case.
              </p>

              {result.rules.filter(r => !r.passed).length === 0 ? (
                <div className="text-xs text-score-excellent font-medium text-center py-2">
                  All rules pass — perfect score!
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {result.rules.filter(r => !r.passed).map(rule => {
                    const isApplied = appliedFixes.has(rule.id);
                    const draft = fixDrafts[rule.id] ?? rule.suggestion ?? '';
                    return (
                      <div key={rule.id} className={`border rounded-lg p-3 transition-default ${isApplied ? 'border-success-subtle bg-success-subtle/5' : rule.severity === 'critical' ? 'border-score-critical-border bg-score-critical-subtle/5' : 'border-border-subtle bg-surface/50'}`}>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {isApplied ? (
                              <div className="w-4 h-4 rounded bg-success-subtle text-success flex items-center justify-center shrink-0">
                                <Check className="w-3 h-3" />
                              </div>
                            ) : (
                              <AlertCircle className={`w-3.5 h-3.5 shrink-0 ${rule.severity === 'critical' ? 'text-score-critical' : 'text-score-warning'}`} />
                            )}
                            <span className={`text-xs font-medium ${isApplied ? 'text-success line-through' : 'text-text-primary'}`}>{rule.name}</span>
                            <span className={`px-1.5 py-0.5 text-[9px] font-mono font-semibold uppercase border rounded ${rule.severity === 'critical' ? 'border-score-critical-border text-score-critical' : rule.severity === 'major' ? 'border-score-warning-border text-score-warning' : 'border-primary-border text-primary'}`}>
                              {rule.severity}
                            </span>
                          </div>
                        </div>
                        <p className="text-[10px] text-text-tertiary mb-2 leading-relaxed">{rule.explanation}</p>
                        {!isApplied && (
                          <>
                            <textarea
                              value={draft}
                              onChange={(e) => setFixDrafts(prev => ({ ...prev, [rule.id]: e.target.value }))}
                              className="w-full p-2 bg-surface border border-border rounded-md text-[11px] font-mono leading-relaxed text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-default resize-none h-14"
                              placeholder="Enter your fix text..."
                            />
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                type="button"
                                onClick={async () => {
                                  setFixingRule(rule.id);
                                  setPerRuleErrors(prev => { const n = { ...prev }; delete n[rule.id]; return n; });
                                  try {
                                    const fixText = hasApiKeysConfigured
                                      ? await singleRuleAIFix(promptText, rule)
                                      : rule.suggestion || '';
                                    setFixDrafts(prev => ({ ...prev, [rule.id]: fixText }));
                                  } catch (err) {
                                    setPerRuleErrors(prev => ({ ...prev, [rule.id]: (err as Error).message }));
                                    setFixDrafts(prev => ({ ...prev, [rule.id]: rule.suggestion || '' }));
                                  }
                                  setFixingRule(null);
                                }}
                                disabled={fixingRule === rule.id}
                                className="h-7 px-2.5 bg-primary hover:bg-primary-hover disabled:opacity-disabled disabled:pointer-events-none text-text-on-primary text-[10px] font-semibold rounded-md transition-fast flex items-center gap-1 cursor-pointer button-press border border-primary/20 shadow-sm"
                              >
                                {fixingRule === rule.id ? (
                                  <><svg className="animate-spin h-3 w-3 text-text-on-primary" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg><span>Generating...</span></>
                                ) : (
                                  <><Sparkles className="w-3 h-3" /><span>Generate</span></>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const alreadyPasses = result.rules.find(r => r.id === rule.id)?.passed ?? false;
                                  if (alreadyPasses) {
                                    setAppliedFixes(prev => new Set(prev).add(rule.id));
                                    return;
                                  }
                                  const userText = fixDrafts[rule.id]?.trim() || '';
                                  let newPrompt: string;
                                  if (userText) {
                                    newPrompt = promptText + '\n\n' + userText;
                                  } else {
                                    const enhancement = optimizePrompt(promptText, [rule.id]);
                                    newPrompt = enhancement.changesMade.length > 0 ? enhancement.optimizedPrompt : promptText;
                                  }
                                  isFixUpdateRef.current = true;
                                  setPromptUndoStack(prev => [...prev, promptText]);
                                  setOriginalPrompt(promptText);
                                  setPromptText(newPrompt);
                                  setShowDiff(true);
                                  setAppliedFixes(prev => new Set(prev).add(rule.id));
                                }}
                                className="h-7 px-2.5 border border-border bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-secondary text-[10px] font-medium rounded-md transition-fast flex items-center gap-1 cursor-pointer button-press"
                              >
                                <Check className="w-3 h-3" />
                                <span>Apply Fix</span>
                              </button>
                            </div>
                            {perRuleErrors[rule.id] && (
                              <div className="mt-2 p-2 border border-error bg-error-subtle rounded-md">
                                <p className="text-[10px] text-error/80 leading-relaxed break-words font-mono">{perRuleErrors[rule.id]}</p>
                                <p className="text-[9px] text-error/60 mt-1">Check your API keys in Settings or top up your credits.</p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Model Calibration */}
            {modelRecs && modelRecs.length > 0 && (
              <div className="border border-border-subtle bg-surface-secondary/20 rounded-lg p-3">
                <h4 className="text-[10px] font-mono text-text-tertiary uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-score-excellent" />
                  Model Fit Recommendations
                </h4>
                <div className="flex flex-col gap-1.5">
                  {modelRecs.map((rec) => {
                    const colors: Record<string, string> = {
                      excellent: 'border-score-excellent-border text-score-excellent bg-score-excellent-subtle',
                      good: 'border-primary-border text-primary bg-primary-subtle',
                      fair: 'border-score-warning-border text-score-warning bg-score-warning-subtle',
                      poor: 'border-score-critical-border text-score-critical bg-score-critical-subtle',
                    };
                    return (
                      <div key={rec.model} className="flex items-center gap-2 text-[11px]">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold uppercase border ${colors[rec.fit]}`}>
                          {rec.fit}
                        </span>
                        <span className="font-medium text-text-primary shrink-0">{rec.model}</span>
                        <span className="text-text-tertiary truncate">{rec.reason}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recommendations accordion & checks */}
            <div className="flex flex-col gap-4">
              <div>
                <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-2">Evaluation Factors</h4>
                <div className="flex flex-col gap-2">
                  {result.rules.map((rule) => {
                    const severityColor = rule.severity === 'critical' ? 'border-score-critical-border text-score-critical bg-score-critical-subtle' :
                      rule.severity === 'major' ? 'border-score-warning-border text-score-warning bg-score-warning-subtle' :
                      rule.severity === 'minor' ? 'border-primary-border text-primary bg-primary-subtle' :
                      'border-score-excellent-border text-score-excellent bg-score-excellent-subtle';
                    return (
                      <div key={rule.id} className="flex items-start gap-2 text-xs text-text-secondary">
                        {rule.passed ? (
                          <div className="w-4 h-4 rounded bg-success-subtle text-success flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-3 h-3" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded bg-error-subtle text-error flex items-center justify-center shrink-0 mt-0.5">
                            <AlertCircle className="w-3 h-3" />
                          </div>
                        )}
                        <span className="flex-1 min-w-0">
                          <span className="inline-flex items-center gap-1.5">
                            <strong className="text-text-primary font-medium">{rule.name}</strong>
                            {rule.severity !== 'pass' && (
                              <span className={`px-1.5 py-0.5 text-[9px] font-mono font-semibold uppercase border rounded ${severityColor}`}>
                                {rule.severity}
                              </span>
                            )}
                          </span>
                          <span className="block mt-0.5">{rule.explanation}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actionable recommendations box */}
              {result.recommendations.length > 0 && (
                <div className="border border-border bg-surface-secondary/30 rounded-lg p-4 mb-3">
                  <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    Actionable Recommendations
                  </h4>
                  <ol className="list-decimal pl-4 flex flex-col gap-2 text-xs text-text-secondary">
                    {result.recommendations.map((rec, i) => (
                      <li key={i} className="leading-relaxed pl-1">{rec}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="border-t border-border-subtle pt-4 mt-auto flex items-center justify-between gap-4">
              <span className="text-[11px] font-mono text-text-tertiary">
                {result.metadata.charCount} chars · {result.metadata.wordCount} words
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSaveToLibrary}
                  className="px-2.5 h-7 border border-border bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-secondary text-[10px] font-medium rounded-md transition-fast flex items-center gap-1.5 cursor-pointer button-press"
                  title="Save prompt template to Shared Library"
                >
                  <Bookmark className="w-3 h-3" />
                  <span>{isSaved ? 'Saved!' : 'Save'}</span>
                </button>
                {result.id && (
                  <a
                    href={`/report?id=${result.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 h-7 border border-border bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-secondary text-[10px] font-medium rounded-md transition-fast inline-flex items-center gap-1.5 cursor-pointer button-press decoration-none"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Report</span>
                  </a>
                )}
                <div className="relative" ref={exportMenuRef}>
                  <button
                    type="button"
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="px-2.5 h-7 border border-border bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-secondary text-[10px] font-medium rounded-md transition-fast flex items-center gap-1.5 cursor-pointer button-press"
                    title="Export options"
                  >
                    <Download className="w-3 h-3" />
                    <span>Export</span>
                    <ChevronDown className="w-2.5 h-2.5 text-text-tertiary" />
                  </button>
                  {showExportMenu && (
                    <div className="absolute bottom-full right-0 mb-1 bg-surface border border-border rounded-lg shadow-lg p-1 min-w-[140px] z-10">
                      <button
                        type="button"
                        onClick={() => { handleExportJSON(); setShowExportMenu(false); }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[10px] text-text-secondary hover:text-text-primary hover:bg-surface-secondary rounded-md transition-fast cursor-pointer"
                      >
                        <Download className="w-3 h-3" />
                        Export JSON
                      </button>
                      <button
                        type="button"
                        onClick={() => { window.print(); setShowExportMenu(false); }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[10px] text-text-secondary hover:text-text-primary hover:bg-surface-secondary rounded-md transition-fast cursor-pointer"
                      >
                        <FileText className="w-3 h-3" />
                        Print
                      </button>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => runAnalysis(promptText)}
                  className="px-2.5 h-7 border border-border bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-secondary text-[10px] font-medium rounded-md transition-fast flex items-center gap-1.5 cursor-pointer button-press"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Re-analyze</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
