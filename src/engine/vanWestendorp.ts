import { SurveyRespondent, VanWestendorpMetrics, VanWestendorpPoint } from '../types/pricing';

/**
 * Finds the exact x-coordinate where two piecewise-linear curves f(x) and g(x)
 * cross, given that f starts >= g and ends <= g (or vice versa).
 */
function findCurveIntersection(
  prices: number[],
  curveA: number[],
  curveB: number[],
  fallbackPrice: number
): number {
  for (let i = 0; i < prices.length - 1; i++) {
    const diff1 = curveA[i] - curveB[i];
    const diff2 = curveA[i + 1] - curveB[i + 1];

    if (diff1 === 0) {
      return prices[i];
    }

    if ((diff1 > 0 && diff2 <= 0) || (diff1 < 0 && diff2 >= 0)) {
      const denom = diff1 - diff2;
      if (Math.abs(denom) < 1e-9) {
        return prices[i];
      }
      const t = diff1 / denom;
      return Math.round((prices[i] + t * (prices[i + 1] - prices[i])) * 100) / 100;
    }
  }
  return fallbackPrice;
}

/**
 * Computes Van Westendorp Price Sensitivity Meter (PSM) cumulative curves
 * and exact intersection points:
 * - PMC (Point of Marginal Cheapness): Too Cheap = Expensive
 * - IPP (Indifference Price Point): Bargain = Expensive
 * - OPP (Optimal Price Point): Too Cheap = Too Expensive
 * - PME (Point of Marginal Expensiveness): Too Expensive = Bargain
 */
export function calculateVanWestendorp(
  respondents: SurveyRespondent[],
  steps = 80
): VanWestendorpMetrics {
  if (respondents.length === 0) {
    return {
      pmc: 0,
      ipp: 0,
      opp: 0,
      pme: 0,
      acceptableRangeWidth: 0,
      curves: [],
      minPrice: 0,
      maxPrice: 100,
    };
  }

  const allValues = respondents.flatMap((r) => [
    r.tooCheap,
    r.bargain,
    r.expensive,
    r.tooExpensive,
  ]);
  const rawMin = Math.min(...allValues);
  const rawMax = Math.max(...allValues);
  const padding = Math.max(5, Math.round((rawMax - rawMin) * 0.1));
  const minPrice = Math.max(0, Math.floor(rawMin - padding));
  const maxPrice = Math.ceil(rawMax + padding);
  const span = Math.max(1, maxPrice - minPrice);

  const n = respondents.length;
  const prices: number[] = [];
  const tooCheapArr: number[] = [];
  const bargainArr: number[] = [];
  const expensiveArr: number[] = [];
  const tooExpensiveArr: number[] = [];
  const curves: VanWestendorpPoint[] = [];

  for (let s = 0; s <= steps; s++) {
    const price = Math.round((minPrice + (span * s) / steps) * 100) / 100;
    prices.push(price);

    let tooCheapCount = 0;
    let bargainCount = 0;
    let expensiveCount = 0;
    let tooExpensiveCount = 0;

    for (let i = 0; i < n; i++) {
      const r = respondents[i];
      if (r.tooCheap >= price) tooCheapCount++;
      if (r.bargain >= price) bargainCount++;
      if (r.expensive <= price) expensiveCount++;
      if (r.tooExpensive <= price) tooExpensiveCount++;
    }

    const tooCheapPct = Math.round((tooCheapCount / n) * 1000) / 10;
    const bargainPct = Math.round((bargainCount / n) * 1000) / 10;
    const expensivePct = Math.round((expensiveCount / n) * 1000) / 10;
    const tooExpensivePct = Math.round((tooExpensiveCount / n) * 1000) / 10;

    tooCheapArr.push(tooCheapPct);
    bargainArr.push(bargainPct);
    expensiveArr.push(expensivePct);
    tooExpensiveArr.push(tooExpensivePct);

    curves.push({
      price,
      tooCheapPct,
      bargainPct,
      expensivePct,
      tooExpensivePct,
    });
  }

  const midPrice = Math.round(((minPrice + maxPrice) / 2) * 100) / 100;
  const pmc = findCurveIntersection(prices, tooCheapArr, expensiveArr, minPrice);
  const ipp = findCurveIntersection(prices, bargainArr, expensiveArr, midPrice);
  const opp = findCurveIntersection(prices, tooCheapArr, tooExpensiveArr, midPrice);
  const pme = findCurveIntersection(prices, bargainArr, tooExpensiveArr, maxPrice);

  const orderedPmc = Math.min(pmc, pme);
  const orderedPme = Math.max(pmc, pme);

  return {
    pmc: orderedPmc,
    ipp,
    opp,
    pme: orderedPme,
    acceptableRangeWidth: Math.round((orderedPme - orderedPmc) * 100) / 100,
    curves,
    minPrice,
    maxPrice,
  };
}
