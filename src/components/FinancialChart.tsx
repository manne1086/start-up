import { memo } from 'react';
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default memo(function FinancialChart({
  years,
  series,
}: {
  years: number[];
  series: Array<{ name: string; values: number[] }>;
}) {
  const data = years.map((year, index) => ({
    year: `Year ${year}`,
    revenue: series[0]?.values[index] ?? 0,
    ebitda: series[1]?.values[index] ?? 0,
    fcf: series[2]?.values[index] ?? 0,
  }));

  return (
    <div className="rounded-3xl border border-[#29263E] bg-gradient-to-br from-[#12111D] to-[#0B0B12] p-5 chart-surface">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-black text-white"><span className="chart-pulse" />Financial Projection</div>
          <div className="text-xs text-[#888899]">Five-year sketch chart</div>
        </div>
        <div className="text-[10px] uppercase tracking-[0.35em] text-[#888899]">Recharts + Rough</div>
      </div>
      <div className="h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 14, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="#2A2A35" vertical={false} />
            <XAxis dataKey="year" stroke="#888899" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#888899" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${Math.round(Number(value) / 1000)}K`} />
            <Tooltip contentStyle={{ backgroundColor: '#0A0A0F', borderColor: '#6C47FF', color: '#fff' }} />
            <Legend wrapperStyle={{ fontSize: 12, color: '#888899' }} />
            <Area isAnimationActive animationDuration={1300} type="monotone" dataKey="revenue" name="Revenue" stroke="#8B6CFF" fill="rgba(108,71,255,0.16)" strokeWidth={3} activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }} />
            <Area isAnimationActive animationDuration={1500} animationBegin={180} type="monotone" dataKey="ebitda" name="EBITDA" stroke="#00D4AA" fill="rgba(0,212,170,0.12)" strokeWidth={3} activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }} />
            <Area isAnimationActive animationDuration={1700} animationBegin={320} type="monotone" dataKey="fcf" name="Free Cash Flow" stroke="#4DA3FF" fill="rgba(77,163,255,0.10)" strokeWidth={2} activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});
