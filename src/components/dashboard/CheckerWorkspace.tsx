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
  ChevronDown,
  Share2,
  Link
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
  const [showShareMenu, setShowShareMenu] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [selectedCompareModels, setSelectedCompareModels] = useState<Set<string>>(
    new Set(['gpt-4o', 'gpt-4o-mini', 'claude-3-5-sonnet', 'gemini-2.0-flash'])
  );

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hasApiKeysConfigured, setHasApiKeysConfigured] = useState(false);
  const optimizationRef = useRef<HTMLDivElement | null>(null);
  const isFixUpdateRef = useRef(false);

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const getModelCompareData = () => {
    if (!result) return [];
    const failedRuleIds = result.rules.filter(r => !r.passed).map(r => r.id);
    const baseScore = result.overallScore;

    const allModels = [
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        provider: 'OpenAI',
        tier: 'Premium Model',
        cost: '$$$',
        score: (() => {
          let s = baseScore;
          if (failedRuleIds.includes('p-persona-continuity')) s -= 2;
          if (failedRuleIds.includes('p-instruction-clarity')) s -= 4;
          if (failedRuleIds.includes('s-injection-guard')) s -= 5;
          return Math.max(40, Math.min(100, s));
        })(),
        notes: failedRuleIds.includes('p-instruction-clarity') 
          ? 'Implicit reasoning handles most parts, but clarity flaws will cause drift.' 
          : 'High compatibility. Robust safety and complex logic mapping.'
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        provider: 'OpenAI',
        tier: 'Compact (Cost-Efficient)',
        cost: '$',
        score: (() => {
          let s = baseScore;
          if (failedRuleIds.includes('p-persona-continuity')) s -= 8;
          if (failedRuleIds.includes('p-instruction-clarity')) s -= 12;
          if (failedRuleIds.includes('s-injection-guard')) s -= 15;
          if (failedRuleIds.includes('c-xml-tagging')) s -= 8;
          if (promptText.length > 3000) s -= 6;
          return Math.max(40, Math.min(100, s));
        })(),
        notes: failedRuleIds.includes('s-injection-guard')
          ? 'Needs safety isolation. Highly vulnerable to instructions override.'
          : failedRuleIds.includes('p-instruction-clarity')
          ? 'Struggles with implicit steps. Needs explicit numbered instruction blocks.'
          : 'Highly recommended for compact deployment. Fast and lightweight.'
      },
      {
        id: 'claude-3-5-sonnet',
        name: 'Claude 3.5 Sonnet',
        provider: 'Anthropic',
        tier: 'Premium Model',
        cost: '$$$',
        score: (() => {
          let s = baseScore;
          if (failedRuleIds.includes('c-xml-tagging')) s -= 8;
          if (failedRuleIds.includes('p-persona-continuity')) s -= 2;
          if (failedRuleIds.includes('p-instruction-clarity')) s -= 3;
          return Math.max(40, Math.min(100, s));
        })(),
        notes: failedRuleIds.includes('c-xml-tagging')
          ? 'Claude strictly recommends using XML tags (<context>...</context>) for delimiters.'
          : 'Excellent structural parsing. Handles markdown schemas and instructions natively.'
      },
      {
        id: 'gemini-2.0-flash',
        name: 'Gemini 2.0 Flash',
        provider: 'Google',
        tier: 'Compact (Large Context)',
        cost: '$',
        score: (() => {
          let s = baseScore;
          if (failedRuleIds.includes('p-persona-continuity')) s -= 10;
          if (failedRuleIds.includes('p-instruction-clarity')) s -= 12;
          if (failedRuleIds.includes('s-injection-guard')) s -= 14;
          if (promptText.length > 5000) s += 4;
          return Math.max(40, Math.min(100, s));
        })(),
        notes: failedRuleIds.includes('p-persona-continuity')
          ? 'Lack of strict persona might cause style drifting in Gemini. Define role boundaries.'
          : 'Strong multilingual performance. Large context window makes it highly efficient.'
      },
      {
        id: 'groq-llama3-70b',
        name: 'Llama 3.1 70B',
        provider: 'Groq',
        tier: 'Open Source (Fast)',
        cost: 'Free',
        score: (() => {
          let s = baseScore;
          if (failedRuleIds.includes('p-persona-continuity')) s -= 12;
          if (failedRuleIds.includes('p-instruction-clarity')) s -= 14;
          if (failedRuleIds.includes('s-injection-guard')) s -= 18;
          if (failedRuleIds.includes('c-xml-tagging')) s -= 5;
          if (failedRuleIds.includes('t-hallucination-guard')) s -= 8;
          return Math.max(40, Math.min(100, s));
        })(),
        notes: failedRuleIds.includes('s-injection-guard')
          ? 'Open-source models are highly vulnerable to prompt injection. Add explicit output boundaries.'
          : 'Fast inference via Groq. Good for non-safety-critical workloads.'
      },
      {
        id: 'openrouter-llama3-8b',
        name: 'Llama 3.1 8B',
        provider: 'OpenRouter',
        tier: 'Free Tier',
        cost: 'Free',
        score: (() => {
          let s = baseScore;
          if (failedRuleIds.includes('p-persona-continuity')) s -= 15;
          if (failedRuleIds.includes('p-instruction-clarity')) s -= 18;
          if (failedRuleIds.includes('s-injection-guard')) s -= 22;
          if (failedRuleIds.includes('c-xml-tagging')) s -= 10;
          if (promptText.length > 2000) s -= 8;
          return Math.max(40, Math.min(100, s));
        })(),
        notes: 'Free model. Best for simple, well-structured prompts. Struggles with complex multi-step instructions.'
      },
      {
        id: 'huggingface-qwen',
        name: 'Qwen 2.5 7B',
        provider: 'HuggingFace',
        tier: 'Free (Rate-Limited)',
        cost: 'Free',
        score: (() => {
          let s = baseScore;
          if (failedRuleIds.includes('p-persona-continuity')) s -= 14;
          if (failedRuleIds.includes('p-instruction-clarity')) s -= 16;
          if (failedRuleIds.includes('s-injection-guard')) s -= 20;
          if (failedRuleIds.includes('t-hallucination-guard')) s -= 10;
          return Math.max(40, Math.min(100, s));
        })(),
        notes: 'Good multilingual support. Rate-limited. Best for straightforward tasks with clear instructions.'
      },
      {
        id: 'gpt-35-turbo',
        name: 'GPT-3.5 Turbo',
        provider: 'OpenAI',
        tier: 'Budget Model',
        cost: '$',
        score: (() => {
          let s = baseScore;
          if (failedRuleIds.includes('p-persona-continuity')) s -= 10;
          if (failedRuleIds.includes('p-instruction-clarity')) s -= 14;
          if (failedRuleIds.includes('s-injection-guard')) s -= 16;
          if (failedRuleIds.includes('c-xml-tagging')) s -= 6;
          if (promptText.length > 3000) s -= 10;
          return Math.max(40, Math.min(100, s));
        })(),
        notes: 'Budget option. Handles basic prompts well but struggles with complex reasoning and long contexts.'
      }
    ];

    return allModels
      .filter(m => selectedCompareModels.has(m.id))
      .sort((a, b) => b.score - a.score);
  };

  const toggleCompareModel = (modelId: string) => {
    setSelectedCompareModels(prev => {
      const next = new Set(prev);
      if (next.has(modelId)) {
        next.delete(modelId);
      } else {
        next.add(modelId);
      }
      return next;
    });
  };

  const ALL_COMPARE_MODELS = [
    { id: 'gpt-4o', name: 'GPT-4o' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
    { id: 'claude-3-5-sonnet', name: 'Claude 3.5' },
    { id: 'gemini-2.0-flash', name: 'Gemini Flash' },
    { id: 'groq-llama3-70b', name: 'Groq Llama 70B' },
    { id: 'openrouter-llama3-8b', name: 'OR Llama 8B' },
    { id: 'huggingface-qwen', name: 'Qwen 2.5' },
    { id: 'gpt-35-turbo', name: 'GPT-3.5 Turbo' }
  ];

  const handleRestoreHistory = (prompt: string) => {
    setPromptText(prompt);
    setResult(null);
    setOptimizationNotes(null);
    setOriginalPrompt(null);
    setShowDiff(false);
  };

  const runAnalysis = useCallback((text: string) => {
    if (!text.trim()) return;



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

  useEffect(() => {
    if (!showShareMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target as Node)) {
        setShowShareMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showShareMenu]);

  const getShareUrl = () => {
    if (!result) return window.location.href;
    const prompt = promptText;
    const model = selectedModel;
    const useCase = selectedUseCase;
    
    if (prompt.length <= 1000) {
      const origin = window.location.origin;
      return `${origin}/report?prompt=${encodeURIComponent(prompt)}&model=${encodeURIComponent(model)}&useCase=${encodeURIComponent(useCase)}`;
    }
    return `${window.location.origin}/checker`;
  };

  const handleCopyLink = () => {
    const shareUrl = getShareUrl();
    navigator.clipboard.writeText(shareUrl).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    });
  };

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

            {/* Multi-Model Comparison Matrix */}
            {result && (
              <div className="border border-border bg-surface-secondary/20 rounded-lg p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-border-subtle pb-2.5">
                  <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-primary" />
                    Multi-Model Compare Engine
                  </h4>
                  <span className="text-[10px] font-mono text-text-tertiary">Calibration Matrix</span>
                </div>

                {/* Model Toggle Chips */}
                <div className="flex flex-wrap gap-1.5">
                  {ALL_COMPARE_MODELS.map((m) => {
                    const isSelected = selectedCompareModels.has(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => toggleCompareModel(m.id)}
                        className={`h-6 px-2 text-[9px] font-mono font-semibold rounded-md border transition-fast cursor-pointer select-none ${
                          isSelected
                            ? 'bg-primary-subtle border-primary text-primary'
                            : 'bg-surface border-border text-text-tertiary hover:border-border-strong hover:text-text-secondary'
                        }`}
                      >
                        {m.name}
                      </button>
                    );
                  })}
                  {selectedCompareModels.size < ALL_COMPARE_MODELS.length && (
                    <button
                      type="button"
                      onClick={() => setSelectedCompareModels(new Set(ALL_COMPARE_MODELS.map(m => m.id)))}
                      className="h-6 px-2 text-[9px] font-mono text-text-tertiary hover:text-primary rounded-md border border-dashed border-border hover:border-primary transition-fast cursor-pointer select-none"
                    >
                      Select All
                    </button>
                  )}
                  {selectedCompareModels.size > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedCompareModels(new Set())}
                      className="h-6 px-2 text-[9px] font-mono text-text-tertiary hover:text-red-600 rounded-md border border-dashed border-border hover:border-red-500/30 transition-fast cursor-pointer select-none"
                    >
                      Clear
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 gap-2.5">
                  {getModelCompareData().length === 0 ? (
                    <div className="text-center py-4 text-[10px] text-text-tertiary">
                      Select at least one model above to compare.
                    </div>
                  ) : (
                    <>
                    {getModelCompareData().map((model) => {
                    const compatibilityClass = model.score >= 80 
                      ? 'text-score-excellent bg-score-excellent-subtle border-score-excellent-border'
                      : model.score >= 60 
                      ? 'text-primary bg-primary-subtle border-primary-border'
                      : 'text-score-critical bg-score-critical-subtle border-score-critical-border';
                    
                    return (
                      <div key={model.id} className="border border-border-subtle bg-surface p-3 rounded-lg flex flex-col gap-2 transition-fast hover:border-border hover:shadow-subtle">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-semibold text-text-primary text-xs">{model.name}</span>
                            <span className="text-[10px] font-mono text-text-tertiary px-1 bg-surface-secondary rounded border border-border-subtle">
                              {model.provider}
                            </span>
                            <span className="text-[9px] text-text-tertiary font-mono hidden sm:inline">
                              Cost: <strong className="text-primary">{model.cost}</strong>
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${compatibilityClass}`}>
                              {model.score}% Fit
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-mono text-text-secondary leading-normal">
                            {model.tier}
                          </span>
                          <span className="text-[10px] text-text-tertiary leading-relaxed">
                            {model.notes}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                    </>
                  )}
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
                  <>
                    <a
                      href={`/report?id=${result.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 h-7 border border-border bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-secondary text-[10px] font-medium rounded-md transition-fast inline-flex items-center gap-1.5 cursor-pointer button-press decoration-none"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Report</span>
                    </a>

                    <div className="relative" ref={shareMenuRef}>
                      <button
                        type="button"
                        onClick={() => setShowShareMenu(!showShareMenu)}
                        className="px-2.5 h-7 border border-border bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-secondary text-[10px] font-medium rounded-md transition-fast flex items-center gap-1.5 cursor-pointer button-press select-none"
                        title="Share report options"
                      >
                        <Share2 className="w-3 h-3" />
                        <span>Share</span>
                        <ChevronDown className="w-2.5 h-2.5 text-text-tertiary" />
                      </button>
                      {showShareMenu && (
                        <div className="absolute bottom-full right-0 mb-1 bg-surface border border-border rounded-lg shadow-lg p-1 min-w-[150px] z-10 font-sans text-[10px]">
                          <a
                            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`I just analyzed my AI prompt quality using AIQualityHQ and achieved a score of ${result.overallScore}/100! Check it out:`)}&url=${encodeURIComponent(getShareUrl())}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-2.5 py-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-secondary rounded-md transition-fast decoration-none select-none cursor-pointer"
                            onClick={() => setShowShareMenu(false)}
                          >
                            <svg className="w-3 h-3 text-text-primary" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                            <span>Share on X</span>
                          </a>
                          <a
                            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(getShareUrl())}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-2.5 py-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-secondary rounded-md transition-fast decoration-none select-none cursor-pointer"
                            onClick={() => setShowShareMenu(false)}
                          >
                            <svg className="w-3 h-3 text-[#0A66C2]" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                            </svg>
                            <span>Share on LinkedIn</span>
                          </a>
                          <a
                            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl())}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-2.5 py-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-secondary rounded-md transition-fast decoration-none select-none cursor-pointer"
                            onClick={() => setShowShareMenu(false)}
                          >
                            <svg className="w-3 h-3 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                            <span>Share on Facebook</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => { handleCopyLink(); setShowShareMenu(false); }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-secondary rounded-md transition-fast cursor-pointer select-none text-left"
                          >
                            {shareCopied ? (
                              <>
                                <Check className="w-3 h-3 text-success" />
                                <span className="text-success font-medium">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Link className="w-3 h-3" />
                                <span>Copy Share Link</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </>
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
