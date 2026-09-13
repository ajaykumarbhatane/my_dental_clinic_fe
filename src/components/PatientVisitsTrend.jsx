import {
  ResponsiveContainer,
  AreaChart,
  Area,
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
    <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs transition-all h-full flex flex-col justify-between">
      <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">Patient Visits Volume</h3>
          <p className="text-[11px] text-slate-500">Visit trends across selected range</p>
        </div>
        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
          Visits
        </span>
      </div>

      {error && (
        <div className="mb-2 p-2 text-xs rounded-lg bg-rose-50 text-rose-700 border border-rose-200/60">{error}</div>
      )}

      <div className="h-44 sm:h-48 w-full">
        {loading ? (
          <div className="h-full animate-pulse rounded-xl bg-slate-100 flex items-center justify-center text-xs text-slate-400">Loading visit trends...</div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 12, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="visitsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#F1F5F9" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: '#64748B', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                minTickGap={14}
              />
              <YAxis
                tick={{ fill: '#64748B', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                width={36}
              />
              <RechartsTooltip
                formatter={(value) => `${value} visit${value === 1 ? '' : 's'}`}
                contentStyle={{
                  borderRadius: '0.75rem',
                  borderColor: '#E2E8F0',
                  backgroundColor: '#fff',
                  fontSize: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                }}
              />
              <Area
                type="monotone"
                dataKey="visits"
                stroke="#2563EB"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#visitsGradient)"
                dot={{ r: 3, fill: '#2563EB', stroke: '#fff', strokeWidth: 1.5 }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center">
            <p className="text-xs font-semibold text-slate-700">No visit data recorded</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientVisitsTrend;
