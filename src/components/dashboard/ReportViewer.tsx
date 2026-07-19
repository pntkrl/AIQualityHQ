import React, { useState, useEffect, useRef } from 'react';
import { 
  type AnalysisResult, 
  type DimensionType,
  analyzePrompt
} from '../../lib/quality-engine/engine';
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
  AlertTriangle,
  Share2,
  Link,
  ChevronDown
} from 'lucide-react';

interface HistoryRecord {
  id: string;
  prompt: string;
  model: string;
  result: AnalysisResult;
  timestamp: number;
}

const DIMENSION_ICONS: Record<DimensionType, React.ComponentType<{ className?: string }>> = {
  prompt: MessageSquare,
  memory: Brain,
  context: Layers,
  trust: Shield,
  privacy: Lock,
  security: ShieldCheck
};

export default function ReportViewer() {
  const [record, setRecord] = useState<HistoryRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get query parameters on mount
    const searchParams = new URLSearchParams(window.location.search);
    const id = searchParams.get('id');
    const promptParam = searchParams.get('prompt');
    const modelParam = searchParams.get('model');
    const useCaseParam = searchParams.get('useCase') || 'general';

    if (promptParam) {
      try {
        const decodedPrompt = decodeURIComponent(promptParam);
        const modelName = modelParam ? decodeURIComponent(modelParam) : 'gpt-4';
        const analysis = analyzePrompt(decodedPrompt, useCaseParam);
        setRecord({
          id: 'shared',
          prompt: decodedPrompt,
          model: modelName,
          result: analysis,
          timestamp: Date.now()
        });
      } catch (e) {
        console.error('Failed to parse shared prompt parameters:', e);
      }
    } else if (id) {
      try {
        const historyList = JSON.parse(localStorage.getItem('aiq_history') || '[]');
        const found = historyList.find((r: HistoryRecord) => r.id === id);
        if (found) {
          setRecord(found);
        }
      } catch (e) {
        // Ignore
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setShowShareMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getShareUrl = () => {
    if (!record) return window.location.href;
    const prompt = record.prompt;
    const model = record.model;
    const useCase = 'general';
    
    if (prompt.length <= 1000) {
      const origin = window.location.origin;
      return `${origin}/report?prompt=${encodeURIComponent(prompt)}&model=${encodeURIComponent(model)}&useCase=${encodeURIComponent(useCase)}`;
    }
    return `${window.location.origin}/checker`;
  };

  const handleCopyLink = () => {
    const shareUrl = getShareUrl();
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
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
    if (score >= 90) return 'Exceptional Quality';
    if (score >= 80) return 'Strong Quality';
    if (score >= 60) return 'Acceptable Quality';
    if (score >= 40) return 'Needs Improvement';
    return 'Critical Concerns';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-surface-tertiary border-t-primary animate-spin"></div>
        <span className="text-xs text-text-secondary font-mono">Loading report...</span>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="border border-border-subtle bg-surface p-8 rounded-xl flex flex-col items-center justify-center text-center gap-4 py-16">
        <div className="w-12 h-12 rounded-full bg-error-subtle text-error flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Diagnostic Report Not Found</h3>
          <p className="text-xs text-text-secondary mt-1 max-w-sm leading-relaxed">
            We could not find a diagnostic history record matching this ID. The report may have been deleted, or is stored in a different browser session.
          </p>
        </div>
        <a 
          href="/checker"
          className="px-4 py-2 bg-primary text-text-on-primary rounded-md text-xs font-semibold hover:bg-primary-hover transition-fast cursor-pointer button-press decoration-none"
        >
          Open Checker Workspace
        </a>
      </div>
    );
  }

  const { result } = record;

  const shareText = `I just analyzed my AI prompt quality using AIQualityHQ and achieved a score of ${result.overallScore}/100! Check it out:`;
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(getShareUrl())}`;
  const linkedinShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(getShareUrl())}`;
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl())}`;

  return (
    <div className="flex flex-col gap-6 max-w-[800px] mx-auto">
      
      {/* Top Meta Details Card */}
      <div className="border border-border bg-surface rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-primary">Archived Check</span>
          <h3 className="text-sm font-semibold text-text-primary mt-0.5">Model Context: {record.model.toUpperCase()}</h3>
          <p className="text-xs text-text-secondary">
            Analyzed {new Date(record.timestamp).toLocaleString()}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <span className={`px-2 py-0.5 text-xs font-mono font-medium border rounded ${getScoreBadgeClass(result.overallScore)}`}>
            {result.passed ? 'PASS' : 'FAIL'}
          </span>

          <div className="relative" ref={shareMenuRef}>
            <button
              type="button"
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="px-3 h-8 border border-border bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-secondary text-xs font-medium rounded-md transition-fast flex items-center gap-1.5 cursor-pointer button-press print-hidden select-none"
              title="Share report options"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
              <ChevronDown className="w-2.5 h-2.5 text-text-tertiary" />
            </button>
            {showShareMenu && (
              <div className="absolute right-0 top-full mt-1 bg-surface border border-border rounded-lg shadow-lg p-1 min-w-[160px] z-10 animate-fade-in font-sans text-xs">
                <a
                  href={twitterShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-2.5 py-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-secondary rounded-md transition-fast decoration-none select-none cursor-pointer"
                  onClick={() => setShowShareMenu(false)}
                >
                  <svg className="w-3.5 h-3.5 text-text-primary" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  <span>Share on X</span>
                </a>
                <a
                  href={linkedinShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-2.5 py-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-secondary rounded-md transition-fast decoration-none select-none cursor-pointer"
                  onClick={() => setShowShareMenu(false)}
                >
                  <svg className="w-3.5 h-3.5 text-[#0A66C2]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  <span>Share on LinkedIn</span>
                </a>
                <a
                  href={facebookShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-2.5 py-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-secondary rounded-md transition-fast decoration-none select-none cursor-pointer"
                  onClick={() => setShowShareMenu(false)}
                >
                  <svg className="w-3.5 h-3.5 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span>Share on Facebook</span>
                </a>
                <button
                  type="button"
                  onClick={() => { handleCopyLink(); setShowShareMenu(false); }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-secondary rounded-md transition-fast cursor-pointer select-none text-left"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-success" />
                      <span className="text-success font-medium">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Link className="w-3.5 h-3.5" />
                      <span>Copy Report Link</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 h-8 border border-border bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-secondary text-xs font-medium rounded-md transition-fast flex items-center gap-1.5 cursor-pointer button-press print-hidden"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Raw Prompt Text Box */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-mono uppercase tracking-wider text-text-secondary font-semibold">Analyzed Prompt Text</span>
        <div className="w-full bg-surface-secondary/40 border border-border rounded-xl p-4 font-mono text-xs text-text-secondary leading-relaxed max-h-[200px] overflow-y-auto whitespace-pre-wrap">
          {record.prompt}
        </div>
      </div>

      {/* Score Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Hero Card */}
        <div className={`md:col-span-1 border rounded-xl p-5 flex flex-col justify-center items-center text-center ${getScoreBgClass(result.overallScore)}`}>
          <span className="text-[10px] text-text-secondary uppercase font-semibold tracking-wider mb-1">Quality Score</span>
          <div className="flex items-baseline font-mono">
            <span className={`text-5xl font-semibold tracking-tight ${getScoreColorClass(result.overallScore)}`}>
              {result.overallScore}
            </span>
            <span className="text-sm text-text-tertiary">/100</span>
          </div>
          <span className={`text-xs font-semibold mt-1.5 ${getScoreColorClass(result.overallScore)}`}>
            {getScoreLabel(result.overallScore)}
          </span>
        </div>

        {/* Dimensions grid */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                className="border border-border-subtle bg-surface p-3 rounded-xl flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded bg-surface-secondary text-text-secondary border border-border-subtle flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs text-text-primary font-semibold truncate">{dim.name}</span>
                    <span className="text-[10px] text-text-secondary font-mono mt-0.5">{dim.score}/100 score</span>
                  </div>
                </div>

                <svg className="w-8 h-8 shrink-0 -rotate-90" viewBox="0 0 40 40">
                  <circle
                    cx="20"
                    cy="20"
                    r={radius}
                    stroke="var(--color-surface-secondary)"
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
      </div>

      {/* Factors & Suggestions */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Factors check List (7 cols) */}
        <div className="md:col-span-7 flex flex-col gap-4">
          <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider">Scoring Factors Breakdown</h4>
          <div className="flex flex-col gap-3">
            {result.rules.map((rule) => {
              const severityColor = rule.severity === 'critical' ? 'border-score-critical-border text-score-critical bg-score-critical-subtle' :
                rule.severity === 'major' ? 'border-score-warning-border text-score-warning bg-score-warning-subtle' :
                rule.severity === 'minor' ? 'border-primary-border text-primary bg-primary-subtle' :
                'border-score-excellent-border text-score-excellent bg-score-excellent-subtle';
              return (
                <div key={rule.id} className="flex items-start gap-2.5 text-xs text-text-secondary leading-relaxed">
                  {rule.passed ? (
                    <div className="w-4 h-4 rounded bg-success-subtle text-success flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3" />
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded bg-error-subtle text-error flex items-center justify-center shrink-0 mt-0.5">
                      <AlertCircle className="w-3 h-3" />
                    </div>
                  )}
                  <span>
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

        {/* Actionable recommendations (5 cols) */}
        <div className="md:col-span-5 flex flex-col gap-4">
          <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider">Recommendations</h4>
          {result.recommendations.length > 0 ? (
            <div className="border border-border bg-surface-secondary/40 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-1.5 text-xs text-primary font-semibold uppercase tracking-wider font-mono">
                <Sparkles className="w-3.5 h-3.5" />
                Improvement Tips
              </div>
              <ol className="list-decimal pl-4 flex flex-col gap-2.5 text-xs text-text-secondary">
                {result.recommendations.map((rec, i) => (
                  <li key={i} className="leading-relaxed pl-1">{rec}</li>
                ))}
              </ol>
            </div>
          ) : (
            <div className="border border-score-excellent-border bg-score-excellent-subtle text-score-excellent p-4 rounded-xl text-xs font-medium font-sans">
              Exceptional structure! No modifications recommended for this prompt template.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
