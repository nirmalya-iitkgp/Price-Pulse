import React from 'react';
import {
  ConjointPortfolioSummary,
  FeatureEntitlement,
  TierConfig,
} from '../types/pricing';
import { clampPrice } from '../engine/security';

interface GbbSeatMatrixProps {
  tiers: TierConfig[];
  features: FeatureEntitlement[];
  portfolio: ConjointPortfolioSummary;
  onUpdateTier: (tierId: TierConfig['id'], patch: Partial<TierConfig>) => void;
  onToggleFeature: (
    featureId: string,
    tierId: 'starter' | 'growth' | 'enterprise'
  ) => void;
}

export const GbbSeatMatrix: React.FC<GbbSeatMatrixProps> = ({
  tiers,
  features,
  portfolio,
  onUpdateTier,
  onToggleFeature,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-base font-semibold text-slate-900">
            Good-Better-Best Seat Matrix &amp; Conjoint Simulator
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Multinomial logit share-of-preference across 1,000 addressable accounts · Adjust seat pricing &amp; entitlements
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono-tabular">
          <span className="text-slate-500">Portfolio MRR:</span>
          <span className="font-bold text-slate-900 text-sm">
            ${portfolio.totalMonthlyRevenue.toLocaleString()}
          </span>
          <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded font-semibold">
            {portfolio.blendedGrossMarginPct.toFixed(1)}% Blended GM
          </span>
        </div>
      </div>

      {/* 3-Tier Cards */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {tiers.map((tier) => {
          const sim = portfolio.tiers.find((s) => s.id === tier.id)!;
          const isGrowth = tier.id === 'growth';
          return (
            <div
              key={tier.id}
              className={`rounded-xl p-5 border flex flex-col justify-between ${
                isGrowth
                  ? 'border-indigo-600 bg-indigo-50/20'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-base font-bold text-slate-900">
                    {tier.name}
                  </h3>
                  <span className="text-xs font-semibold font-mono-tabular text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                    {sim.sharePct.toFixed(1)}% Share
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {tier.targetAudience}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor={`price-${tier.id}`}
                      className="block text-[11px] font-medium text-slate-500"
                    >
                      Price / Seat ($)
                    </label>
                    <input
                      id={`price-${tier.id}`}
                      type="number"
                      min={1}
                      max={5000}
                      value={tier.monthlyPricePerSeat}
                      onChange={(e) =>
                        onUpdateTier(tier.id, {
                          monthlyPricePerSeat: clampPrice(
                            Number(e.target.value),
                            1,
                            5000
                          ),
                        })
                      }
                      className="mt-1 w-full px-2.5 py-1.5 text-sm font-semibold font-mono-tabular bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={`seats-${tier.id}`}
                      className="block text-[11px] font-medium text-slate-500"
                    >
                      Included Seats
                    </label>
                    <input
                      id={`seats-${tier.id}`}
                      type="number"
                      min={1}
                      max={500}
                      value={tier.includedSeats}
                      onChange={(e) =>
                        onUpdateTier(tier.id, {
                          includedSeats: Math.max(
                            1,
                            Math.min(500, Math.round(Number(e.target.value) || 1))
                          ),
                        })
                      }
                      className="mt-1 w-full px-2.5 py-1.5 text-sm font-semibold font-mono-tabular bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 space-y-1.5 text-xs font-mono-tabular">
                <div className="flex justify-between">
                  <span className="text-slate-500">Projected Accounts</span>
                  <span className="font-semibold text-slate-900">
                    {sim.projectedAccounts} ({sim.projectedSeats.toLocaleString()} seats)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tier MRR</span>
                  <span className="font-semibold text-slate-900">
                    ${sim.monthlyRevenue.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Gross Margin</span>
                  <span className="font-semibold text-emerald-700">
                    ${sim.monthlyGrossMargin.toLocaleString()} ({sim.grossMarginPct}%)
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature Conjoint Entitlement Matrix */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
              <th className="py-2.5 pr-4">Feature Entitlement</th>
              <th className="py-2.5 px-4 text-right">Conjoint Utility</th>
              <th className="py-2.5 px-4 text-center">Starter</th>
              <th className="py-2.5 px-4 text-center">Growth</th>
              <th className="py-2.5 pl-4 text-center">Enterprise</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {features.map((feat) => (
              <tr key={feat.id} className="hover:bg-slate-50/80">
                <td className="py-2.5 pr-4 font-medium text-slate-800">
                  {feat.name}
                </td>
                <td className="py-2.5 px-4 text-right font-mono-tabular text-indigo-600 font-semibold">
                  +{feat.utilityWeight.toFixed(1)} utils
                </td>
                {(['starter', 'growth', 'enterprise'] as const).map((tierKey) => {
                  const checked =
                    (tierKey === 'starter' && feat.starterIncluded) ||
                    (tierKey === 'growth' && feat.growthIncluded) ||
                    (tierKey === 'enterprise' && feat.enterpriseIncluded);
                  return (
                    <td key={tierKey} className="py-2.5 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggleFeature(feat.id, tierKey)}
                        aria-label={`${feat.name} in ${tierKey}`}
                        className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
