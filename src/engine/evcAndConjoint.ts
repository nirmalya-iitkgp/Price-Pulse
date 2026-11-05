import {
  ConjointPortfolioSummary,
  EvcConfig,
  EvcMetrics,
  FeatureEntitlement,
  TierConfig,
  TierSimulationResult,
} from '../types/pricing';

/**
 * Calculates Economic Value to the Customer (EVC) and SaaS unit economics
 * (Gross Margin, LTV, LTV:CAC, and CAC Payback Period).
 */
export function calculateEvcMetrics(config: EvcConfig): EvcMetrics {
  const positiveValueTotal = config.drivers
    .filter((d) => d.type === 'positive')
    .reduce((sum, d) => sum + Math.max(0, d.monthlyValue), 0);

  const negativeValueTotal = config.drivers
    .filter((d) => d.type === 'negative')
    .reduce((sum, d) => sum + Math.max(0, d.monthlyValue), 0);

  const netDifferentiationValue =
    Math.round((positiveValueTotal - negativeValueTotal) * 100) / 100;

  const totalEvc =
    Math.round((config.referencePrice + netDifferentiationValue) * 100) / 100;

  const captureRatio = Math.min(1, Math.max(0, config.targetCapturePct / 100));
  const recommendedEvcPrice =
    Math.max(
      1,
      Math.round((config.referencePrice + netDifferentiationValue * captureRatio) * 100) / 100
    );

  const customerSurplus =
    Math.round((totalEvc - recommendedEvcPrice) * 100) / 100;

  const grossMarginDollar =
    Math.round((recommendedEvcPrice - config.cogsPerSeat) * 100) / 100;

  const grossMarginPct =
    recommendedEvcPrice > 0
      ? Math.round(((recommendedEvcPrice - config.cogsPerSeat) / recommendedEvcPrice) * 1000) / 10
      : 0;

  const monthlyChurnDecimal = Math.max(0.002, config.monthlyChurnPct / 100);
  const ltv =
    grossMarginDollar > 0
      ? Math.round((grossMarginDollar / monthlyChurnDecimal) * 100) / 100
      : 0;

  const ltvToCac =
    config.cac > 0 ? Math.round((ltv / config.cac) * 100) / 100 : 0;

  const paybackMonths =
    grossMarginDollar > 0
      ? Math.round((config.cac / grossMarginDollar) * 10) / 10
      : 0;

  return {
    referencePrice: config.referencePrice,
    positiveValueTotal,
    negativeValueTotal,
    netDifferentiationValue,
    totalEvc,
    recommendedEvcPrice,
    customerSurplus,
    grossMarginDollar,
    grossMarginPct,
    ltv,
    ltvToCac,
    paybackMonths,
  };
}

/**
 * Simulates Good-Better-Best multi-tier seat packaging using a Multinomial Logit (MNL)
 * conjoint choice model across Starter, Growth, and Enterprise tiers.
 */
export function simulateGbbPortfolio(
  tiers: TierConfig[],
  features: FeatureEntitlement[],
  totalAddressableAccounts = 1000,
  priceSensitivityBeta = 0.035
): ConjointPortfolioSummary {
  const rawUtilities = tiers.map((tier) => {
    const featureUtility = features.reduce((acc, feat) => {
      const included =
        (tier.id === 'starter' && feat.starterIncluded) ||
        (tier.id === 'growth' && feat.growthIncluded) ||
        (tier.id === 'enterprise' && feat.enterpriseIncluded);
      return acc + (included ? feat.utilityWeight : 0);
    }, 0);

    // Seat scale bonus (logarithmic diminishing marginal utility of included seats)
    const seatUtility = Math.log2(Math.max(1, tier.includedSeats)) * 0.45;
    const priceDisutility = priceSensitivityBeta * tier.monthlyPricePerSeat;
    const utilityScore = Math.round((featureUtility + seatUtility - priceDisutility) * 100) / 100;

    return { tier, utilityScore };
  });

  // Numerically stable softmax for MNL share-of-preference
  const maxU = Math.max(...rawUtilities.map((u) => u.utilityScore));
  const expValues = rawUtilities.map((u) => Math.exp(u.utilityScore - maxU));
  const sumExp = expValues.reduce((a, b) => a + b, 0) || 1;

  const results: TierSimulationResult[] = rawUtilities.map((item, idx) => {
    const sharePct = Math.round((expValues[idx] / sumExp) * 1000) / 10;
    const projectedAccounts = Math.round((totalAddressableAccounts * sharePct) / 100);
    const projectedSeats = projectedAccounts * item.tier.includedSeats;
    const monthlyRevenue = Math.round(projectedSeats * item.tier.monthlyPricePerSeat);
    const monthlyCogs = Math.round(projectedSeats * item.tier.cogsPerSeat);
    const monthlyGrossMargin = monthlyRevenue - monthlyCogs;
    const grossMarginPct =
      monthlyRevenue > 0
        ? Math.round((monthlyGrossMargin / monthlyRevenue) * 1000) / 10
        : 0;

    return {
      id: item.tier.id,
      name: item.tier.name,
      targetAudience: item.tier.targetAudience,
      monthlyPricePerSeat: item.tier.monthlyPricePerSeat,
      includedSeats: item.tier.includedSeats,
      utilityScore: item.utilityScore,
      sharePct,
      projectedAccounts,
      projectedSeats,
      monthlyRevenue,
      monthlyGrossMargin,
      grossMarginPct,
    };
  });

  const totalMonthlyRevenue = results.reduce((s, r) => s + r.monthlyRevenue, 0);
  const totalMonthlyGrossMargin = results.reduce((s, r) => s + r.monthlyGrossMargin, 0);
  const totalProjectedSeats = results.reduce((s, r) => s + r.projectedSeats, 0);
  const totalAccounts = results.reduce((s, r) => s + r.projectedAccounts, 0) || 1;

  const blendedGrossMarginPct =
    totalMonthlyRevenue > 0
      ? Math.round((totalMonthlyGrossMargin / totalMonthlyRevenue) * 1000) / 10
      : 0;

  const blendedArpu = Math.round((totalMonthlyRevenue / totalAccounts) * 100) / 100;

  return {
    tiers: results,
    totalMonthlyRevenue,
    totalMonthlyGrossMargin,
    blendedGrossMarginPct,
    blendedArpu,
    totalProjectedSeats,
  };
}
