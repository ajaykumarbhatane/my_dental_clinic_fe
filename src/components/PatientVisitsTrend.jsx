import {
  ResponsiveContainer,
  LineChart,
  Line as RechartsLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from 'recharts';

const PatientVisitsTrend = ({
  chartData,
  loading,
  error,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-lg transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Patient Visits Trend</h3>
          <p className="text-sm text-gray-500">Filter by treatment and date range to compare visit trends.</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-600">{error}</div>
      )}

      <div className="h-72">
        {loading ? (
          <div className="h-full animate-pulse rounded-3xl bg-slate-100" />
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: '#6B7280', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                minTickGap={12}
              />
              <YAxis
                tick={{ fill: '#6B7280', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <RechartsTooltip
                formatter={(value) => `${value} visit${value === 1 ? '' : 's'}`}
                contentStyle={{
                  borderRadius: '1rem',
                  borderColor: '#E5E7EB',
                  backgroundColor: '#fff',
                }}
              />
              <RechartsLine
                type="monotone"
                dataKey="visits"
                stroke="#2563EB"
                strokeWidth={3}
                dot={{ r: 4, fill: '#2563EB', stroke: '#fff', strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-slate-50 p-6 text-center">
            <div className="text-3xl mb-3">📉</div>
            <p className="text-sm font-semibold text-slate-900">No visit data available for selected period</p>
            <p className="mt-2 text-sm text-slate-500">Try another date range or grouping to view visits trends.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientVisitsTrend;
