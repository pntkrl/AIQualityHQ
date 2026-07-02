import React, { useState, useEffect } from 'react';
import { Clock, Trash2, RotateCcw, ChevronDown, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';

interface HistoryEntry {
  id: string;
  prompt: string;
  model: string;
  result: {
    overallScore: number;
    passed: boolean;
    dimensions: Record<string, { name: string; score: number; passed: boolean }>;
    metadata: { timestamp: number };
  };
  timestamp: number;
}

interface PromptHistoryProps {
  currentPrompt?: string;
  onRestore: (prompt: string) => void;
}

export default function PromptHistory({ currentPrompt, onRestore }: PromptHistoryProps) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('aiq_history') || '[]') as HistoryEntry[];
      setEntries(stored.slice(0, 30));
    } catch { /* ignore */ }
  }, [currentPrompt]);

  const handleClear = () => {
    localStorage.removeItem('aiq_history');
    setEntries([]);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated);
    localStorage.setItem('aiq_history', JSON.stringify(updated));
  };

  if (entries.length === 0) return null;

  const sorted = [...entries].sort((a, b) => b.timestamp - a.timestamp);
  const latest = sorted[0];

  return (
    <div className="border border-border-subtle bg-surface rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-surface-secondary transition-fast cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-text-tertiary" />
          <span className="text-xs font-semibold text-text-primary">
            Version History
          </span>
          <span className="text-[10px] text-text-tertiary font-mono">
            ({entries.length})
          </span>
        </div>
        {expanded ? <ChevronDown className="w-3.5 h-3.5 text-text-tertiary" /> : <ChevronRight className="w-3.5 h-3.5 text-text-tertiary" />}
      </button>

      {!expanded && latest && (
        <div className="px-4 pb-2.5 flex items-center gap-3 text-[10px] font-mono text-text-tertiary">
          <span>Latest: <span className={latest.result.overallScore >= 60 ? 'text-score-excellent' : 'text-score-critical'}>{latest.result.overallScore}/100</span></span>
          <span>{new Date(latest.timestamp).toLocaleDateString()}</span>
          <span className="truncate max-w-[200px]">{latest.prompt.slice(0, 60)}...</span>
        </div>
      )}

      {expanded && (
        <div className="border-t border-border-subtle max-h-[300px] overflow-y-auto">
          {sorted.map((entry, idx) => {
            const prev = idx < sorted.length - 1 ? sorted[idx + 1] : null;
            const diff = prev ? entry.result.overallScore - prev.result.overallScore : 0;
            const isActive = currentPrompt === entry.prompt;

            return (
              <div
                key={entry.id}
                className={`flex items-center gap-2 px-4 py-2 text-xs border-b border-border-subtle last:border-b-0 cursor-pointer hover:bg-surface-secondary transition-fast ${isActive ? 'bg-primary-subtle/20' : ''}`}
                onClick={() => { setSelectedId(selectedId === entry.id ? null : entry.id); }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono font-semibold text-sm ${entry.result.overallScore >= 60 ? 'text-score-excellent' : 'text-score-critical'}`}>
                      {entry.result.overallScore}
                    </span>
                    <span className="text-[10px] text-text-primary font-medium truncate">
                      {entry.prompt.slice(0, 80)}{entry.prompt.length > 80 ? '...' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[9px] text-text-tertiary mt-0.5">
                    <span>{new Date(entry.timestamp).toLocaleString()}</span>
                    {diff !== 0 && (
                      <span className={`inline-flex items-center gap-0.5 ${diff > 0 ? 'text-score-excellent' : 'text-score-critical'}`}>
                        {diff > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                        {diff > 0 ? '+' : ''}{diff}
                      </span>
                    )}
                  </div>
                  {selectedId === entry.id && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {(Object.entries(entry.result.dimensions) as [string, { name: string; score: number }][]).map(([k, d]) => (
                        <span key={k} className={`text-[8px] font-mono px-1 py-0.5 rounded border ${d.score >= 60 ? 'border-score-excellent-border text-score-excellent bg-score-excellent-subtle' : 'border-score-warning-border text-score-warning bg-score-warning-subtle'}`}>
                          {d.name.slice(0, 10)}:{d.score}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onRestore(entry.prompt); }}
                    className="p-1.5 rounded hover:bg-surface-tertiary text-text-tertiary hover:text-text-primary transition-fast cursor-pointer"
                    title="Restore this version"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(entry.id, e)}
                    className="p-1.5 rounded hover:bg-error-subtle text-text-tertiary hover:text-error transition-fast cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
          <div className="px-4 py-2 border-t border-border-subtle">
            <button
              type="button"
              onClick={handleClear}
              className="text-[9px] text-text-tertiary hover:text-error font-mono transition-fast cursor-pointer"
            >
              Clear all history
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
