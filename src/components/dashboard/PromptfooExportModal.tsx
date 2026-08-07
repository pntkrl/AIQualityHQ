import React, { useState, useMemo } from 'react';
import { Download, Copy, Check, X, Terminal, ExternalLink, Sparkles, FileCode } from 'lucide-react';
import { generatePromptfooConfig, downloadPromptfooConfig } from '../../lib/quality-engine/promptfoo';

interface PromptfooExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  promptText: string;
  title?: string;
  score?: number;
}

export const PromptfooExportModal: React.FC<PromptfooExportModalProps> = ({
  isOpen,
  onClose,
  promptText,
  title = 'AIQualityHQ Prompt Evaluation',
  score
}) => {
  const [copied, setCopied] = useState(false);

  const yamlConfig = useMemo(() => {
    if (!promptText) return '';
    return generatePromptfooConfig(promptText, {
      title,
      description: 'Exported from AIQualityHQ for LLM evaluation matrix',
      score
    });
  }, [promptText, title, score]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(yamlConfig);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    downloadPromptfooConfig(yamlConfig, 'promptfooconfig.yaml');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-slate-100 flex items-center gap-2">
                Export to Promptfoo
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                  promptfooconfig.yaml
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Automated multi-model evaluation framework (GPT-4o, Claude 3.5, Gemini 1.5)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-xs text-emerald-300 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <span>
                Promptfoo runs your prompt against multiple LLM providers, benchmarks latency/cost, and runs automated evaluations in CI/CD.
              </span>
            </div>
            <a
              href="https://www.promptfoo.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-xs font-medium text-emerald-400 hover:underline shrink-0 gap-1"
            >
              Docs <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* YAML Viewer */}
          <div className="relative rounded-lg border border-slate-800 bg-slate-950 font-mono text-xs overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-slate-400">
              <span>promptfooconfig.yaml</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            <pre className="p-4 overflow-x-auto text-slate-300 max-h-72 leading-relaxed">
              <code>{yamlConfig}</code>
            </pre>
          </div>

          {/* Terminal Command Box */}
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-2">
            <div className="flex items-center space-x-2 text-slate-300 font-semibold">
              <Terminal className="w-4 h-4 text-slate-400" />
              <span>Run test matrix in terminal</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800 font-mono text-emerald-400">
              <code>npx promptfoo@latest eval -c promptfooconfig.yaml</code>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-slate-800 bg-slate-900/80">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors border border-transparent"
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center space-x-2 px-4 py-2 text-xs font-medium text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors shadow-sm font-semibold"
          >
            <Download className="w-4 h-4" />
            <span>Download promptfooconfig.yaml</span>
          </button>
        </div>
      </div>
    </div>
  );
};
