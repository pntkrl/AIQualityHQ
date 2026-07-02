import React, { useState, useEffect, useRef } from 'react';

interface HistoryRecord {
  id: string;
  prompt: string;
  model: string;
  result: {
    overallScore: number;
    passed: boolean;
    metadata: {
      timestamp: number;
    };
  };
  timestamp: number;
}

export default function TrendChart() {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('aiq_history') || '[]');
      // Sort oldest to newest for chronological trend
      const sorted = [...stored].sort((a, b) => a.timestamp - b.timestamp);
      setHistory(sorted);
    } catch (e) {
      // Ignore
    }
  }, []);

  // Filter history to last 30 items for display
  const items = history.slice(-15);

  if (items.length < 2) {
    return (
      <div className="w-full h-[200px] border border-border-subtle bg-surface-secondary/20 rounded-xl flex items-center justify-center text-center p-6 select-none font-sans">
        <p className="text-xs text-text-tertiary max-w-xs leading-relaxed">
          Not enough data yet. Run at least two prompt analyses to begin tracking quality trends here.
        </p>
      </div>
    );
  }

  // Dimensions of SVG coordinate space
  const chartWidth = 600;
  const chartHeight = 200;
  const paddingX = 40;
  const paddingY = 20;

  const width = chartWidth - paddingX * 2;
  const height = chartHeight - paddingY * 2;

  // Map scores (0-100) and timestamps to points
  const points = items.map((rec, index) => {
    const score = rec.result.overallScore;
    const x = paddingX + (index / (items.length - 1)) * width;
    // 100 is at top (paddingY), 0 is at bottom (paddingY + height)
    const y = paddingY + height - (score / 100) * height;
    return { x, y, score, date: new Date(rec.timestamp).toLocaleDateString() };
  });

  // Build SVG path
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`;

  // Horizontal grids scores (0, 25, 50, 75, 100)
  const gridScores = [0, 25, 50, 75, 100];

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current) return;
    
    const svgRect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - svgRect.left;
    
    // Scale coordinate mouse X back to SVG viewbox spacing
    const svgMouseX = (mouseX / svgRect.width) * chartWidth;
    
    // Find closest point index
    let closestIndex = 0;
    let minDiff = Infinity;
    
    points.forEach((p, idx) => {
      const diff = Math.abs(p.x - svgMouseX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = idx;
      }
    });

    // Locate tooltip coordinates relative to parent viewport
    const activePoint = points[closestIndex];
    setHoverIndex(closestIndex);
    
    // Position tooltip above point
    const scaleX = svgRect.width / chartWidth;
    const scaleY = svgRect.height / chartHeight;
    
    setTooltipPos({
      x: activePoint.x * scaleX,
      y: activePoint.y * scaleY - 45
    });
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  return (
    <div ref={containerRef} className="relative w-full h-[220px] select-none">
      
      {/* Interactive Tooltip Overlay */}
      {hoverIndex !== null && (
        <div 
          className="absolute z-10 bg-surface border border-border-strong px-2.5 py-1.5 rounded shadow-floating text-left flex flex-col gap-0.5 pointer-events-none transition-all duration-fast select-none text-[10px] font-sans"
          style={{ 
            left: `${tooltipPos.x}px`, 
            top: `${tooltipPos.y}px`, 
            transform: 'translateX(-50%)'
          }}
        >
          <span className="font-mono text-xs font-semibold text-text-primary">
            Score: {points[hoverIndex].score}/100
          </span>
          <span className="text-text-tertiary">
            {points[hoverIndex].date}
          </span>
        </div>
      )}

      {/* SVG Canvas wrapper */}
      <svg 
        viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
        className="w-full h-full cursor-crosshair overflow-visible"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          {/* Grid/Fill gradients */}
          <linearGradient id="chart-area-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.12" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.00" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {gridScores.map((score) => {
          const y = paddingY + height - (score / 100) * height;
          return (
            <g key={score} className="opacity-40">
              <line 
                x1={paddingX} 
                y1={y} 
                x2={chartWidth - paddingX} 
                y2={y} 
                stroke="var(--color-border)" 
                strokeWidth="1" 
                strokeDasharray="3 3"
              />
              <text 
                x={paddingX - 10} 
                y={y + 4} 
                textAnchor="end" 
                className="font-mono text-[9px] fill-text-tertiary"
              >
                {score}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaPath} fill="url(#chart-area-gradient)" />

        {/* Polyline */}
        <path 
          d={linePath} 
          fill="none" 
          stroke="var(--color-primary)" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />

        {/* Data points (highlight only on hover) */}
        {points.map((p, idx) => (
          <circle
            key={idx}
            cx={p.x}
            cy={p.y}
            r={hoverIndex === idx ? 5 : 2}
            className="transition-all duration-fast"
            fill="var(--color-primary)"
            stroke="var(--color-surface)"
            strokeWidth={hoverIndex === idx ? 2 : 0}
          />
        ))}
      </svg>
    </div>
  );
}
