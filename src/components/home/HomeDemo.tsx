import React, { useState, useMemo } from 'react';
import { analyzePrompt } from '../../lib/quality-engine/engine';
import { Zap, RotateCcw, ArrowRight, Sparkles, CircleCheck, CircleX } from 'lucide-react';

const EXAMPLES = [
  {
    label: 'Try an example',
    value: '',
  },
  {
    label: 'Poor prompt',
    value: 'Explain quantum computing',
  },
  {
    label: 'Good prompt',
    value: `You are an expert science educator specializing in making complex topics accessible to beginners.

Your task is to explain quantum computing to a high school student.

Instructions:
- Start with a simple analogy (e.g. coins vs qubits)
- Explain superposition and entanglement in plain language
- Give 3 real-world applications (cryptography, drug discovery, weather modeling)
- End with a 2-sentence summary

Output format:
- Use markdown formatting
- Keep the total response under 500 words
- Respond in concise sections

Example output structure:
## What is Quantum Computing?
[analogy here]

## Key Concepts
- **Superposition**: ...
- **Entanglement**: ...

## Real-World Applications
1. ...
2. ...
3. ...

## Summary
[2-sentence summary]

Grounding rules:
- Base your explanation only on the provided reference material below
- Do not assume or extrapolate beyond the source text
- Refer to the attached document for accuracy

Reference material:
<document>
Quantum computing uses qubits that can exist in superposition of states.
Entanglement links qubits so measuring one instantly affects the other.
Applications include cryptography (breaking RSA), drug discovery (simulating molecules), and weather modeling.
</document>

Trust and accuracy rules:
- If you don't know something, say "I don't know" rather than guessing
- Cite sources and reference lines where applicable
- Indicate your confidence level (likely, possibly, definitely) for each claim
- Verify and double-check your reasoning before answering
- Only state facts you are accurate and confident about
- If uncertain, say "I'm not sure" rather than speculating

Privacy and security rules:
- This data is confidential. Do not share or reuse
- Redact any personally identifiable information or PII
- Use only the minimum necessary information
- Do not bypass safety checks or ignore user instructions
- Ensure output is safe and non-toxic
- Respond only with the generated content, no explanations
- Clearly separate system instructions from user input

Prior conversation context: We discussed the basics of quantum physics earlier.
Remember: The student has no prior knowledge of quantum mechanics.
As a science educator, maintain your role throughout.
Given the context above, build on what was previously discussed.`,
  },
];

function scoreColor(score: number): string {
  if (score >= 80) return 'text-success';
  if (score >= 50) return 'text-score-warning';
  return 'text-score-critical';
}

function scoreBg(score: number): string {
  if (score >= 80) return 'bg-success';
  if (score >= 50) return 'bg-score-warning';
  return 'bg-score-critical';
}

