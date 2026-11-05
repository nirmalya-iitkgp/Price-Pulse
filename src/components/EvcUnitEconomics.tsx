import React from 'react';
import { EvcConfig, EvcMetrics } from '../types/pricing';
import { clampPrice } from '../engine/security';

interface EvcUnitEconomicsProps {
  config: EvcConfig;
  metrics: EvcMetrics;
  onUpdateConfig: (next: EvcConfig) => void;
}

export const EvcUnitEconomics: React.FC<EvcUnitEconomicsProps> = ({
  config,
  metrics,
  onUpdateConfig,
}) => {
  const handleDriverChange = (id: string, value: number) => {
    const safeVal = clampPrice(value, 0, 5000);
    onUpdateConfig({
      ...config,
      drivers: config.drivers.map((d) =>
        d.id === id ? { ...d, monthlyValue: safeVal } : d
      ),
    });
  };

  const maxBar = Math.max(1, metrics.totalEvc, metrics.referencePrice + metrics.positiveValueTotal);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-base font-semibold text-slate-900">
            Economic Value to the Customer (EVC) &amp; Unit Economics
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Quantify competitive reference value, differentiation drivers, and SaaS LTV:CAC
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono-tabular">
          <span className="text-slate-500">Total EVC:</span>
          <span className="font-bold text-slate-900 text-sm">
            ${metrics.totalEvc.toFixed(2)}
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded font-semibold">
            Customer Surplus: ${metrics.customerSurplus.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: EVC Value Drivers & Waterfall Bars */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between gap-4 py-2 border-b border-slate-100">
            <label
              htmlFor="evc-ref-price"
              className="text-xs font-medium text-slate-700"
            >
              Next-Best Competitive Reference Price ($)
            </label>
            <input
              id="evc-ref-price"
              type="number"
              min={0}
              max={10000}
              value={config.referencePrice}
              onChange={(e) =>
                onUpdateConfig({
                  ...config,
                  referencePrice: clampPrice(Number(e.target.value), 0, 10000),
                })
              }
              className="w-24 px-2.5 py-1.5 text-right text-xs font-mono-tabular bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div className="space-y-3">
            {config.drivers.map((driver) => {
              const barPct = Math.min(100, Math.round((driver.monthlyValue / maxBar) * 100));
              const isPos = driver.type === 'positive';
              return (
                <div key={driver.id} className="space-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-700 truncate">
                      {isPos ? '+' : '−'} {driver.label}
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={5000}
                      aria-label={driver.label}
                      value={driver.monthlyValue}
                      onChange={(e) =>
                        handleDriverChange(driver.id, Number(e.target.value))
                      }
                      className="w-20 px-2 py-1 text-right text-xs font-mono-tabular bg-slate-50 border border-slate-200 rounded focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        isPos ? 'bg-indigo-600' : 'bg-amber-500'
                      }`}
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* EVC Summary Strip */}
          <div className="pt-3 border-t border-slate-200 grid grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block">Net Differentiation</span>
              <span className="mt-0.5 font-mono-tabular font-semibold text-indigo-600 text-sm">
                +${metrics.netDifferentiationValue.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Recommended Price</span>
              <span className="mt-0.5 font-mono-tabular font-semibold text-slate-900 text-sm">
                ${metrics.recommendedEvcPrice.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Unit Gross Margin</span>
              <span className="mt-0.5 font-mono-tabular font-semibold text-emerald-700 text-sm">
                ${metrics.grossMarginDollar.toFixed(2)} ({metrics.grossMarginPct}%)
              </span>
            </div>
          </div>
        </div>

        {/* Right: Interactive Unit Economics Sliders */}
        <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
          <h3 className="font-display text-xs font-semibold text-slate-900">
            Unit Economics &amp; Value-Capture Controls
          </h3>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <label htmlFor="capture-slider" className="text-slate-600">
                Differentiation Value Capture
              </label>
              <span className="font-mono-tabular font-semibold text-indigo-600">
                {config.targetCapturePct}%
              </span>
            </div>
            <input
              id="capture-slider"
              type="range"
              min={10}
              max={90}
              step={5}
              value={config.targetCapturePct}
              onChange={(e) =>
                onUpdateConfig({
                  ...config,
                  targetCapturePct: Number(e.target.value),
                })
              }
              className="w-full studio-slider"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <label htmlFor="cogs-slider" className="text-slate-600">
                COGS per Seat / Month
              </label>
              <span className="font-mono-tabular font-semibold text-slate-900">
                ${config.cogsPerSeat}
              </span>
            </div>
            <input
              id="cogs-slider"
              type="range"
              min={1}
              max={60}
              step={1}
              value={config.cogsPerSeat}
              onChange={(e) =>
                onUpdateConfig({
                  ...config,
                  cogsPerSeat: Number(e.target.value),
                })
              }
              className="w-full studio-slider"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <label htmlFor="churn-slider" className="text-slate-600">
                Monthly Logo Churn
              </label>
              <span className="font-mono-tabular font-semibold text-slate-900">
                {config.monthlyChurnPct.toFixed(1)}%
              </span>
            </div>
            <input
              id="churn-slider"
              type="range"
              min={0.5}
              max={8.0}
              step={0.1}
              value={config.monthlyChurnPct}
              onChange={(e) =>
                onUpdateConfig({
                  ...config,
                  monthlyChurnPct: Number(e.target.value),
                })
              }
              className="w-full studio-slider"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <label htmlFor="cac-slider" className="text-slate-600">
                Customer Acquisition Cost (CAC)
              </label>
              <span className="font-mono-tabular font-semibold text-slate-900">
                ${config.cac}
              </span>
            </div>
            <input
              id="cac-slider"
              type="range"
              min={50}
              max={1500}
              step={25}
              value={config.cac}
              onChange={(e) =>
                onUpdateConfig({
                  ...config,
                  cac: Number(e.target.value),
                })
              }
              className="w-full studio-slider"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-slate-500 block">Seat LTV</span>
              <span className="font-mono-tabular font-semibold text-slate-900">
                ${metrics.ltv.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">LTV : CAC</span>
              <span
                className={`font-mono-tabular font-semibold ${
                  metrics.ltvToCac >= 3 ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {metrics.ltvToCac.toFixed(1)}x
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">CAC Payback</span>
              <span className="font-mono-tabular font-semibold text-slate-900">
                {metrics.paybackMonths} mo
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
