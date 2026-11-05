import React from 'react';
import { Download, RotateCcw } from 'lucide-react';
import { DatasetPreset, StudioSection } from '../types/pricing';

interface TopBarProps {
  activeSection: StudioSection;
  presets: DatasetPreset[];
  selectedPresetId: string;
  onSelectPreset: (presetId: string) => void;
  onResetCurrent: () => void;
  onExportCsv: () => void;
}

const SECTION_TITLES: Record<StudioSection, string> = {
  overview: 'Executive Pricing Sandbox',
  'van-westendorp': 'Van Westendorp Price Sensitivity Meter',
  'gabor-granger': 'Gabor-Granger Demand & Margin Frontier',
  'gbb-matrix': 'Good-Better-Best Seat Matrix',
  'evc-economics': 'Economic Value to the Customer & Unit Economics',
  'survey-data': 'Respondent Willingness-to-Pay Ledger',
};

export const TopBar: React.FC<TopBarProps> = ({
  activeSection,
  presets,
  selectedPresetId,
  onSelectPreset,
  onResetCurrent,
  onExportCsv,
}) => {
  return (
    <header className="h-16 px-6 bg-white border-b border-slate-200 flex items-center justify-between gap-6">
      <div className="flex items-center gap-2 text-sm min-w-0">
        <span className="text-slate-400 whitespace-nowrap shrink-0">
          Pricing Models
        </span>
        <span className="text-slate-300" aria-hidden="true">
          /
        </span>
        <h1 className="font-display font-semibold text-slate-900 truncate">
          {SECTION_TITLES[activeSection]}
        </h1>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <label htmlFor="preset-select" className="sr-only">
          Select industry dataset preset
        </label>
        <select
          id="preset-select"
          value={selectedPresetId}
          onChange={(e) => onSelectPreset(e.target.value)}
          className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
        >
          {presets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={onResetCurrent}
          title="Reset current preset to defaults"
          className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>Reset</span>
        </button>

        <button
          type="button"
          onClick={onExportCsv}
          className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
      </div>
    </header>
  );
};
