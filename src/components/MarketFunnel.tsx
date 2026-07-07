import { memo } from 'react';

type FunnelLevel = { name: 'TAM' | 'SAM' | 'SOM'; value: number; description: string };

function funnelPath(width: number, index: number, y: number) {
  const top = 84 - index * 10;
  const bottom = 52 - index * 8;
  return `M${(width - top) / 2},${y} L${(width + top) / 2},${y} L${(width + bottom) / 2},${y + 76} L${(width - bottom) / 2},${y + 76} Z`;
}

export default memo(function MarketFunnel({ levels, currency }: { levels: FunnelLevel[]; currency: string }) {
  const width = 560;
  const height = 300;

  return (
    <div className="rounded-3xl border border-[#23232D] bg-[#0D0D14] p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-black text-white">Market Funnel</div>
          <div className="text-xs text-[#888899]">{currency}</div>
        </div>
        <div className="text-[10px] uppercase tracking-[0.35em] text-[#888899]">Sketch Funnel</div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[300px]">
        {levels.map((level, index) => {
          const y = 24 + index * 86;
          return (
            <g key={level.name}>
              <path d={funnelPath(width, index, y)} fill="rgba(108,71,255,0.12)" stroke="#6C47FF" strokeWidth="2" strokeLinejoin="round" />
              <text x={width / 2} y={y + 30} fill="#F0F0F0" fontSize="16" fontWeight="700" textAnchor="middle">
                {level.name}
              </text>
              <text x={width / 2} y={y + 52} fill="#00D4AA" fontSize="14" fontWeight="800" textAnchor="middle">
                {level.value.toLocaleString()}
              </text>
              <text x={width / 2} y={y + 68} fill="#888899" fontSize="10" textAnchor="middle">
                {level.description}
              </text>
            </g>
          );
        })}
        <line x1={280} y1={28} x2={280} y2={286} stroke="rgba(255,255,255,0.08)" strokeDasharray="6 6" />
      </svg>
    </div>
  );
});
