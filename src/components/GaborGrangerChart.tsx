import React, { useState } from 'react';
import { GaborGrangerMetrics, GaborGrangerPoint } from '../types/pricing';

interface GaborGrangerChartProps {
  metrics: GaborGrangerMetrics;
  elasticityMultiplier: number;
  onChangeElasticity: (val: number) => void;
  cogsPerSeat: number;
}

export const GaborGrangerChart: React.FC<GaborGrangerChartProps> = ({
  metrics,
  elasticityMultiplier,
  onChangeElasticity,
  cogsPerSeat,
}) => {
  const [hoverPoint, setHoverPoint] = useState<GaborGrangerPoint | null>(null);

  if (metrics.points.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex items-center justify-center h-80 text-sm text-slate-500">
        No willingness-to-pay data available for Gabor-Granger modeling.
      </div>
    );
  }

  const width = 680;
  const height = 290;
  const pad = { top: 24, right: 54, bottom: 40, left: 48 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const minP = metrics.points[0].price;
  const maxP = metrics.points[metrics.points.length - 1].price;
  const spanP = Math.max(1, maxP - minP);
  const maxMargin = Math.max(100, metrics.peakRevenue);

  const xScale = (p: number) => pad.left + ((p - minP) / spanP) * plotW;
  const yDemand = (pct: number) => pad.top + ((100 - pct) / 100) * plotH;
  const yDollar = (val: number) =>
    pad.top + ((maxMargin - Math.max(0, val)) / maxMargin) * plotH;

  const demandPath = metrics.points
    .map(
      (pt, i) =>
        `${i === 0 ? 'M' : 'L'} ${xScale(pt.price).toFixed(1)} ${yDemand(
          pt.demandPct
        ).toFixed(1)}`
    )
    .join(' ');

  const marginPath = metrics.points
    .map(
      (pt, i) =>
        `${i === 0 ? 'M' : 'L'} ${xScale(pt.price).toFixed(1)} ${yDollar(
          pt.expectedGrossMargin
        ).toFixed(1)}`
    )
    .join(' ');

  const optX = xScale(metrics.optimalMarginPrice);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * width;
    const clampedX = Math.max(pad.left, Math.min(width - pad.right, relX));
    const targetP = minP + ((clampedX - pad.left) / plotW) * spanP;

    let closest = metrics.points[0];
    let minDiff = Math.abs(closest.price - targetP);
    for (const pt of metrics.points) {
      const d = Math.abs(pt.price - targetP);
      if (d < minDiff) {
        minDiff = d;
        closest = pt;
      }
    }
    setHoverPoint(closest);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-base font-semibold text-slate-900">
            Gabor-Granger Demand &amp; Gross Margin Frontier
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Purchase intent (%) vs. Expected Gross Margin per 100 leads (COGS ${cogsPerSeat}/seat)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label
            htmlFor="elasticity-slider"
            className="text-xs font-medium text-slate-600 whitespace-nowrap"
          >
            Elasticity Sensitivity:{' '}
            <span className="font-mono-tabular font-semibold text-indigo-600">
              {elasticityMultiplier.toFixed(2)}x
            </span>
          </label>
          <input
            id="elasticity-slider"
            type="range"
            min={0.5}
            max={2.0}
            step={0.05}
            value={elasticityMultiplier}
            onChange={(e) => onChangeElasticity(Number(e.target.value))}
            className="w-28 studio-slider"
          />
        </div>
      </div>

      <div className="mt-4">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none overflow-visible"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverPoint(null)}
          role="img"
          aria-label="Gabor-Granger demand and gross margin curves"
        >
          {[0, 25, 50, 75, 100].map((pct) => {
            const y = yDemand(pct);
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
                  className="fill-indigo-600 text-[11px] font-mono-tabular"
                >
                  {pct}%
                </text>
                <text
                  x={width - pad.right + 8}
                  y={y + 4}
                  textAnchor="start"
                  className="fill-emerald-700 text-[11px] font-mono-tabular"
                >
                  ${Math.round((maxMargin * pct) / 100)}
                </text>
              </g>
            );
          })}

          {/* Optimal Gross Margin Price vertical line */}
          <line
            x1={optX}
            y1={pad.top}
            x2={optX}
            y2={pad.top + plotH}
            stroke="#16A34A"
            strokeWidth={2}
          />
          <rect
            x={optX - 44}
            y={pad.top + 4}
            width={88}
            height={20}
            rx={4}
            fill="#16A34A"
          />
          <text
            x={optX}
            y={pad.top + 17}
            textAnchor="middle"
            className="fill-white text-[10px] font-semibold font-mono-tabular"
          >
            Max GM ${metrics.optimalMarginPrice.toFixed(0)}
          </text>

          {/* Demand Curve (Indigo) */}
          <path
            d={demandPath}
            fill="none"
            stroke="#4F46E5"
            strokeWidth={2.5}
          />

          {/* Gross Margin Curve (Emerald) */}
          <path
            d={marginPath}
            fill="none"
            stroke="#16A34A"
            strokeWidth={2.5}
          />

          {/* X-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const p = Math.round(minP + spanP * t);
            const x = xScale(p);
            return (
              <text
                key={t}
                x={x}
                y={height - 12}
                textAnchor="middle"
                className="fill-slate-500 text-[11px] font-mono-tabular"
              >
                ${p}
              </text>
            );
          })}

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
              <span className="text-indigo-300">
                Demand: {hoverPoint.demandPct}%
              </span>
              <span className="text-emerald-300">
                Gross Margin: ${hoverPoint.expectedGrossMargin.toFixed(0)} (
                {hoverPoint.grossMarginPct}%)
              </span>
              <span className="text-slate-300">
                Elasticity ε: {hoverPoint.elasticity.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
