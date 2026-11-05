import React from 'react';
import {
  ConjointPortfolioSummary,
  EvcMetrics,
  GaborGrangerMetrics,
  VanWestendorpMetrics,
} from '../types/pricing';

interface KpiStripProps {
  vw: VanWestendorpMetrics;
  gg: GaborGrangerMetrics;
  evc: EvcMetrics;
  portfolio: ConjointPortfolioSummary;
}

export const KpiStrip: React.FC<KpiStripProps> = ({
  vw,
  gg,
  evc,
  portfolio,
}) => {
  const ltvHealthy = evc.ltvToCac >= 3;

  return (
    <section
      aria-label="Key pricing metrics"
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
    >
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">
            Optimal Price Point (OPP)
          </span>
          <span className="text-xs font-semibold text-indigo-600 font-mono-tabular">
            IPP ${vw.ipp.toFixed(0)}
          </span>
        </div>
        <p className="mt-2 font-display text-2xl font-bold text-slate-900 font-mono-tabular">
          ${vw.opp.toFixed(2)}
        </p>
        <p className="mt-1.5 text-xs text-slate-500 font-mono-tabular">
          Acceptable Range: ${vw.pmc.toFixed(0)} – ${vw.pme.toFixed(0)}
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">
            Margin-Optimal Price
          </span>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono-tabular">
            ε = {gg.elasticityAtOptimal.toFixed(2)}
          </span>
        </div>
        <p className="mt-2 font-display text-2xl font-bold text-slate-900 font-mono-tabular">
          ${gg.optimalMarginPrice.toFixed(2)}
        </p>
        <p className="mt-1.5 text-xs text-slate-500 font-mono-tabular">
          Peak Margin: ${gg.peakGrossMargin.toLocaleString()} / 100 leads
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">
            Total EVC &amp; Unit LTV:CAC
          </span>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded font-mono-tabular ${
              ltvHealthy
                ? 'text-emerald-700 bg-emerald-50'
                : 'text-amber-700 bg-amber-50'
            }`}
          >
            {evc.ltvToCac.toFixed(1)}x LTV:CAC
          </span>
        </div>
        <p className="mt-2 font-display text-2xl font-bold text-slate-900 font-mono-tabular">
          ${evc.totalEvc.toFixed(2)}
        </p>
        <p className="mt-1.5 text-xs text-slate-500 font-mono-tabular">
          Target Capture: ${evc.recommendedEvcPrice.toFixed(2)} · Payback{' '}
          {evc.paybackMonths}m
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">
            GBB Blended Gross Margin
          </span>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono-tabular">
            {portfolio.blendedGrossMarginPct.toFixed(1)}% GM
          </span>
        </div>
        <p className="mt-2 font-display text-2xl font-bold text-slate-900 font-mono-tabular">
          ${(portfolio.totalMonthlyGrossMargin / 1000).toFixed(1)}k
          <span className="text-sm font-normal text-slate-500"> / mo</span>
        </p>
        <p className="mt-1.5 text-xs text-slate-500 font-mono-tabular">
          Blended ARPU: ${portfolio.blendedArpu.toFixed(0)} ·{' '}
          {portfolio.totalProjectedSeats.toLocaleString()} seats
        </p>
      </div>
    </section>
  );
};
