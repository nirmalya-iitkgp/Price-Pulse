import { GaborGrangerMetrics, GaborGrangerPoint, SurveyRespondent } from '../types/pricing';

/**
 * Computes Gabor-Granger demand curve, price elasticity of demand,
 * expected revenue, and gross margin across candidate price points.
 *
 * @param respondents Survey respondent dataset
 * @param cogsPerSeat Unit cost of goods sold per seat/month
 * @param elasticityMultiplier Sensitivity factor (1.0 = empirical survey, >1.0 = more elastic)
 * @param steps Number of price steps to evaluate
 */
export function calculateGaborGranger(
  respondents: SurveyRespondent[],
  cogsPerSeat: number,
  elasticityMultiplier = 1.0,
  steps = 40
): GaborGrangerMetrics {
  if (respondents.length === 0) {
    return {
      points: [],
      optimalRevenuePrice: 0,
      peakRevenue: 0,
      optimalMarginPrice: 0,
      peakGrossMargin: 0,
      elasticityAtOptimal: 0,
    };
  }

  const wtps = respondents.map((r) => r.maxWillingnessToPay);
  const minWtp = Math.max(1, Math.floor(Math.min(...wtps) * 0.7));
  const maxWtp = Math.ceil(Math.max(...wtps) * 1.25);
  const span = Math.max(1, maxWtp - minWtp);
  const medianWtp = [...wtps].sort((a, b) => a - b)[Math.floor(wtps.length / 2)];
  const n = respondents.length;

  const rawPoints: Array<{ price: number; demandPct: number }> = [];

  for (let s = 0; s <= steps; s++) {
    const price = Math.round((minWtp + (span * s) / steps) * 100) / 100;
    // Adjust effective WTP around median when elasticityMultiplier != 1
    let willingCount = 0;
    for (let i = 0; i < n; i++) {
      const adjustedWtp =
        medianWtp + (respondents[i].maxWillingnessToPay - medianWtp) / Math.max(0.25, elasticityMultiplier);
      if (adjustedWtp >= price) {
        willingCount++;
      }
    }
    const demandPct = Math.round((willingCount / n) * 1000) / 10;
    rawPoints.push({ price, demandPct });
  }

  const points: GaborGrangerPoint[] = rawPoints.map((pt, idx) => {
    const prev = idx > 0 ? rawPoints[idx - 1] : pt;
    const next = idx < rawPoints.length - 1 ? rawPoints[idx + 1] : pt;

    const dP = next.price - prev.price;
    const dQ = next.demandPct - prev.demandPct;
    const avgP = (next.price + prev.price) / 2;
    const avgQ = (next.demandPct + prev.demandPct) / 2;

    const elasticity =
      dP > 0 && avgQ > 0 ? Math.round(((dQ / avgQ) / (dP / avgP)) * 100) / 100 : 0;

    const expectedRevenue = Math.round(pt.price * pt.demandPct * 100) / 100;
    const unitMargin = pt.price - cogsPerSeat;
    const expectedGrossMargin = Math.round(unitMargin * pt.demandPct * 100) / 100;
    const grossMarginPct =
      pt.price > 0 ? Math.round(((pt.price - cogsPerSeat) / pt.price) * 1000) / 10 : 0;

    return {
      price: pt.price,
      demandPct: pt.demandPct,
      expectedRevenue,
      expectedGrossMargin,
      grossMarginPct,
      elasticity,
    };
  });

  let bestRevPt = points[0];
  let bestMarginPt = points[0];

  for (const pt of points) {
    if (pt.expectedRevenue > bestRevPt.expectedRevenue) {
      bestRevPt = pt;
    }
    if (pt.expectedGrossMargin > bestMarginPt.expectedGrossMargin) {
      bestMarginPt = pt;
    }
  }

  return {
    points,
    optimalRevenuePrice: bestRevPt.price,
    peakRevenue: bestRevPt.expectedRevenue,
    optimalMarginPrice: bestMarginPt.price,
    peakGrossMargin: bestMarginPt.expectedGrossMargin,
    elasticityAtOptimal: bestMarginPt.elasticity,
  };
}
