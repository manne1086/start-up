import {
  Download,
  Share2,
  FileText,
  PieChart,
  Scale,
  Presentation,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Mail,
  FileArchive,
  Link as LinkIcon,
  Globe,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import GlobalNavbar from './GlobalNavbar';
import { useGeneration } from '../generation';
import { useRouter } from '../router';

const fallbackData = [
  { year: 'Yr 1', revenue: 48, gp: 35 },
  { year: 'Yr 2', revenue: 120, gp: 95 },
  { year: 'Yr 3', revenue: 350, gp: 290 },
  { year: 'Yr 4', revenue: 680, gp: 580 },
  { year: 'Yr 5', revenue: 920, gp: 800 },
];

export default function ResultsDashboard() {
  const { navigate } = useRouter();
  const { backendState } = useGeneration();

  const ideaName = backendState?.startup_name || backendState?.idea?.toString()?.slice(0, 32) || 'VentureForge Startup';
  const market = backendState?.market as Record<string, unknown> | null | undefined;
  const financials = backendState?.financials as { projections?: Array<Record<string, unknown>>; npv?: number; irr?: number; payback_months?: number } | null | undefined;
  const legal = backendState?.legal as Record<string, unknown> | null | undefined;
  const pitchDeck = backendState?.pitch_deck as { slides?: Array<Record<string, unknown>>; brand?: { tagline?: string } } | null | undefined;
  const mvp = backendState?.mvp as { recommended_stack?: Array<Record<string, unknown>>; estimated_weeks?: number; team_size?: number; estimated_cost_inr?: string } | null | undefined;
  const pivots = backendState?.pivots ?? [];

  const chartData = financials?.projections?.length
    ? financials.projections.map((row) => ({
        year: `Yr ${row.year ?? ''}`,
        revenue: Number(row.revenue ?? 0) / 100000,
        gp: Number(row.gross_profit ?? row.gp ?? 0) / 100000,
      }))
    : fallbackData;

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F0F0F0] flex flex-col font-sans pb-12">
      <GlobalNavbar />

      <div className="w-full bg-[#111118] border-b border-[#111118] py-2 px-6 flex items-center gap-6 overflow-x-auto custom-scrollbar shrink-0">
        {[
          ['Market Research', market],
          ['Financial Model', financials],
          ['Legal', legal],
          ['Pitch Deck', pitchDeck],
          ['MVP', mvp],
          ['Pivots', pivots.length ? pivots : null],
        ].map(([label, value]) => (
          <div key={String(label)} className="flex items-center gap-2 shrink-0">
            <CheckCircle2 className={`w-4 h-4 ${value ? 'text-[#00D4AA]' : 'text-[#888899]'}`} />
            <span className="text-xs text-[#888899]">{label}</span>
          </div>
        ))}
      </div>

      <main className="w-full max-w-[1600px] mx-auto px-6 py-8 flex flex-col flex-1">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-2 border-[#00D4AA] bg-[#00D4AA]/10 p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="text-[#00D4AA] w-6 h-6" />
            <h2 className="text-xl font-black tracking-tight text-white uppercase">
              {ideaName} - Startup Package Complete
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-5 py-2.5 bg-transparent border-2 border-white/20 text-white font-bold text-sm hover:border-white transition-colors flex items-center gap-2">
              <Share2 className="w-4 h-4" /> Share Link
            </button>
            <button className="px-5 py-2.5 bg-[#6C47FF] border-2 border-[#6C47FF] text-white font-bold text-sm hover:bg-[#111118] hover:text-[#6C47FF] hover:shadow-[4px_4px_0px_#00D4AA] transition-all flex items-center gap-2">
              <Download className="w-4 h-4" /> Download All (.zip)
            </button>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-6 items-start">
          <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="border-2 border-[#111118] bg-[#111118] p-6 hover:border-[#6C47FF] hover:shadow-[4px_4px_0px_#6C47FF] transition-all flex flex-col relative group cursor-pointer" onClick={() => navigate('market')}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#888899]" />
                  <h3 className="text-sm font-bold text-[#F0F0F0]">Market Research</h3>
                </div>
                <button className="text-xs font-bold text-[#6C47FF] group-hover:text-[#00D4AA] flex items-center gap-1 transition-colors">
                  View Full <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="mb-6">
                <div className="text-4xl font-black text-[#00D4AA] tracking-tight mb-1">
                  {market?.tam?.toString() ?? 'TAM pending'}
                </div>
                <div className="text-sm font-medium text-[#888899]">
                  {market?.tam_source?.toString() ?? 'Backend market intelligence'}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-auto">
                {Array.isArray(market?.competitors)
                  ? (market?.competitors as Array<Record<string, unknown>>).slice(0, 3).map((comp, i) => (
                      <span key={i} className="px-2 py-1 bg-[#0A0A0F] border border-[#6C47FF]/30 text-[#888899] text-xs font-medium">
                        {comp.name?.toString() ?? 'Competitor'}
                      </span>
                    ))
                  : ['Loading...', 'Loading...', 'Loading...'].map((comp) => (
                      <span key={comp} className="px-2 py-1 bg-[#0A0A0F] border border-[#6C47FF]/30 text-[#888899] text-xs font-medium">
                        {comp}
                      </span>
                    ))}
              </div>
            </div>

            <div className="lg:col-span-2 border-2 border-[#111118] bg-[#111118] p-6 hover:border-[#6C47FF] hover:shadow-[4px_4px_0px_#6C47FF] transition-all flex flex-col relative group">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-[#888899]" />
                  <h3 className="text-sm font-bold text-[#F0F0F0]">Financial Model</h3>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-6 flex-1">
                <div className="w-full md:w-[45%] h-[120px] cursor-pointer" onClick={() => navigate('financials')}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2A2A35" vertical={false} />
                      <XAxis dataKey="year" stroke="#888899" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888899" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}L`} />
                      <Line type="monotone" dataKey="revenue" stroke="#6C47FF" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="gp" stroke="#00D4AA" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-[#0A0A0F] border border-[#111118] p-3">
                      <div className="text-xs text-[#888899] font-medium mb-1">NPV</div>
                      <div className="text-sm font-black text-[#00D4AA]">{financials?.npv ? `₹${financials.npv.toFixed(1)}` : 'Loading'}</div>
                    </div>
                    <div className="bg-[#0A0A0F] border border-[#111118] p-3">
                      <div className="text-xs text-[#888899] font-medium mb-1">IRR</div>
                      <div className="text-sm font-black text-[#00D4AA]">{financials?.irr ? `${financials.irr.toFixed(0)}%` : 'Loading'}</div>
                    </div>
                    <div className="bg-[#0A0A0F] border border-[#111118] p-3">
                      <div className="text-xs text-[#888899] font-medium mb-1">Payback</div>
                      <div className="text-sm font-black text-[#00D4AA]">
                        {financials?.payback_months ? `${financials.payback_months}m` : 'Loading'}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button className="flex-1 px-4 py-2 border-2 border-[#111118] text-[#888899] font-bold text-xs hover:border-[#00D4AA] hover:text-[#00D4AA] transition-colors flex items-center justify-center gap-2">
                      <Download className="w-3 h-3" /> Download Excel
                    </button>
                    <button
                      onClick={() => navigate('financials')}
                      className="flex-1 px-4 py-2 bg-[#6C47FF]/10 border-2 border-[#6C47FF] text-[#6C47FF] font-bold text-xs hover:bg-[#6C47FF] hover:text-white transition-colors flex items-center justify-center gap-2"
                    >
                      Open Interactive <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-2 border-[#111118] bg-[#111118] p-6 hover:border-[#6C47FF] hover:shadow-[4px_4px_0px_#6C47FF] transition-all flex flex-col group cursor-pointer" onClick={() => navigate('legal')}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-[#888899]" />
                  <h3 className="text-sm font-bold text-[#F0F0F0]">Legal & Compliance</h3>
                </div>
              </div>

              <div className="flex flex-col gap-2 mb-6">
                <div className="flex items-center gap-2 text-sm text-[#F0F0F0]">
                  <CheckCircle2 className="w-4 h-4 text-[#00D4AA]" /> GDPR Safe
                </div>
                <div className="flex items-center gap-2 text-sm text-[#F0F0F0]">
                  <CheckCircle2 className="w-4 h-4 text-[#00D4AA]" /> {legal?.entity_recommendation?.toString() ?? 'Entity recommendation pending'}
                </div>
                <div className="flex items-center gap-2 text-sm text-amber-500">
                  <AlertTriangle className="w-4 h-4" /> Review items in report
                </div>
              </div>

              <div className="mb-6 flex-1">
                <div className="text-white font-medium text-sm">
                  {legal?.documents_available ? `${(legal.documents_available as unknown[]).length} documents available` : 'Compliance report ready'}
                </div>
              </div>

              <button className="text-[#6C47FF] font-bold text-xs flex items-center gap-1 hover:text-[#00D4AA] transition-colors w-fit">
                Download NDA <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="border-2 border-[#111118] bg-[#111118] p-6 hover:border-[#6C47FF] hover:shadow-[4px_4px_0px_#6C47FF] transition-all flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Presentation className="w-5 h-5 text-[#888899]" />
                  <h3 className="text-sm font-bold text-[#F0F0F0]">Pitch Deck</h3>
                </div>
                <span className="text-xs font-bold bg-[#6C47FF]/20 text-[#6C47FF] px-2 py-0.5">
                  {pitchDeck?.slides?.length ?? 0} SLIDES
                </span>
              </div>

              <div
                className="flex-1 w-full aspect-video bg-[#0A0A0F] border border-[#111118] mb-6 flex flex-col items-center justify-center relative cursor-pointer"
                onClick={() => navigate('pitch')}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#6C47FF]/10 to-transparent" />
                <div className="text-[#00D4AA] text-lg font-black tracking-widest z-10">{ideaName}</div>
                <div className="text-[#888899] text-[10px] uppercase tracking-widest mt-2 z-10">
                  {pitchDeck?.brand?.tagline ?? 'Pitch Deck'}
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 px-3 py-2 border-2 border-[#111118] text-[#888899] font-bold text-xs hover:border-[#00D4AA] hover:text-[#00D4AA] transition-colors flex items-center justify-center gap-1">
                  <Download className="w-3 h-3" /> .pptx
                </button>
                <button
                  onClick={() => navigate('pitch')}
                  className="flex-1 px-3 py-2 bg-[#6C47FF]/10 border-2 border-[#6C47FF] text-[#6C47FF] font-bold text-xs hover:bg-[#6C47FF] hover:text-white transition-colors flex items-center justify-center gap-1"
                >
                  Edit Slides <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="border-2 border-[#111118] bg-[#111118] p-6 hover:border-[#6C47FF] hover:shadow-[4px_4px_0px_#6C47FF] transition-all flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-[#888899]" />
                  <h3 className="text-sm font-bold text-[#F0F0F0]">MVP Architecture</h3>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-8 mt-2">
                {(mvp?.recommended_stack ?? []).slice(0, 4).map((item, i) => (
                  <span key={i} className="px-3 py-1.5 bg-[#0A0A0F] text-[#888899] text-xs font-bold border border-[#111118]">
                    {item.technology?.toString() ?? 'Tech'}
                  </span>
                ))}
              </div>

              <div className="mt-auto flex flex-col gap-2">
                <button
                  onClick={() => navigate('mvp')}
                  className="w-full px-4 py-2 bg-transparent text-[#6C47FF] font-bold text-xs hover:text-[#00D4AA] transition-colors flex items-center gap-2"
                >
                  View Architecture <ArrowRight className="w-3 h-3" />
                </button>
                <button className="w-full px-4 py-2 border-2 border-[#111118] text-[#888899] font-bold text-xs hover:border-white transition-colors flex items-center justify-center gap-2">
                  <Download className="w-3 h-3" /> Download Roadmap
                </button>
              </div>
            </div>

            <div className="border-2 border-amber-500/50 bg-amber-500/5 p-6 shadow-[4px_4px_0px_rgba(234,179,8,0.2)] flex flex-col group cursor-pointer" onClick={() => navigate('pivot')}>
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold text-amber-500">Pivot Opportunity Found</h3>
              </div>

              <div className="p-4 bg-[#0A0A0F] border border-amber-500/30 text-sm text-[#F0F0F0] leading-relaxed mb-6 flex-1">
                {pivots[0]?.rationale?.toString() ?? 'Pivot options are being generated from the backend run.'}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('pivot');
                }}
                className="w-full py-3 bg-[#6C47FF] border-2 border-[#6C47FF] text-white font-bold text-sm hover:bg-[#111118] hover:text-[#6C47FF] shadow-[2px_2px_0px_transparent] group-hover:shadow-[4px_4px_0px_#6C47FF] transition-all flex items-center justify-center gap-2"
              >
                Run Full Pivot Analysis <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <aside className="w-full xl:w-[260px] shrink-0 border-2 border-[#111118] bg-[#111118] p-6">
            <h3 className="text-sm font-bold text-[#F0F0F0] mb-6">Share this package</h3>

            <div className="flex flex-col gap-3">
              <button className="w-full py-2.5 px-4 bg-[#0A0A0F] border border-[#111118] text-[#888899] hover:text-white hover:border-[#6C47FF] transition-all flex items-center gap-3 text-sm font-bold text-left">
                <LinkIcon className="w-4 h-4" /> Copy Link
              </button>
              <button className="w-full py-2.5 px-4 bg-[#0A0A0F] border border-[#111118] text-[#888899] hover:text-white hover:border-[#6C47FF] transition-all flex items-center gap-3 text-sm font-bold text-left">
                <Mail className="w-4 h-4" /> Email Investor
              </button>
              <button className="w-full py-2.5 px-4 bg-[#0A0A0F] border border-[#111118] text-[#888899] hover:text-white hover:border-[#6C47FF] transition-all flex items-center gap-3 text-sm font-bold text-left">
                <Globe className="w-4 h-4" /> Push to Drive
              </button>
              <button className="w-full py-2.5 px-4 bg-[#0A0A0F] border border-[#111118] text-[#888899] hover:text-white hover:border-[#6C47FF] transition-all flex items-center gap-3 text-sm font-bold text-left">
                <FileArchive className="w-4 h-4" /> Export PDF
              </button>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
