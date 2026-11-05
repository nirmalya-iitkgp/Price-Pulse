import React from 'react';
import {
  Activity,
  BarChart3,
  Layers,
  Scale,
  Table2,
  TrendingUp,
} from 'lucide-react';
import { StudioSection } from '../types/pricing';

interface SidebarProps {
  activeSection: StudioSection;
  onSelectSection: (section: StudioSection) => void;
  presetName: string;
  respondentCount: number;
  billingUnit: string;
}

const NAV_ITEMS: Array<{
  id: StudioSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'overview', label: 'Studio Overview', icon: Activity },
  { id: 'van-westendorp', label: 'Van Westendorp PSM', icon: TrendingUp },
  { id: 'gabor-granger', label: 'Gabor-Granger Curve', icon: BarChart3 },
  { id: 'gbb-matrix', label: 'GBB Seat Matrix', icon: Layers },
  { id: 'evc-economics', label: 'EVC & Unit Economics', icon: Scale },
  { id: 'survey-data', label: 'Survey Data Table', icon: Table2 },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelectSection,
  presetName,
  respondentCount,
  billingUnit,
}) => {
  return (
    <aside className="w-full lg:w-60 shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col justify-between">
      <div>
        <div className="h-16 px-6 flex items-center border-b border-slate-200">
          <a
            href="#overview"
            onClick={(e) => {
              e.preventDefault();
              onSelectSection('overview');
            }}
            className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            PricePulse Studio
          </a>
        </div>

        <nav className="p-3 flex lg:flex-col gap-1 overflow-x-auto" aria-label="Studio sections">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectSection(item.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 text-left ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-indigo-600' : 'text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="hidden lg:block p-4 border-t border-slate-200">
        <p className="text-xs font-medium text-slate-500">Active Cohort</p>
        <p className="mt-1 text-sm font-semibold text-slate-900 truncate">
          {presetName}
        </p>
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500 font-mono-tabular">
          <span>n = {respondentCount}</span>
          <span aria-hidden="true">·</span>
          <span className="truncate">{billingUnit}</span>
        </div>
      </div>
    </aside>
  );
};