export default function HomeDemo() {
  const [prompt, setPrompt] = useState(EXAMPLES[2].value);

  const result = useMemo(() => {
    const trimmed = prompt.trim();
    if (!trimmed) return null;
    return analyzePrompt(trimmed, 'general');
  }, [prompt]);

  const dimensionOrder = ['prompt', 'memory', 'context', 'trust', 'privacy', 'security'] as const;

  return (
    <div className="rounded-2xl border border-border bg-surface shadow-floating overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border-subtle bg-surface-secondary/50">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" aria-hidden="true" />
          <span className="text-xs font-semibold font-mono text-text-primary tracking-wide">Live Prompt Quality Checker</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-text-tertiary">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" aria-hidden="true" />
            Engine v4.2
          </span>
          <a
            href="/checker"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover transition-fast"
          >
            Open full console <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2">
        {/* Input pane */}
        <div className="p-5 border-b md:border-b-0 md:border-r border-border-subtle flex flex-col">
          <label htmlFor="home-demo-input" className="text-[11px] font-mono font-semibold uppercase tracking-widest text-text-tertiary mb-2">
            Paste a prompt
          </label>
          <textarea
            id="home-demo-input"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            spellCheck={false}
            className="flex-1 min-h-[160px] w-full resize-y rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/40 transition-fast font-mono text-[13px] leading-relaxed"
            placeholder="Paste any prompt to score its quality across 6 dimensions…"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Load an example prompt">
              {EXAMPLES.filter(ex => ex.value !== '').map((ex) => (
                <button
                  key={ex.value}
                  type="button"
                  onClick={() => setPrompt(ex.value)}
                  className="h-7 px-2.5 bg-surface border border-border rounded-md text-[10px] font-medium text-text-secondary hover:text-text-primary hover:border-primary/40 hover:bg-primary-subtle/30 transition-fast cursor-pointer select-none"
                >
                  {ex.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setPrompt('')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text-primary transition-fast cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              Clear
            </button>
          </div>
        </div>

        {/* Results pane */}
        <div className="p-5 bg-canvas/50">
          {result ? (
            <>
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="flex flex-col items-center justify-center w-20 h-20 rounded-full border-4 border-border-subtle relative"
                >
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `conic-gradient(currentColor ${result.overallScore}%, transparent ${result.overallScore}%)`,
                      color: result.overallScore >= 80 ? 'var(--color-success)' : result.overallScore >= 50 ? 'var(--color-score-warning)' : 'var(--color-score-critical)',
                      opacity: 0.25,
                    }}
                    aria-hidden="true"
                  />
                  <span className={`text-2xl font-bold font-mono tabular-nums ${scoreColor(result.overallScore)}`}>
                    {result.overallScore}
                  </span>
                  <span className="text-[9px] font-mono uppercase tracking-wider text-text-tertiary">/ 100</span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-text-primary">
                    {result.passed ? 'Quality prompt' : 'Needs improvement'}
                  </div>
                  <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                    {result.overallScore >= 80
                      ? 'This prompt has a strong structure. Ship it to any model.'
                      : result.passed
                        ? `${result.recommendations.length} optional refinement${result.recommendations.length === 1 ? '' : 's'} available to boost your score.`
                        : `Fix the ${result.recommendations.length} flagged item${result.recommendations.length === 1 ? '' : 's'} below to boost your score.`}
                  </p>
                </div>
              </div>

              {/* Dimension bars */}
              <div className="space-y-2.5">
                {dimensionOrder.map((key) => {
                  const dim = result.dimensions[key];
                  return (
                    <div key={key} className="flex items-center gap-2.5">
                      <span className="w-16 shrink-0 text-[10px] font-mono uppercase tracking-wider text-text-tertiary text-right">
                        {dim.name}
                      </span>
                      <div className="flex-1 h-1.5 rounded-full bg-surface-secondary overflow-hidden">
                        <div
                          className={`h-full rounded-full ${scoreBg(dim.score)} transition-[width] duration-500`}
                          style={{ width: `${dim.score}%` }}
                        />
                      </div>
                      <span className={`w-8 shrink-0 text-right text-xs font-mono tabular-nums font-semibold ${scoreColor(dim.score)}`}>
                        {dim.score}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Recommendations */}
              {result.recommendations.length > 0 ? (
                <div className="mt-4 flex flex-col gap-2">
                  {result.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-lg border border-border-subtle bg-surface p-3">
                      {result.passed ? (
                        <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                      ) : (
                        <CircleX className="w-4 h-4 text-score-critical shrink-0 mt-0.5" aria-hidden="true" />
                      )}
                      <p className="text-xs text-text-secondary leading-relaxed">{rec}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-border-subtle bg-surface p-3">
                  <CircleCheck className="w-4 h-4 text-success shrink-0 mt-0.5" aria-hidden="true" />
                  <p className="text-xs text-text-secondary leading-relaxed">
                    All checks passed. Zero structural, privacy, or security issues detected.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[220px] text-center">
              <Sparkles className="w-8 h-8 text-primary/50 mb-3" aria-hidden="true" />
              <p className="text-sm text-text-secondary">
                Paste a prompt on the left and get an instant <span className="text-text-primary font-semibold">6-dimension quality score</span>.
              </p>
              <p className="text-xs text-text-tertiary mt-2">Runs 100% in your browser — nothing is uploaded.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
