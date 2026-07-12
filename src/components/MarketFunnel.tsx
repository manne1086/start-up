import { memo, useState } from 'react';
import { Filter } from 'lucide-react';

type FunnelLevel = { name: 'TAM' | 'SAM' | 'SOM'; value: number; description: string };

function funnelPath(width: number, index: number, y: number, isHovered: boolean) {
  // Slightly adjust width based on hover state for a subtle expansion effect
  const hoverScale = isHovered ? 1.05 : 1;
  const top = (84 - index * 12) * hoverScale;
  const bottom = (60 - index * 10) * hoverScale;
  const height = 76;
  
  return `M${(width - top) / 2},${y} L${(width + top) / 2},${y} L${(width + bottom) / 2},${y + height} L${(width - bottom) / 2},${y + height} Z`;
}

export default memo(function MarketFunnel({ levels, currency }: { levels: FunnelLevel[]; currency: string }) {
  const width = 560;
  const height = 340;
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const colors = [
    { fill: 'url(#gradient-tam)', stroke: '#6C47FF', text: '#C9BEFF' },
    { fill: 'url(#gradient-sam)', stroke: '#00D4AA', text: '#7CFFD4' },
    { fill: 'url(#gradient-som)', stroke: '#F0F0F0', text: '#FFFFFF' }
  ];

  return (
    <div className="rounded-[24px] border border-white/10 bg-[#111118] p-8 shadow-2xl relative overflow-hidden group">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#6C47FF]/5 rounded-full blur-3xl pointer-events-none transition-opacity duration-500 opacity-50 group-hover:opacity-100"></div>
      <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-[#00D4AA]/5 rounded-full blur-3xl pointer-events-none transition-opacity duration-500 opacity-50 group-hover:opacity-100"></div>

      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
            <Filter className="w-5 h-5 text-[#888899]" />
          </div>
          <div>
            <div className="text-lg font-black text-white tracking-tight">Market Funnel</div>
            <div className="text-xs font-bold text-[#888899] uppercase tracking-widest">{currency}</div>
          </div>
        </div>
        <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-[#888899] uppercase tracking-[0.2em]">
          Interactive SVG
        </div>
      </div>

      <div className="relative z-10 w-full h-[320px] flex justify-center items-center">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id="gradient-tam" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(108,71,255,0.2)" />
              <stop offset="100%" stopColor="rgba(108,71,255,0.05)" />
            </linearGradient>
            <linearGradient id="gradient-sam" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(0,212,170,0.2)" />
              <stop offset="100%" stopColor="rgba(0,212,170,0.05)" />
            </linearGradient>
            <linearGradient id="gradient-som" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
            </linearGradient>
            
            {/* Glowing filters */}
            <filter id="glow-tam" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-sam" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Center dashed guideline */}
          <line x1={width/2} y1={20} x2={width/2} y2={height - 20} stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 4" />

          {levels.map((level, index) => {
            const y = 30 + index * 90;
            const isHovered = hoveredIndex === index;
            const color = colors[index % colors.length];
            
            return (
              <g 
                key={level.name}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer transition-all duration-300 ease-in-out"
                style={{ 
                  transform: isHovered ? `scale(1.02) translateY(-2px)` : 'scale(1)',
                  transformOrigin: `${width/2}px ${y + 38}px`
                }}
              >
                <path 
                  d={funnelPath(width, index, y, isHovered)} 
                  fill={color.fill} 
                  stroke={color.stroke} 
                  strokeWidth={isHovered ? "3" : "2"} 
                  strokeLinejoin="round" 
                  filter={isHovered ? `url(#glow-${level.name.toLowerCase()})` : undefined}
                  className="animate-fadeInUp"
                  style={{ transition: 'all 0.3s ease', animationDelay: `${index * 150}ms` }}
                />
                
                <text 
                  x={width / 2} 
                  y={y + 32} 
                  fill={color.text} 
                  fontSize="18" 
                  fontWeight="900" 
                  textAnchor="middle"
                  className="animate-fadeInDown tracking-widest"
                  style={{ animationDelay: `${index * 150 + 100}ms` }}
                >
                  {level.name}
                </text>
                
                <text 
                  x={width / 2} 
                  y={y + 54} 
                  fill={color.stroke} 
                  fontSize="16" 
                  fontWeight="800" 
                  textAnchor="middle"
                  className="animate-fadeInUp"
                  style={{ animationDelay: `${index * 150 + 200}ms` }}
                >
                  {level.value.toLocaleString()}
                </text>
                
                <text 
                  x={width / 2} 
                  y={y + 72} 
                  fill={isHovered ? "#FFFFFF" : "#888899"} 
                  fontSize="11" 
                  fontWeight="600"
                  textAnchor="middle"
                  style={{ transition: 'all 0.3s ease' }}
                  className="animate-fadeInUp"
                >
                  {level.description}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
});
