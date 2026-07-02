import React, { useState, useEffect } from 'react';
import TrendChart from './TrendChart';
import { 
  Trash2, 
  ExternalLink, 
  Check, 
  AlertCircle, 
  PlusCircle, 
  TrendingUp,
  Activity,
  Layers
} from 'lucide-react';

interface HistoryRecord {
  id: string;
  prompt: string;
  model: string;
  result: {
    overallScore: number;
    passed: boolean;
    metadata: {
      charCount: number;
      wordCount: number;
    };
  };
  timestamp: number;
}

export default function DashboardConsole() {
  const [history, setHistory] = useState<HistoryRecord[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('aiq_history') || '[]');
      setHistory(stored);
    } catch (e) {
      // Ignore
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm('Are you sure you want to delete this check from your history?')) return;

    try {
      const stored = JSON.parse(localStorage.getItem('aiq_history') || '[]');
      const updated = stored.filter((r: HistoryRecord) => r.id !== id);
      localStorage.setItem('aiq_history', JSON.stringify(updated));
      setHistory(updated);
    } catch (e) {
      // Ignore
    }
  };

  // Math helpers
  const totalScans = history.length;
  const avgScore = totalScans > 0 
    ? Math.round(history.reduce((acc, curr) => acc + curr.result.overallScore, 0) / totalScans)
    : 0;
  const passedCount = history.filter(r => r.result.passed).length;
  const passRate = totalScans > 0 
    ? Math.round((passedCount / totalScans) * 100)
    : 0;

  const getScoreColorClass = (score: number) => {
    if (score >= 80) return 'text-score-excellent';
    if (score >= 60) return 'text-score-good';
    if (score >= 40) return 'text-score-warning';
    return 'text-score-critical';
  };

  return (
    <div className="flex flex-col gap-8">
      
      {/* 3-CARD STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Metric 1 */}
        <div className="bg-surface border border-border rounded-xl p-4 flex flex-col justify-between h-[100px] select-none shadow-subtle">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-text-secondary">
              Total Verifications
            </span>
            <Activity className="w-3.5 h-3.5 text-text-tertiary" />
          </div>
          <span className="text-2xl font-semibold tracking-tight text-text-primary mt-1 font-mono tabular-nums leading-none">
            {totalScans}
          </span>
          <span className="text-[10px] text-text-tertiary mt-1.5 truncate">
            Scans analyzed browser-side
          </span>
        </div>

        {/* Metric 2 */}
        <div className="bg-surface border border-border rounded-xl p-4 flex flex-col justify-between h-[100px] select-none shadow-subtle">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-text-secondary">
              Average Prompt Score
            </span>
            <TrendingUp className="w-3.5 h-3.5 text-text-tertiary" />
          </div>
          <span className={`text-2xl font-semibold tracking-tight mt-1 font-mono tabular-nums leading-none ${getScoreColorClass(avgScore)}`}>
            {avgScore}<span className="text-xs text-text-tertiary font-sans">/100</span>
          </span>
          <span className="text-[10px] text-text-tertiary mt-1.5 truncate">
            {avgScore >= 80 ? 'Optimal quality' : avgScore >= 60 ? 'Acceptable quality' : totalScans === 0 ? 'No data' : 'Needs attention'}
          </span>
        </div>

        {/* Metric 3 */}
        <div className="bg-surface border border-border rounded-xl p-4 flex flex-col justify-between h-[100px] select-none shadow-subtle">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-text-secondary">
              Passing Rate
            </span>
            <Layers className="w-3.5 h-3.5 text-text-tertiary" />
          </div>
          <span className="text-2xl font-semibold tracking-tight text-text-primary mt-1 font-mono tabular-nums leading-none">
            {passRate}%
          </span>
          <span className="text-[10px] text-text-tertiary mt-1.5 truncate text-text-tertiary">
            {passedCount} passed of {totalScans} checks
          </span>
        </div>

      </div>

      {/* SCORE TREND CHART SECTION */}
      <div className="border border-border bg-surface rounded-xl p-5 shadow-subtle">
        <div className="flex items-center justify-between border-b border-border-subtle pb-4 mb-5">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Quality Score Trend</h3>
            <p className="text-xs text-text-secondary mt-0.5">Prompt score progression graph</p>
          </div>
        </div>
        <TrendChart />
      </div>

      {/* RECENT ANALYSES DATA TABLE */}
      <div className="border border-border bg-surface rounded-xl p-5 shadow-subtle overflow-hidden">
        <div className="flex items-center justify-between border-b border-border-subtle pb-4 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Recent Analyses</h3>
            <p className="text-xs text-text-secondary mt-0.5">Chronological record of verified prompts</p>
          </div>
          <a
            href="/checker"
            className="h-8 px-3 bg-primary hover:bg-primary-hover text-text-on-primary text-xs font-semibold rounded-md flex items-center gap-1.5 transition-fast button-press decoration-none select-none cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Verify New</span>
          </a>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-12 flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-surface-secondary flex items-center justify-center text-text-tertiary">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-text-primary">No verification history</p>
              <p className="text-[11px] text-text-secondary mt-1">Run a prompt check to start collecting analysis data logs.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans text-xs">
              <thead>
                <tr className="border-b border-border-subtle text-[10px] font-mono text-text-secondary uppercase tracking-wider h-9">
                  <th className="py-2 font-medium">Date</th>
                  <th className="py-2 font-medium">Model</th>
                  <th className="py-2 font-medium">Word Count</th>
                  <th className="py-2 font-medium text-center">Score</th>
                  <th className="py-2 font-medium text-center">Status</th>
                  <th className="py-2 font-medium text-right pr-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {history.map((row) => (
                  <tr key={row.id} className="h-11 hover:bg-surface-secondary/40 transition-fast group">
                    <td className="py-2 font-mono text-text-secondary">
                      {new Date(row.timestamp).toLocaleDateString()} {new Date(row.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2 font-medium text-text-primary uppercase font-mono text-[10px]">
                      {row.model}
                    </td>
                    <td className="py-2 text-text-secondary font-mono">
                      {row.result.metadata.wordCount}
                    </td>
                    <td className={`py-2 text-center font-mono font-semibold ${getScoreColorClass(row.result.overallScore)}`}>
                      {row.result.overallScore}
                    </td>
                    <td className="py-2 text-center">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold uppercase border ${
                        row.result.passed 
                          ? 'bg-success-subtle text-success border-success-subtle' 
                          : 'bg-error-subtle text-error border-error-subtle'
                      }`}>
                        {row.result.passed ? <Check className="w-2.5 h-2.5" /> : <AlertCircle className="w-2.5 h-2.5" />}
                        <span>{row.result.passed ? 'PASS' : 'FAIL'}</span>
                      </span>
                    </td>
                    <td className="py-2 text-right pr-2">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`/report?id=${row.id}`}
                          className="p-1 text-text-secondary hover:text-primary rounded hover:bg-surface-secondary transition-fast cursor-pointer"
                          title="Open Shareable Report"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(row.id, e)}
                          className="p-1 text-text-secondary hover:text-red-600 rounded hover:bg-red-500/10 transition-fast cursor-pointer"
                          title="Delete check"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
