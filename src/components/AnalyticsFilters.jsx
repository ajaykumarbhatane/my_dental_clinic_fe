import React from 'react';

const periodOptions = [
  { value: 'last_7_days', label: 'Last 7 Days' },
  { value: 'current_month', label: 'Current Month' },
  { value: 'year_to_date', label: 'Year To Date' },
  { value: 'custom_date_range', label: 'Custom Date Range' },
];

const groupOptions = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const AnalyticsFilters = ({
  period,
  group,
  selectedTreatment,
  treatmentOptions = [],
  onPeriodChange,
  onGroupChange,
  onTreatmentChange,
  onOpenDateRange,
  customDateRangeLabel,
}) => {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid w-full gap-3 sm:grid-cols-3 lg:w-auto">
          <div className="min-w-[160px]">
            <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 mb-2">
              Period
            </label>
            <select
              value={period}
              onChange={(e) => onPeriodChange?.(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              {periodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-[160px]">
            <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 mb-2">
              Group
            </label>
            <div className="inline-flex w-full overflow-hidden rounded-2xl border border-slate-300 bg-slate-50">
              {groupOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onGroupChange?.(option.value)}
                  className={`flex-1 px-3 py-2 text-sm font-medium transition ${
                    group === option.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="min-w-[160px]">
            <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 mb-2">
              Treatments
            </label>
            <select
              value={selectedTreatment}
              onChange={(e) => onTreatmentChange?.(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              {treatmentOptions.map((option) => (
                <option key={option} value={option}>
                  {option === 'all' ? 'All Treatments' : option}
                </option>
              ))}
            </select>
          </div>
        </div>

        {period === 'custom_date_range' && (
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={onOpenDateRange}
              className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-200 transition"
            >
              {customDateRangeLabel || 'Select date range'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsFilters;
