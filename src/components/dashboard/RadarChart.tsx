import React from 'react';
import type { DimensionType } from '../../lib/quality-engine/types';

interface RadarChartProps {
  scores: Record<string, { name: string; score: number }>;
  size?: number;
  className?: string;
}

const DIM_ORDER: DimensionType[] = ['prompt', 'memory', 'context', 'trust', 'privacy', 'security'];

export default function RadarChart({ scores, size = 160, className = '' }: RadarChartProps) {
  const dims = DIM_ORDER.filter(k => scores[k]).map(k => scores[k]);
  const n = dims.length;
  if (n < 3) return null;

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 20;
  const angleStep = (2 * Math.PI) / n;
  const offset = -Math.PI / 2;

  const getPoint = (idx: number, radius: number) => {
    const a = offset + idx * angleStep;
    return { x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) };
  };

  const gridLevels = [0.25, 0.5, 0.75, 1];

  const dataPoints = dims.map((d, i) => getPoint(i, (d.score / 100) * r));
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className={`shrink-0 ${className}`} role="img" aria-label="Dimension scores radar chart">
      <defs>
        <linearGradient id="radar-fill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.15" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {gridLevels.map((lv) => {
        const pts = Array.from({ length: n }, (_, i) => getPoint(i, lv * r));
        const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';
        return <path key={lv} d={path} fill="none" stroke="var(--color-border-subtle)" strokeWidth="0.5" />;
      })}

      {Array.from({ length: n }).map((_, i) => {
        const p = getPoint(i, r);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="var(--color-border-subtle)" strokeWidth="0.5" />;
      })}

      <path d={dataPath} fill="url(#radar-fill)" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinejoin="round" />

      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="var(--color-primary)" stroke="var(--color-surface)" strokeWidth="1" />
      ))}

      {dims.map((d, i) => {
        const p = getPoint(i, r + 18);
        return (
          <g key={i}>
            <text x={p.x} y={p.y + 3} textAnchor="middle" fontSize="7" fill="var(--color-text-secondary)" className="font-mono">
              {d.score}
            </text>
            <text x={p.x} y={p.y + 13} textAnchor="middle" fontSize="5" fill="var(--color-text-tertiary)" className="font-mono uppercase">
              {shortLabel(d.name)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function shortLabel(name: string): string {
  if (name === 'Prompt Structure') return 'Prompt';
  if (name === 'Memory & State') return 'Memory';
  if (name === 'Context Grounding') return 'Context';
  if (name === 'Trust & Accuracy') return 'Trust';
  if (name === 'PII & Privacy') return 'Privacy';
  if (name === 'Security & Safety') return 'Security';
  return name;
}
