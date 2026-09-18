/**
 * Project roadmap rendered as SVG, styled after the classic "Project Roadmap"
 * slide template: a winding road with numbered milestone pins.
 *
 * Unlike a generated image, every label here is real text drawn from the
 * agent's roadmap phases — correct spelling, correct order, correct count.
 */

type Phase = {
  phase?: number;
  title?: string;
  weeks?: string;
  tasks?: string[];
};

interface Props {
  phases: Phase[];
  className?: string;
}

// Milestone palette, matching the reference template's bright accents.
const COLORS = ['#00C2A8', '#7C4DFF', '#FFA726', '#FF6B6B', '#42A5F5', '#26C6DA'];

const W = 1280;
const H = 620;

/** Cubic path for the winding road, low-left sweeping to upper-right. */
const ROAD_D = `M -40 ${H - 40} C 220 ${H - 60}, 300 ${H - 250}, 560 ${H - 260}
                S 900 ${H - 300}, 1010 ${H - 430} S 1140 ${H - 520}, ${W + 40} ${H - 520}`;

/** Evenly spaced points along the road, computed from the real path geometry. */
function useMilestonePoints(count: number): Array<{ x: number; y: number }> {
  if (count === 0) return [];
  if (typeof document === 'undefined') return [];

  const svgNs = 'http://www.w3.org/2000/svg';
  const path = document.createElementNS(svgNs, 'path');
  path.setAttribute('d', ROAD_D);
  const total = path.getTotalLength();

  // Inset from both ends so pins don't sit on the frame edge.
  const start = total * 0.12;
  const span = total * 0.76;

  return Array.from({ length: count }, (_, i) => {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const p = path.getPointAtLength(start + span * t);
    return { x: p.x, y: p.y };
  });
}

export default function RoadmapDiagram({ phases, className }: Props) {
  const items = phases.filter((p) => p?.title).slice(0, 6);
  const points = useMilestonePoints(items.length);

  if (items.length === 0) {
    return (
      <div className={`rounded-2xl border border-white/[0.06] bg-[#0A0A0F] p-10 text-center ${className ?? ''}`}>
        <span className="text-sm text-[#555566]">No roadmap phases available yet.</span>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-white/[0.06] bg-[#0A0A0F] overflow-hidden ${className ?? ''}`}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img"
           aria-label="Project roadmap showing development phases">
        <defs>
          <linearGradient id="roadFill" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#1E3A4C" />
            <stop offset="100%" stopColor="#2E5A6E" />
          </linearGradient>
        </defs>

        {/* Road: solid body, coloured edge, dashed centre line */}
        <path d={ROAD_D} fill="none" stroke="url(#roadFill)" strokeWidth={78} strokeLinecap="round" />
        <path d={ROAD_D} fill="none" stroke="#FF6B6B" strokeWidth={78} strokeLinecap="round"
              opacity={0.28} transform="translate(0, 26)" />
        <path d={ROAD_D} fill="none" stroke="#FFFFFF" strokeWidth={3}
              strokeLinecap="round" strokeDasharray="18 22" opacity={0.75} />

        {items.map((item, i) => {
          const pt = points[i];
          if (!pt) return null;
          const color = COLORS[i % COLORS.length];
          const above = i % 2 === 0;             // alternate to avoid collisions
          const stemLen = above ? -104 : 96;
          const pinY = pt.y + stemLen;

          // Text flows downward from labelY, so the whole block must be lifted
          // clear of the pin when it sits above — otherwise the three lines
          // render on top of the circle.
          const PIN_R = 26;
          const GAP = 14;
          const BLOCK_H = 44;                    // title + weeks + tasks offsets
          const labelY = above
            ? pinY - PIN_R - GAP - BLOCK_H
            : pinY + PIN_R + GAP + 8;
          const anchor: 'start' | 'middle' | 'end' =
            pt.x < 180 ? 'start' : pt.x > W - 180 ? 'end' : 'middle';

          return (
            <g key={i}>
              {/* stem from road to pin */}
              <line x1={pt.x} y1={pt.y} x2={pt.x} y2={pinY}
                    stroke={color} strokeWidth={3} opacity={0.85} />

              {/* pin */}
              <circle cx={pt.x} cy={pinY} r={PIN_R} fill={color} />
              <circle cx={pt.x} cy={pinY} r={19} fill="#0A0A0F" />
              <text x={pt.x} y={pinY + 6} textAnchor="middle"
                    fontSize={17} fontWeight={800} fill={color}
                    fontFamily="Inter, system-ui, sans-serif">
                {String(item.phase ?? i + 1).padStart(2, '0')}
              </text>

              {/* label — real text, correct order */}
              <text x={pt.x} y={labelY} textAnchor={anchor}
                    fontSize={19} fontWeight={700} fill="#F0F0F0"
                    fontFamily="Inter, system-ui, sans-serif">
                {item.title}
              </text>
              {item.weeks && (
                <text x={pt.x} y={labelY + 22} textAnchor={anchor}
                      fontSize={14} fontWeight={600} fill={color}
                      fontFamily="Inter, system-ui, sans-serif">
                  {item.weeks}
                </text>
              )}
              {item.tasks && item.tasks.length > 0 && (
                <text x={pt.x} y={labelY + 44} textAnchor={anchor}
                      fontSize={13} fill="#888899"
                      fontFamily="Inter, system-ui, sans-serif">
                  {item.tasks.slice(0, 2).join(' · ')}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
