import React, { useState } from 'react';
import { DollarSign, Zap, Shield, ArrowRight, Sparkles, TrendingUp } from 'lucide-react';

interface ModelPricing {
  name: string;
  provider: string;
  pricePerMillionInput: number; // USD
}

const MODELS: Record<string, ModelPricing> = {
  'gpt-4o': { name: 'GPT-4o', provider: 'OpenAI', pricePerMillionInput: 2.50 },
  'claude-3-5-sonnet': { name: 'Claude 3.5 Sonnet', provider: 'Anthropic', pricePerMillionInput: 3.00 },
  'gemini-1-5-pro': { name: 'Gemini 1.5 Pro', provider: 'Google', pricePerMillionInput: 1.25 },
  'gpt-4o-mini': { name: 'GPT-4o Mini', provider: 'OpenAI', pricePerMillionInput: 0.15 },
};

export const TokenCostCalculator: React.FC = () => {
  const [monthlyCalls, setMonthlyCalls] = useState<number>(50000);
  const [promptTokens, setPromptTokens] = useState<number>(800);
  const [selectedModelKey, setSelectedModelKey] = useState<string>('gpt-4o');

  const model = MODELS[selectedModelKey] || MODELS['gpt-4o'];

  // Calculations
  const totalTokensPerMonth = monthlyCalls * promptTokens;
  const bloatReductionPercent = 0.18; // 18% average reduction from token optimization & filtering failed injections
  const savedTokensPerMonth = Math.round(totalTokensPerMonth * bloatReductionPercent);
  const monthlySavingsUSD = (savedTokensPerMonth / 1_000_000) * model.pricePerMillionInput;
  const yearlySavingsUSD = monthlySavingsUSD * 12;

  // Latency comparison
  const cloudEvalLatencyMs = 350;
  const localEvalLatencyMs = 8;
  const timeSavedHoursPerMonth = Math.round((monthlyCalls * (cloudEvalLatencyMs - localEvalLatencyMs)) / (1000 * 3600));

  return (
    <div className="w-full bg-surface-secondary/40 border border-border-subtle rounded-2xl p-6 sm:p-8 md:p-10 shadow-xl backdrop-blur-sm transition-all hover:border-border-strong">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-border-subtle">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            ROI & Savings Calculator
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
            Calculate Your Token & API Cost Savings
          </h3>
          <p className="text-sm text-text-secondary mt-1">
            See how much static prompt pre-filtering & token optimization saves your team vs cloud evals.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-xl text-xs font-semibold">
          <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
          100% Client-Side • 0 Cloud API Fees
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls Column */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Model Selector */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
              Target LLM Model
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(MODELS).map(([key, m]) => (
                <button
                  key={key}
                  onClick={() => setSelectedModelKey(key)}
                  className={`px-3 py-2.5 rounded-xl border text-xs font-medium transition-all text-left flex flex-col gap-1 ${
                    selectedModelKey === key
                      ? 'bg-primary/15 border-primary text-primary shadow-sm'
                      : 'bg-surface border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-strong'
                  }`}
                >
                  <span className="font-semibold text-text-primary truncate">{m.name}</span>
                  <span className="text-[10px] text-text-tertiary">${m.pricePerMillionInput}/1M tok</span>
                </button>
              ))}
            </div>
          </div>

          {/* Monthly API Calls Slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Monthly LLM Prompt Invocations
              </label>
              <span className="text-sm font-bold text-text-primary font-mono">
                {monthlyCalls.toLocaleString()} calls/mo
              </span>
            </div>
            <input
              type="range"
              min="5000"
              max="500000"
              step="5000"
              value={monthlyCalls}
              onChange={(e) => setMonthlyCalls(Number(e.target.value))}
              className="w-full h-2 bg-surface rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-[11px] text-text-tertiary mt-1">
              <span>5k/mo</span>
              <span>100k/mo</span>
              <span>500k/mo</span>
            </div>
          </div>

          {/* Average Prompt Length Slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Avg Tokens Per Prompt
              </label>
              <span className="text-sm font-bold text-text-primary font-mono">
                {promptTokens} tokens (~{Math.round(promptTokens * 0.75)} words)
              </span>
            </div>
            <input
              type="range"
              min="100"
              max="3000"
              step="50"
              value={promptTokens}
              onChange={(e) => setPromptTokens(Number(e.target.value))}
              className="w-full h-2 bg-surface rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-[11px] text-text-tertiary mt-1">
              <span>100 tokens</span>
              <span>1,500 tokens</span>
              <span>3,000 tokens</span>
            </div>
          </div>
        </div>

        {/* Results Card Column */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-surface border border-border-subtle rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-2xl rounded-full pointer-events-none" />

          <div>
            <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider block mb-1">
              Estimated Annual Savings
            </span>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-mono tracking-tight">
                ${yearlySavingsUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-text-tertiary font-medium">/ year</span>
            </div>

            <div className="space-y-3 pt-4 border-t border-border-subtle">
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-secondary flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-primary" />
                  Monthly Token Savings:
                </span>
                <span className="font-semibold text-text-primary font-mono">
                  ${monthlySavingsUSD.toFixed(2)}/mo
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-text-secondary flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-primary" />
                  Tokens Saved From Bloat:
                </span>
                <span className="font-semibold text-text-primary font-mono">
                  {(savedTokensPerMonth / 1000).toFixed(0)}k tokens/mo
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-text-secondary flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Evaluation Latency:
                </span>
                <span className="font-semibold text-emerald-400 font-mono">
                  &lt;8ms (vs {cloudEvalLatencyMs}ms cloud)
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-border-subtle">
            <a
              href="/checker"
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-black font-semibold text-sm hover:bg-primary-hover transition-all shadow-md group"
            >
              Audit Prompts 100% Free
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
