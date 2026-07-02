import React, { useState, useEffect } from 'react';
import { 
  type AnalysisResult, 
  type DimensionType
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
  AlertTriangle
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

  useEffect(() => {
    // Get query ID on mount
    const searchParams = new URLSearchParams(window.location.search);
    const id = searchParams.get('id');

    if (id) {
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
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 h-8 border border-border bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-secondary text-xs font-medium rounded-md transition-fast flex items-center gap-1.5 cursor-pointer button-press"
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
