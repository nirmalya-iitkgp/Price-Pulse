import { useMemo, useState } from 'react';
import { DATASET_PRESETS } from './data/presets';
import { calculateVanWestendorp } from './engine/vanWestendorp';
import { calculateGaborGranger } from './engine/gaborGranger';
import {
  calculateEvcMetrics,
  simulateGbbPortfolio,
} from './engine/evcAndConjoint';
import { exportRespondentsToCsv } from './engine/security';
import {
  EvcConfig,
  FeatureEntitlement,
  StudioSection,
  SurveyRespondent,
  TierConfig,
} from './types/pricing';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { KpiStrip } from './components/KpiStrip';
import { VanWestendorpChart } from './components/VanWestendorpChart';
import { GaborGrangerChart } from './components/GaborGrangerChart';
import { EvcUnitEconomics } from './components/EvcUnitEconomics';
import { GbbSeatMatrix } from './components/GbbSeatMatrix';
import { SurveyDataTable } from './components/SurveyDataTable';

export default function App() {
  const initialPreset = DATASET_PRESETS[0];

  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    initialPreset.id
  );
  const [activeSection, setActiveSection] = useState<StudioSection>('overview');
  const [respondents, setRespondents] = useState<SurveyRespondent[]>(
    initialPreset.respondents
  );
  const [evcConfig, setEvcConfig] = useState<EvcConfig>(
    initialPreset.evcConfig
  );
  const [tiers, setTiers] = useState<TierConfig[]>(initialPreset.tiers);
  const [features, setFeatures] = useState<FeatureEntitlement[]>(
    initialPreset.features
  );
  const [elasticityMultiplier, setElasticityMultiplier] = useState<number>(1.0);

  const activePreset =
    DATASET_PRESETS.find((p) => p.id === selectedPresetId) ?? initialPreset;

  const loadPreset = (presetId: string) => {
    const found = DATASET_PRESETS.find((p) => p.id === presetId);
    if (!found) return;
    setSelectedPresetId(found.id);
    setRespondents(found.respondents);
    setEvcConfig(found.evcConfig);
    setTiers(found.tiers);
    setFeatures(found.features);
    setElasticityMultiplier(1.0);
  };

  const handleResetCurrent = () => {
    loadPreset(selectedPresetId);
  };

  const handleExportCsv = () => {
    const csvContent = exportRespondentsToCsv(respondents);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${selectedPresetId}-pricing-survey.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleUpdateTier = (
    tierId: TierConfig['id'],
    patch: Partial<TierConfig>
  ) => {
    setTiers((prev) =>
      prev.map((t) => (t.id === tierId ? { ...t, ...patch } : t))
    );
  };

  const handleToggleFeature = (
    featureId: string,
    tierId: 'starter' | 'growth' | 'enterprise'
  ) => {
    setFeatures((prev) =>
      prev.map((f) => {
        if (f.id !== featureId) return f;
        if (tierId === 'starter') {
          return { ...f, starterIncluded: !f.starterIncluded };
        }
        if (tierId === 'growth') {
          return { ...f, growthIncluded: !f.growthIncluded };
        }
        return { ...f, enterpriseIncluded: !f.enterpriseIncluded };
      })
    );
  };

  const vwMetrics = useMemo(
    () => calculateVanWestendorp(respondents),
    [respondents]
  );

  const ggMetrics = useMemo(
    () =>
      calculateGaborGranger(
        respondents,
        evcConfig.cogsPerSeat,
        elasticityMultiplier
      ),
    [respondents, evcConfig.cogsPerSeat, elasticityMultiplier]
  );

  const evcMetrics = useMemo(
    () => calculateEvcMetrics(evcConfig),
    [evcConfig]
  );

  const portfolioSummary = useMemo(
    () => simulateGbbPortfolio(tiers, features),
    [tiers, features]
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F8FAFC] text-slate-900">
      <Sidebar
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        presetName={activePreset.name}
        respondentCount={respondents.length}
        billingUnit={activePreset.billingUnit}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          activeSection={activeSection}
          presets={DATASET_PRESETS}
          selectedPresetId={selectedPresetId}
          onSelectPreset={loadPreset}
          onResetCurrent={handleResetCurrent}
          onExportCsv={handleExportCsv}
        />

        <main className="flex-1 p-6 max-w-[1440px] w-full mx-auto space-y-6">
          <KpiStrip
            vw={vwMetrics}
            gg={ggMetrics}
            evc={evcMetrics}
            portfolio={portfolioSummary}
          />

          {(activeSection === 'overview' ||
            activeSection === 'van-westendorp' ||
            activeSection === 'gabor-granger') && (
            <div
              className={`grid grid-cols-1 ${
                activeSection === 'overview' ? 'xl:grid-cols-2' : ''
              } gap-6`}
            >
              {(activeSection === 'overview' ||
                activeSection === 'van-westendorp') && (
                <VanWestendorpChart metrics={vwMetrics} />
              )}
              {(activeSection === 'overview' ||
                activeSection === 'gabor-granger') && (
                <GaborGrangerChart
                  metrics={ggMetrics}
                  elasticityMultiplier={elasticityMultiplier}
                  onChangeElasticity={setElasticityMultiplier}
                  cogsPerSeat={evcConfig.cogsPerSeat}
                />
              )}
            </div>
          )}

          {(activeSection === 'overview' ||
            activeSection === 'gbb-matrix') && (
            <GbbSeatMatrix
              tiers={tiers}
              features={features}
              portfolio={portfolioSummary}
              onUpdateTier={handleUpdateTier}
              onToggleFeature={handleToggleFeature}
            />
          )}

          {(activeSection === 'overview' ||
            activeSection === 'evc-economics') && (
            <EvcUnitEconomics
              config={evcConfig}
              metrics={evcMetrics}
              onUpdateConfig={setEvcConfig}
            />
          )}

          {(activeSection === 'overview' ||
            activeSection === 'survey-data') && (
            <SurveyDataTable
              respondents={respondents}
              onUpdateRespondents={setRespondents}
            />
          )}
        </main>
      </div>
    </div>
  );
}
