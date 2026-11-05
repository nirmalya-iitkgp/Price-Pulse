import React, { useState } from 'react';
import { VanWestendorpMetrics, VanWestendorpPoint } from '../types/pricing';

interface VanWestendorpChartProps {
  metrics: VanWestendorpMetrics;
}

export const VanWestendorpChart: React.FC<VanWestendorpChartProps> = ({
  metrics,
}) => {
  const [hoverPoint, setHoverPoint] = useState<VanWestendorpPoint | null>(null);
  const [visibleCurves, setVisibleCurves] = useState({
    tooCheap: true,
    bargain: true,
    expensive: true,
    tooExpensive: true,
  });

  if (metrics.curves.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex items-center justify-center h-80 text-sm text-slate-500">
        Add at least one survey respondent to render Van Westendorp curves.
      </div>
    );
  }

  const width = 680;
  const height = 310;
  const pad = { top: 24, right: 24, bottom: 40, left: 48 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const span = Math.max(1, metrics.maxPrice - metrics.minPrice);
  const xScale = (price: number) =>
    pad.left + ((price - metrics.minPrice) / span) * plotW;
  const yScale = (pct: number) => pad.top + ((100 - pct) / 100) * plotH;

  const buildPath = (accessor: (pt: VanWestendorpPoint) => number) =>
    metrics.curves
      .map(
        (pt, idx) =>
          `${idx === 0 ? 'M' : 'L'} ${xScale(pt.price).toFixed(1)} ${yScale(
            accessor(pt)
          ).toFixed(1)}`
      )
      .join(' ');

  const pmcX = xScale(metrics.pmc);
  const pmeX = xScale(metrics.pme);
  const oppX = xScale(metrics.opp);
  const ippX = xScale(metrics.ipp);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * width;
    const clampedX = Math.max(pad.left, Math.min(width - pad.right, relX));
    const targetPrice =
      metrics.minPrice + ((clampedX - pad.left) / plotW) * span;

    let closest = metrics.curves[0];
    let minDiff = Math.abs(closest.price - targetPrice);
    for (const pt of metrics.curves) {
      const d = Math.abs(pt.price - targetPrice);
      if (d < minDiff) {
        minDiff = d;
        closest = pt;
      }
    }
    setHoverPoint(closest);
  };

  const toggleCurve = (key: keyof typeof visibleCurves) => {
    setVisibleCurves((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const xTicks = 5;
  const tickPrices = Array.from({ length: xTicks + 1 }, (_, i) =>
    Math.round(metrics.minPrice + (span * i) / xTicks)
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-base font-semibold text-slate-900">
            Van Westendorp Price Sensitivity Meter
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Cumulative respondent thresholds · Shaded band marks Acceptable Price Range ($
            {metrics.pmc.toFixed(0)}–${metrics.pme.toFixed(0)})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[
            { key: 'tooCheap' as const, label: 'Too Cheap', color: '#0EA5E9' },
            { key: 'bargain' as const, label: 'Bargain', color: '#16A34A' },
            { key: 'expensive' as const, label: 'Expensive', color: '#D97706' },
            { key: 'tooExpensive' as const, label: 'Too Expensive', color: '#4F46E5' },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => toggleCurve(item.key)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                visibleCurves[item.key]
                  ? 'bg-white border-slate-200 text-slate-700'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <span
                className="w-2.5 h-0.5 inline-block"
                style={{ backgroundColor: item.color }}
              />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none overflow-visible"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverPoint(null)}
          role="img"
          aria-label="Van Westendorp cumulative price sensitivity curves"
        >
          {/* Acceptable Price Range shaded band */}
          <rect
            x={pmcX}
            y={pad.top}
            width={Math.max(0, pmeX - pmcX)}
            height={plotH}
            fill="#4F46E5"
            fillOpacity={0.05}
          />

          {/* Horizontal gridlines */}
          {[0, 25, 50, 75, 100].map((pct) => {
            const y = yScale(pct);
            return (
              <g key={pct}>
                <line
                  x1={pad.left}
                  y1={y}
                  x2={width - pad.right}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeDasharray={pct === 0 ? undefined : '3 3'}
                />
                <text
                  x={pad.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-400 text-[11px] font-mono-tabular"
                >
                  {pct}%
                </text>
              </g>
            );
          })}

          {/* X-axis ticks */}
          {tickPrices.map((p) => {
            const x = xScale(p);
            return (
              <g key={p}>
                <line
                  x1={x}
                  y1={pad.top + plotH}
                  x2={x}
                  y2={pad.top + plotH + 5}
                  stroke="#CBD5E1"
                />
                <text
                  x={x}
                  y={height - 12}
                  textAnchor="middle"
                  className="fill-slate-500 text-[11px] font-mono-tabular"
                >
                  ${p}
                </text>
              </g>
            );
          })}

          {/* PMC & PME boundary lines */}
          <line
            x1={pmcX}
            y1={pad.top}
            x2={pmcX}
            y2={pad.top + plotH}
            stroke="#94A3B8"
            strokeDasharray="4 4"
          />
          <text
            x={pmcX}
            y={pad.top - 6}
            textAnchor="middle"
            className="fill-slate-500 text-[10px] font-mono-tabular"
          >
            PMC ${metrics.pmc.toFixed(0)}
          </text>

          <line
            x1={pmeX}
            y1={pad.top}
            x2={pmeX}
            y2={pad.top + plotH}
            stroke="#94A3B8"
            strokeDasharray="4 4"
          />
          <text
            x={pmeX}
            y={pad.top - 6}
            textAnchor="middle"
            className="fill-slate-500 text-[10px] font-mono-tabular"
          >
            PME ${metrics.pme.toFixed(0)}
          </text>

          {/* IPP marker */}
          <line
            x1={ippX}
            y1={pad.top}
            x2={ippX}
            y2={pad.top + plotH}
            stroke="#16A34A"
            strokeWidth={1.5}
            strokeDasharray="3 3"
          />

          {/* OPP marker */}
          <line
            x1={oppX}
            y1={pad.top}
            x2={oppX}
            y2={pad.top + plotH}
            stroke="#4F46E5"
            strokeWidth={2}
          />
          <rect
            x={oppX - 36}
            y={pad.top + 6}
            width={72}
            height={20}
            rx={4}
            fill="#4F46E5"
          />
          <text
            x={oppX}
            y={pad.top + 19}
            textAnchor="middle"
            className="fill-white text-[10px] font-semibold font-mono-tabular"
          >
            OPP ${metrics.opp.toFixed(0)}
          </text>

          {/* Cumulative Curves */}
          {visibleCurves.tooCheap && (
            <path
              d={buildPath((p) => p.tooCheapPct)}
              fill="none"
              stroke="#0EA5E9"
              strokeWidth={2.25}
            />
          )}
          {visibleCurves.bargain && (
            <path
              d={buildPath((p) => p.bargainPct)}
              fill="none"
              stroke="#16A34A"
              strokeWidth={2.25}
            />
          )}
          {visibleCurves.expensive && (
            <path
              d={buildPath((p) => p.expensivePct)}
              fill="none"
              stroke="#D97706"
              strokeWidth={2.25}
            />
          )}
          {visibleCurves.tooExpensive && (
            <path
              d={buildPath((p) => p.tooExpensivePct)}
              fill="none"
              stroke="#4F46E5"
              strokeWidth={2.5}
            />
          )}

          {/* Hover crosshair */}
          {hoverPoint && (
            <line
              x1={xScale(hoverPoint.price)}
              y1={pad.top}
              x2={xScale(hoverPoint.price)}
              y2={pad.top + plotH}
              stroke="#0F172A"
              strokeWidth={1}
              strokeDasharray="2 2"
            />
          )}
        </svg>

        {hoverPoint && (
          <div className="mt-2 px-3 py-2 bg-slate-900 text-white rounded-lg text-xs flex flex-wrap items-center justify-between gap-4 font-mono-tabular">
            <span className="font-semibold">
              Price: ${hoverPoint.price.toFixed(2)}
            </span>
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sky-300">
                Too Cheap: {hoverPoint.tooCheapPct}%
              </span>
              <span className="text-emerald-300">
                Bargain: {hoverPoint.bargainPct}%
              </span>
              <span className="text-amber-300">
                Expensive: {hoverPoint.expensivePct}%
              </span>
              <span className="text-indigo-300">
                Too Expensive: {hoverPoint.tooExpensivePct}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
