import React from 'react';
import { Calendar, Filter } from 'lucide-react';

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
    <div className="rounded-xl sm:rounded-2xl border border-slate-200/90 bg-slate-50/80 p-2.5 sm:p-3.5 shadow-xs transition-all">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        
        {/* Left Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          
          {/* Period Select */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg sm:rounded-xl px-2.5 py-1.5 shadow-2xs flex-1 sm:flex-none min-w-[130px]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">Period:</span>
            <select
              value={period}
              onChange={(e) => onPeriodChange?.(e.target.value)}
              className="w-full bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              {periodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Group Select */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg sm:rounded-xl px-2.5 py-1.5 shadow-2xs flex-1 sm:flex-none min-w-[110px]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">Group:</span>
            <select
              value={group}
              onChange={(e) => onGroupChange?.(e.target.value)}
              className="w-full bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              {groupOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Treatment Select */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg sm:rounded-xl px-2.5 py-1.5 shadow-2xs flex-1 sm:flex-none min-w-[140px]">
            <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <select
              value={selectedTreatment}
              onChange={(e) => onTreatmentChange?.(e.target.value)}
              className="w-full bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer truncate"
            >
              {treatmentOptions.map((option) => (
                <option key={option} value={option}>
                  {option === 'all' ? 'All Treatments' : option}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Custom Date Range Trigger */}
        {period === 'custom_date_range' && (
          <button
            type="button"
            onClick={onOpenDateRange}
            className="flex items-center justify-center gap-1.5 rounded-lg sm:rounded-xl border border-blue-200 bg-blue-50/80 px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-2xs hover:bg-blue-100 transition flex-shrink-0"
          >
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span className="truncate">{customDateRangeLabel || 'Select date range'}</span>
          </button>
        )}

      </div>
    </div>
  );
};

export default AnalyticsFilters;

