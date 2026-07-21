import {
  ResponsiveContainer,
  LineChart,
  Line as RechartsLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
} from 'recharts';

const formatAmount = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount || 0);
};

const RevenueTrend = ({ data, summary, loading, error }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-lg transition-shadow">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Revenue Trend</h3>
          <p className="text-sm text-gray-500">Track clinic revenue across selected period.</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-600">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        {[
          { label: "Today's Revenue", value: summary.today_revenue, comparison: null },
          { label: 'Total Revenue', value: summary.total_revenue, comparison: summary.previous_total_revenue },
          { label: 'Average Revenue', value: summary.average_revenue, comparison: summary.previous_average_revenue },
          { label: 'Highest Revenue', value: summary.highest_revenue, comparison: summary.previous_highest_revenue },
        ].map((stat) => {
          const diff = stat.comparison != null ? stat.value - stat.comparison : null;
          const diffLabel = diff != null ? `${diff >= 0 ? '+' : '-'}${formatAmount(Math.abs(diff))}` : null;
          const diffColor = diff != null ? (diff >= 0 ? 'text-emerald-700 bg-emerald-100' : 'text-rose-700 bg-rose-100') : '';

          return (
            <div key={stat.label} className="rounded-[24px] border border-gray-200 bg-slate-50 p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">{stat.label}</p>
                {diffLabel && (
                  <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${diffColor}`}>
                    {diffLabel}
                  </span>
                )}
              </div>
              <p className="mt-3 text-2xl font-semibold text-slate-900">{formatAmount(stat.value)}</p>
              {stat.comparison != null && (
                <p className="mt-2 text-xs text-slate-500">Previous: {formatAmount(stat.comparison)}</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="h-72">
        {loading ? (
          <div className="h-full animate-pulse rounded-3xl bg-slate-100" />
        ) : data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
  data={data}
  margin={{
    top: 10,
    right: 10,
    left: -50,
    bottom: 0,
  }}
>
              <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: '#6B7280', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                minTickGap={12}
              />
              <YAxis
                tickFormatter={(value) => {
    if (value >= 1000) {
        return `₹${(value / 1000).toFixed(0)}k`;
    }
    return `₹${value}`;
}}
                tick={{ fill: '#6B7280', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={90}
              />
              <RechartsLegend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: 16 }} />
              <RechartsTooltip
                formatter={(value) => formatAmount(value)}
                contentStyle={{
                  borderRadius: '1rem',
                  borderColor: '#E5E7EB',
                  backgroundColor: '#fff',
                }}
              />
              <RechartsLine
                type="monotone"
                dataKey="previous_revenue"
                name="Previous"
                stroke="#6366F1"
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 5"
              />
              <RechartsLine
                type="monotone"
                dataKey="revenue"
                name="Current"
                stroke="#10B981"
                strokeWidth={3}
                dot={{ r: 4, fill: '#10B981', stroke: '#fff', strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-slate-50 p-6 text-center">
            <div className="text-3xl mb-3">📉</div>
            <p className="text-sm font-semibold text-slate-900">No revenue data available for selected period</p>
            <p className="mt-2 text-sm text-slate-500">Try another date range or grouping to view revenue trends.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RevenueTrend;
