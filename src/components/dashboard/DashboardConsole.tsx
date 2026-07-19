import React, { useState, useEffect, useRef } from 'react';
import TrendChart from './TrendChart';
import { 
  Trash2, 
  ExternalLink, 
  Check, 
  AlertCircle, 
  PlusCircle, 
  TrendingUp,
  Activity,
  Layers,
  Download,
  X,
  ChevronDown
} from 'lucide-react';

interface HistoryRecord {
  id: string;
  prompt: string;
  model: string;
  result: {
    overallScore: number;
    passed: boolean;
    dimensions: Record<string, { name: string; score: number; passed: boolean }>;
    rules: { id: string; name: string; passed: boolean; severity: string }[];
    metadata: {
      charCount: number;
      wordCount: number;
    };
  };
  timestamp: number;
}

export default function DashboardConsole() {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showClearMenu, setShowClearMenu] = useState(false);
  const clearMenuRef = useRef<HTMLDivElement | null>(null);
  const [clearedSnapshot, setClearedSnapshot] = useState<HistoryRecord[] | null>(null);
  const [showUndoToast, setShowUndoToast] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    if (!showClearMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (clearMenuRef.current && !clearMenuRef.current.contains(e.target as Node)) {
        setShowClearMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showClearMenu]);

  useEffect(() => {
    if (showUndoToast) {
      const t = setTimeout(() => { setShowUndoToast(false); setClearedSnapshot(null); }, 5000);
      return () => clearTimeout(t);
    }
  }, [showUndoToast]);

  const loadHistory = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('aiq_history') || '[]');
      setHistory(stored);
    } catch (e) {
      // Ignore
    }
  };

  const filteredHistory = history.filter((r) => {
    if (dateFrom) {
      const from = new Date(dateFrom).getTime();
      if (r.timestamp < from) return false;
    }
    if (dateTo) {
      const to = new Date(dateTo).getTime() + 86400000;
      if (r.timestamp > to) return false;
    }
    return true;
  });

  const cutoffDays = (days: number) => {
    return Date.now() - days * 86400000;
  };

  const getClearPreview = (days?: number): { count: number; label: string } => {
    if (days === undefined) return { count: history.length, label: 'All History' };
    const cutoff = cutoffDays(days);
    const count = history.filter(r => r.timestamp >= cutoff).length;
    return { count, label: `Last ${days} Days` };
  };

  const handleClearRange = (days?: number) => {
    const preview = getClearPreview(days);
    if (preview.count === 0) {
      setShowClearMenu(false);
      return;
    }
    const msg = days === undefined
      ? `Are you sure you want to permanently clear all ${preview.count} prompt verifications? This action is irreversible.`
      : `Clear ${preview.count} entries from the last ${days} days? You can undo this within 5 seconds.`;
    if (!confirm(msg)) return;

    const snapshot = [...history];
    let updated: HistoryRecord[];
    if (days === undefined) {
      updated = [];
    } else {
      const cutoff = cutoffDays(days);
      updated = history.filter(r => r.timestamp < cutoff);
    }
    localStorage.setItem('aiq_history', JSON.stringify(updated));
    setHistory(updated);
    setShowClearMenu(false);

    if (days !== undefined) {
      setClearedSnapshot(snapshot);
      setShowUndoToast(true);
    }
  };

  const handleUndoClear = () => {
    if (!clearedSnapshot) return;
    localStorage.setItem('aiq_history', JSON.stringify(clearedSnapshot));
    setHistory(clearedSnapshot);
    setClearedSnapshot(null);
    setShowUndoToast(false);
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

  const handleExportCSV = () => {
    if (filteredHistory.length === 0) return;
    const headers = [
      'ID', 'Date', 'Model', 'Char Count', 'Word Count',
      'Overall Score', 'Status',
      'Prompt Structure', 'Memory & State', 'Context Grounding',
      'Trust & Accuracy', 'PII & Privacy', 'Security & Safety',
      'Failed Rules', 'Prompt'
    ];
    const rows = filteredHistory.map(row => {
      const dims = row.result.dimensions || {};
      const rules = row.result.rules || [];
      const failedCount = rules.filter((r: { passed: boolean }) => !r.passed).length;
      return [
        row.id,
        new Date(row.timestamp).toISOString(),
        row.model,
        row.result.metadata.charCount,
        row.result.metadata.wordCount,
        row.result.overallScore,
        row.result.passed ? 'PASSED' : 'FAILED',
        dims.prompt?.score ?? '',
        dims.memory?.score ?? '',
        dims.context?.score ?? '',
        dims.trust?.score ?? '',
        dims.privacy?.score ?? '',
        dims.security?.score ?? '',
        failedCount,
        `"${row.prompt.replace(/"/g, '""').slice(0, 500)}"`
      ];
    });
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `aiq_history_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      
      {/* Undo Toast */}
      {showUndoToast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-surface border border-border rounded-lg shadow-floating flex items-center gap-3 text-xs animate-fade-in no-print">
          <span className="text-text-secondary">History cleared.</span>
          <button
            type="button"
            onClick={handleUndoClear}
            className="px-2 py-1 bg-primary text-text-on-primary text-[10px] font-semibold rounded cursor-pointer hover:bg-primary-hover transition-fast"
          >
            Undo
          </button>
        </div>
      )}

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

      {/* DATE RANGE FILTER */}
      {(dateFrom || dateTo || filteredHistory.length !== history.length) && (
        <div className="border border-border-subtle bg-surface-secondary/30 rounded-xl p-4 flex flex-wrap items-center gap-4">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-text-secondary">
            Filter by Date
          </span>
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-text-tertiary">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-7 px-2 bg-surface border border-border rounded text-[11px] font-mono text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-default"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-text-tertiary">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-7 px-2 bg-surface border border-border rounded text-[11px] font-mono text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-default"
            />
          </div>
          <span className="text-[10px] text-text-tertiary font-mono">
            {filteredHistory.length} of {history.length} entries
          </span>
          <button
            type="button"
            onClick={() => { setDateFrom(''); setDateTo(''); }}
            className="h-6 px-2 text-[10px] font-mono text-text-secondary hover:text-text-primary hover:bg-surface-secondary rounded transition-fast cursor-pointer flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Clear filter
          </button>
        </div>
      )}

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
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <>
                <button
                  onClick={handleExportCSV}
                  className="h-8 px-3 border border-border bg-surface hover:bg-surface-secondary text-text-secondary text-xs font-semibold rounded-md flex items-center gap-1.5 transition-fast cursor-pointer select-none"
                  title="Export History to CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{dateFrom || dateTo ? 'Export Filtered CSV' : 'Export CSV'}</span>
                </button>
                <div className="relative" ref={clearMenuRef}>
                  <button
                    onClick={() => setShowClearMenu(!showClearMenu)}
                    className="h-8 px-3 border border-red-500/30 bg-surface hover:bg-red-500/5 text-red-600 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-fast cursor-pointer select-none"
                    title="Clear History Options"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Clear</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {showClearMenu && (
                    <div className="absolute top-full right-0 mt-1 bg-surface border border-border rounded-lg shadow-lg p-1 min-w-[180px] z-10">
                      <button
                        type="button"
                        onClick={() => handleClearRange(7)}
                        className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 text-[10px] text-text-secondary hover:text-text-primary hover:bg-surface-secondary rounded-md transition-fast cursor-pointer text-left"
                      >
                        <span>Clear Last 7 Days</span>
                        <span className="text-text-tertiary font-mono">({getClearPreview(7).count})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleClearRange(30)}
                        className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 text-[10px] text-text-secondary hover:text-text-primary hover:bg-surface-secondary rounded-md transition-fast cursor-pointer text-left"
                      >
                        <span>Clear Last 30 Days</span>
                        <span className="text-text-tertiary font-mono">({getClearPreview(30).count})</span>
                      </button>
                      <div className="border-t border-border-subtle my-1" />
                      <button
                        type="button"
                        onClick={() => handleClearRange(undefined)}
                        className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 text-[10px] text-red-600 hover:bg-red-500/5 rounded-md transition-fast cursor-pointer text-left"
                      >
                        <span>Clear All History</span>
                        <span className="text-red-400 font-mono">({getClearPreview().count})</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
            <a
              href="/checker"
              className="h-8 px-3 bg-primary hover:bg-primary-hover text-text-on-primary text-xs font-semibold rounded-md flex items-center gap-1.5 transition-fast decoration-none select-none cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Verify New</span>
            </a>
          </div>
        </div>

        {filteredHistory.length === 0 ? (
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
                {filteredHistory.map((row) => (
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
