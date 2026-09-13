import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { TrendingUp, DollarSign, Calendar, Sparkles, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const formatAmount = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xl text-xs space-y-1.5 min-w-[140px]">
        <p className="font-bold text-slate-800 border-b border-slate-100 pb-1">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-slate-500 font-medium">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}:
            </span>
            <span className="font-bold text-slate-900">{formatAmount(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const RevenueTrend = ({ data = [], summary = {}, loading = false, error = null }) => {
  const totalRev = summary.total_revenue ?? 0;
  const prevTotalRev = summary.previous_total_revenue ?? 0;
  const todayRev = summary.today_revenue ?? 0;
  const avgRev = summary.average_revenue ?? 0;
  const prevAvgRev = summary.previous_average_revenue ?? 0;
  const highestRev = summary.highest_revenue ?? 0;
  const prevHighestRev = summary.previous_highest_revenue ?? 0;

  // Calculate percentage difference for Total Revenue
  const totalDiff = prevTotalRev > 0 ? ((totalRev - prevTotalRev) / prevTotalRev) * 100 : null;
  const totalDiffAbs = totalRev - prevTotalRev;

  // Calculate dynamic insight text based on real data
  let insightText = null;
  if (totalRev > 0 && prevTotalRev > 0) {
    if (totalDiffAbs > 0) {
      insightText = `Revenue increased by ${formatAmount(totalDiffAbs)} (${Math.abs(totalDiff).toFixed(1)}%) compared to the previous period.`;
    } else if (totalDiffAbs < 0) {
      insightText = `Revenue decreased by ${formatAmount(Math.abs(totalDiffAbs))} (${Math.abs(totalDiff).toFixed(1)}%) compared to the previous period.`;
    } else {
      insightText = `Revenue remained stable compared to the previous period (${formatAmount(totalRev)}).`;
    }
  } else if (totalRev > 0 && prevTotalRev === 0) {
    insightText = `Total revenue of ${formatAmount(totalRev)} logged for this period with peak day reaching ${formatAmount(highestRev)}.`;
  } else if (highestRev > 0) {
    insightText = `Highest single interval collection recorded at ${formatAmount(highestRev)}.`;
  } else {
    insightText = `No collection logged for the selected filter period yet.`;
  }

  const kpis = [
    {
      label: 'TOTAL REVENUE',
      value: formatAmount(totalRev),
      icon: DollarSign,
      iconBg: 'bg-emerald-500/10 text-emerald-600',
      badge: totalDiff != null ? (
        <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${totalDiff >= 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-rose-50 text-rose-700 border border-rose-200/60'}`}>
          {totalDiff >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(totalDiff).toFixed(1)}%
        </span>
      ) : null,
      prevAmount: `Prev: ${formatAmount(prevTotalRev)}`,
    },
    {
      label: "TODAY'S REVENUE",
      value: formatAmount(todayRev),
      icon: TrendingUp,
      iconBg: 'bg-blue-500/10 text-blue-600',
      badge: (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Real-time Daily
        </span>
      ),
      prevAmount: summary.previous_today_revenue != null ? `Prev: ${formatAmount(summary.previous_today_revenue)}` : null,
    },
    {
      label: 'AVG DAILY REVENUE',
      value: formatAmount(avgRev),
      icon: Calendar,
      iconBg: 'bg-amber-500/10 text-amber-600',
      badge: null,
      prevAmount: `Prev avg: ${formatAmount(prevAvgRev)}`,
    },
    {
      label: 'HIGHEST SINGLE DAY',
      value: formatAmount(highestRev),
      icon: Sparkles,
      iconBg: 'bg-purple-500/10 text-purple-600',
      badge: null,
      prevAmount: prevHighestRev > 0 ? `Prev peak: ${formatAmount(prevHighestRev)}` : 'Peak Collection',
    },
  ];

  return (
    <div className="space-y-4">
      {/* 4 Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {kpis.map((kpi, idx) => {
          const IconComp = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-white border border-slate-200/90 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider text-slate-500 uppercase truncate">
                  {kpi.label}
                </span>
                <div className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl ${kpi.iconBg} flex-shrink-0`}>
                  <IconComp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>

              <div>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
                  {kpi.value}
                </p>
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-[11px]">
                  {kpi.badge}
                  {kpi.prevAmount && (
                    <span className="text-slate-500 font-medium truncate">
                      {kpi.prevAmount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Revenue Trend Chart Card */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs transition-all">
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">Revenue Trend</h3>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                Financial Analytics
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Comparing current period collections vs previous period</p>
          </div>

          {/* Custom Chart Legend */}
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200/70 rounded-lg px-3 py-1.5 self-start sm:self-auto">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Current
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-indigo-500 rounded-full" />
              Previous
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-3 p-3 text-xs rounded-xl bg-rose-50 text-rose-700 border border-rose-200/80">
            {error}
          </div>
        )}

        {/* Chart Viewport */}
        <div className="h-56 sm:h-64 md:h-72 w-full">
          {loading ? (
            <div className="h-full animate-pulse rounded-xl bg-slate-100 flex items-center justify-center text-xs text-slate-400">
              Loading financial trends...
            </div>
          ) : data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 12, right: 12, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueCurrentGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="revenuePreviousGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#F1F5F9" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#64748B', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={16}
                />
                <YAxis
                  tickFormatter={(val) => {
                    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
                    return `₹${val}`;
                  }}
                  tick={{ fill: '#64748B', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={46}
                />
                <RechartsTooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="previous_revenue"
                  name="Previous"
                  stroke="#6366F1"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#revenuePreviousGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Current"
                  stroke="#10B981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#revenueCurrentGradient)"
                  dot={{ r: 3.5, fill: '#10B981', stroke: '#fff', strokeWidth: 2 }}
                  activeDot={{ r: 5.5, fill: '#10B981', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
              <span className="text-2xl mb-1.5">📈</span>
              <p className="text-xs font-semibold text-slate-800">No collection data for this filter selection</p>
              <p className="mt-1 text-[11px] text-slate-500">Try adjusting the period, grouping, or treatment filters above.</p>
            </div>
          )}
        </div>

        {/* Dynamic Revenue Insight Banner */}
        {insightText && !loading && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-700 bg-slate-50/80 px-3.5 py-2.5 rounded-xl border border-slate-200/80">
            <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold text-slate-900">Revenue Insight:</span>
            <span className="text-slate-600 truncate">{insightText}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default RevenueTrend;

