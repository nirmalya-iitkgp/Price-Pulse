export interface SurveyRespondent {
  id: string;
  segment: string;
  tooCheap: number;
  bargain: number;
  expensive: number;
  tooExpensive: number;
  maxWillingnessToPay: number;
}

export interface VanWestendorpPoint {
  price: number;
  tooCheapPct: number;
  bargainPct: number;
  expensivePct: number;
  tooExpensivePct: number;
}

export interface VanWestendorpMetrics {
  pmc: number; // Point of Marginal Cheapness
  ipp: number; // Indifference Price Point
  opp: number; // Optimal Price Point
  pme: number; // Point of Marginal Expensiveness
  acceptableRangeWidth: number;
  curves: VanWestendorpPoint[];
  minPrice: number;
  maxPrice: number;
}

export interface GaborGrangerPoint {
  price: number;
  demandPct: number;
  expectedRevenue: number; // per 100 prospects
  expectedGrossMargin: number; // per 100 prospects
  grossMarginPct: number;
  elasticity: number; // point price elasticity of demand
}

export interface GaborGrangerMetrics {
  points: GaborGrangerPoint[];
  optimalRevenuePrice: number;
  peakRevenue: number;
  optimalMarginPrice: number;
  peakGrossMargin: number;
  elasticityAtOptimal: number;
}

export interface ValueDriver {
  id: string;
  label: string;
  monthlyValue: number;
  type: 'positive' | 'negative';
}

export interface EvcConfig {
  referencePrice: number;
  drivers: ValueDriver[];
  targetCapturePct: number; // % of differentiation value captured
  cogsPerSeat: number;
  monthlyChurnPct: number;
  cac: number;
}

export interface EvcMetrics {
  referencePrice: number;
  positiveValueTotal: number;
  negativeValueTotal: number;
  netDifferentiationValue: number;
  totalEvc: number;
  recommendedEvcPrice: number;
  customerSurplus: number;
  grossMarginDollar: number;
  grossMarginPct: number;
  ltv: number;
  ltvToCac: number;
  paybackMonths: number;
}

export interface FeatureEntitlement {
  id: string;
  name: string;
  utilityWeight: number;
  starterIncluded: boolean;
  growthIncluded: boolean;
  enterpriseIncluded: boolean;
}

export interface TierConfig {
  id: 'starter' | 'growth' | 'enterprise';
  name: string;
  targetAudience: string;
  monthlyPricePerSeat: number;
  includedSeats: number;
  cogsPerSeat: number;
}

export interface TierSimulationResult {
  id: 'starter' | 'growth' | 'enterprise';
  name: string;
  targetAudience: string;
  monthlyPricePerSeat: number;
  includedSeats: number;
  utilityScore: number;
  sharePct: number;
  projectedAccounts: number;
  projectedSeats: number;
  monthlyRevenue: number;
  monthlyGrossMargin: number;
  grossMarginPct: number;
}

export interface ConjointPortfolioSummary {
  tiers: TierSimulationResult[];
  totalMonthlyRevenue: number;
  totalMonthlyGrossMargin: number;
  blendedGrossMarginPct: number;
  blendedArpu: number;
  totalProjectedSeats: number;
}

export interface DatasetPreset {
  id: string;
  name: string;
  industry: string;
  billingUnit: string;
  respondents: SurveyRespondent[];
  evcConfig: EvcConfig;
  tiers: TierConfig[];
  features: FeatureEntitlement[];
}

export type StudioSection =
  | 'overview'
  | 'van-westendorp'
  | 'gabor-granger'
  | 'gbb-matrix'
  | 'evc-economics'
  | 'survey-data';
