import React, { useRef, useState } from 'react';
import { Plus, Trash2, Upload } from 'lucide-react';
import { SurveyRespondent } from '../types/pricing';
import { clampPrice, parseSurveyCsv, sanitizeTextLabel } from '../engine/security';

interface SurveyDataTableProps {
  respondents: SurveyRespondent[];
  onUpdateRespondents: (next: SurveyRespondent[]) => void;
}

export const SurveyDataTable: React.FC<SurveyDataTableProps> = ({
  respondents,
  onUpdateRespondents,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'info' | 'error';
    message: string;
  } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      const result = parseSurveyCsv(text);
      if (result.error) {
        setUploadStatus({ type: 'error', message: result.error });
      } else {
        onUpdateRespondents(result.respondents);
        const warnNote =
          result.warnings.length > 0
            ? ` (${result.warnings.length} rows normalized for safety/monotonicity)`
            : '';
        setUploadStatus({
          type: 'info',
          message: `Loaded ${result.respondents.length} sanitized respondent rows${warnNote}.`,
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCellChange = (
    id: string,
    field: keyof Omit<SurveyRespondent, 'id'>,
    rawValue: string
  ) => {
    onUpdateRespondents(
      respondents.map((r) => {
        if (r.id !== id) return r;
        if (field === 'segment') {
          return { ...r, segment: sanitizeTextLabel(rawValue, 'Segment') };
        }
        return { ...r, [field]: clampPrice(Number(rawValue), 0, 100000) };
      })
    );
  };

  const handleAddRow = () => {
    const nextIdx = respondents.length + 1;
    onUpdateRespondents([
      ...respondents,
      {
        id: `r-${Date.now()}`,
        segment: 'Mid-Market',
        tooCheap: 25,
        bargain: 45,
        expensive: 85,
        tooExpensive: 120,
        maxWillingnessToPay: 70,
      },
    ]);
    setUploadStatus({
      type: 'info',
      message: `Added respondent row #${nextIdx}.`,
    });
  };

  const handleDeleteRow = (id: string) => {
    onUpdateRespondents(respondents.filter((r) => r.id !== id));
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-base font-semibold text-slate-900">
            Respondent Willingness-to-Pay Survey Ledger
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Edit thresholds inline or upload a CSV (columns: segment, tooCheap, bargain, expensive, tooExpensive, maxWtp)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Upload CSV</span>
          </button>

          <button
            type="button"
            onClick={handleAddRow}
            className="px-3.5 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Respondent</span>
          </button>
        </div>
      </div>

      {uploadStatus && (
        <div
          className={`mt-4 px-3.5 py-2.5 rounded-lg text-xs border ${
            uploadStatus.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-indigo-50 border-indigo-200 text-indigo-800'
          }`}
        >
          {uploadStatus.message}
        </div>
      )}

      <div className="mt-4 overflow-x-auto max-h-96 overflow-y-auto border border-slate-200 rounded-lg">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-xs font-semibold text-slate-500">
            <tr>
              <th className="py-2.5 px-3">Segment</th>
              <th className="py-2.5 px-3 text-right">Too Cheap ($)</th>
              <th className="py-2.5 px-3 text-right">Bargain ($)</th>
              <th className="py-2.5 px-3 text-right">Expensive ($)</th>
              <th className="py-2.5 px-3 text-right">Too Expensive ($)</th>
              <th className="py-2.5 px-3 text-right">Max WTP ($)</th>
              <th className="py-2.5 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {respondents.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/70">
                <td className="py-1.5 px-3">
                  <input
                    type="text"
                    value={r.segment}
                    onChange={(e) =>
                      handleCellChange(r.id, 'segment', e.target.value)
                    }
                    aria-label={`Segment for ${r.id}`}
                    className="w-full min-w-28 px-2 py-1 text-xs text-slate-800 bg-transparent border border-transparent hover:border-slate-200 focus:bg-white focus:border-indigo-600 rounded focus:outline-none"
                  />
                </td>
                {(
                  [
                    'tooCheap',
                    'bargain',
                    'expensive',
                    'tooExpensive',
                    'maxWillingnessToPay',
                  ] as const
                ).map((field) => (
                  <td key={field} className="py-1.5 px-3 text-right">
                    <input
                      type="number"
                      min={0}
                      max={100000}
                      value={r[field]}
                      onChange={(e) =>
                        handleCellChange(r.id, field, e.target.value)
                      }
                      aria-label={`${field} for ${r.id}`}
                      className="w-20 px-2 py-1 text-right font-mono-tabular text-slate-900 bg-transparent border border-transparent hover:border-slate-200 focus:bg-white focus:border-indigo-600 rounded focus:outline-none"
                    />
                  </td>
                ))}
                <td className="py-1.5 px-3 text-center">
                  <button
                    type="button"
                    onClick={() => handleDeleteRow(r.id)}
                    title="Delete respondent"
                    aria-label={`Delete ${r.segment}`}
                    className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
