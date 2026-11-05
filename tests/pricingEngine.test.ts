import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateVanWestendorp } from '../src/engine/vanWestendorp';
import { calculateGaborGranger } from '../src/engine/gaborGranger';
import { calculateEvcMetrics, simulateGbbPortfolio } from '../src/engine/evcAndConjoint';
import { DATASET_PRESETS } from '../src/data/presets';

describe('Van Westendorp PSM Engine', () => {
  it('computes ordered PMC <= OPP/IPP <= PME and valid cumulative curves', () => {
    const preset = DATASET_PRESETS[0];
    const result = calculateVanWestendorp(preset.respondents);

    assert.ok(result.pmc > 0, 'PMC should be positive');
    assert.ok(result.pme > result.pmc, 'PME should be strictly greater than PMC');
    assert.ok(result.opp >= result.pmc && result.opp <= result.pme, 'OPP should lie within [PMC, PME]');
    assert.ok(result.ipp >= result.pmc && result.ipp <= result.pme, 'IPP should lie within [PMC, PME]');
    assert.equal(result.curves.length, 81, 'Should generate 81 curve points for 80 steps');
    assert.equal(result.curves[0].tooCheapPct, 100, 'At minPrice below all responses, Too Cheap is 100%');
    assert.equal(result.curves[0].tooExpensivePct, 0, 'At minPrice below all responses, Too Expensive is 0%');
  });

  it('handles empty respondent arrays gracefully without NaN', () => {
    const empty = calculateVanWestendorp([]);
    assert.equal(empty.opp, 0);
    assert.equal(empty.pmc, 0);
    assert.equal(empty.pme, 0);
    assert.equal(empty.curves.length, 0);
  });
});

describe('Gabor-Granger Elasticity & Margin Engine', () => {
  it('computes monotonically non-increasing demand and identifies peak gross margin price', () => {
    const preset = DATASET_PRESETS[0];
    const gg = calculateGaborGranger(preset.respondents, 11, 1.0);

    assert.ok(gg.points.length > 10);
    for (let i = 1; i < gg.points.length; i++) {
      assert.ok(
        gg.points[i].demandPct <= gg.points[i - 1].demandPct,
        'Demand % must be monotonically non-increasing as price rises'
      );
    }
    assert.ok(gg.optimalMarginPrice > 11, 'Optimal margin price must exceed COGS');
    assert.ok(gg.peakGrossMargin > 0, 'Peak gross margin must be positive');
  });
});

describe('EVC & Good-Better-Best Conjoint Engine', () => {
  it('calculates EVC total, customer surplus, and LTV:CAC accurately', () => {
    const preset = DATASET_PRESETS[0];
    const evc = calculateEvcMetrics(preset.evcConfig);

    // 49 + (38 + 24 + 18 - 12) = 49 + 68 = 117
    assert.equal(evc.totalEvc, 117);
    assert.ok(evc.recommendedEvcPrice > preset.evcConfig.referencePrice);
    assert.ok(evc.recommendedEvcPrice < evc.totalEvc);
    assert.ok(evc.ltvToCac > 3, 'Healthy SaaS LTV:CAC should exceed 3x');
  });

  it('simulates Good-Better-Best tier shares summing to ~100% and responds to price changes', () => {
    const preset = DATASET_PRESETS[0];
    const base = simulateGbbPortfolio(preset.tiers, preset.features);
    const totalShare = base.tiers.reduce((s, t) => s + t.sharePct, 0);
    assert.ok(Math.abs(totalShare - 100) <= 0.3, `Total share ${totalShare} should sum to ~100%`);

    // Raising Growth price significantly should reduce Growth share
    const higherGrowthTiers = preset.tiers.map((t) =>
      t.id === 'growth' ? { ...t, monthlyPricePerSeat: 189 } : t
    );
    const shifted = simulateGbbPortfolio(higherGrowthTiers, preset.features);
    const baseGrowth = base.tiers.find((t) => t.id === 'growth')!;
    const shiftedGrowth = shifted.tiers.find((t) => t.id === 'growth')!;
    assert.ok(shiftedGrowth.sharePct < baseGrowth.sharePct, 'Higher price must reduce tier share');
  });
});
