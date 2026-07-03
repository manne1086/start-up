import { Download, ExternalLink, ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { useGeneration } from '../generation';
import GlobalNavbar from './GlobalNavbar';

export default function MarketResearch() {
  const { backendState } = useGeneration();
  const market = backendState?.market as
    | {
        tam?: string;
        sam?: string;
        som?: string;
        tam_source?: string;
        competitors?: Array<{
          name?: string;
          founded?: string;
          funding?: string;
          pricing?: string;
          focus?: string;
          threat_level?: string;
        }>;
        market_gaps?: string[];
        raw_search_results?: string[];
      }
    | null
    | undefined;

  const competitors = market?.competitors?.length
    ? market.competitors.map((competitor) => ({
        name: competitor.name ?? 'Competitor',
        founded: competitor.founded ?? '-',
        funding: competitor.funding ?? '-',
        pricing: competitor.pricing ?? '-',
        focus: competitor.focus ?? '-',
        threat: competitor.threat_level ?? 'Medium',
      }))
    : [];

  const marketGaps = market?.market_gaps?.length ? market.market_gaps : [];

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F0F0F0] flex flex-col font-sans pb-12">
      <GlobalNavbar />

      <main className="flex-1 w-full max-w-[1400px] mx-auto px-6 py-8">
        <h1 className="text-3xl font-black text-white tracking-tight mb-8">
          Market Research — {backendState?.startup_name || backendState?.idea || 'Live Startup Data'}
        </h1>

        {/* Top 3 Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-[#111118] border-2 border-[#111118] p-6 hover:border-[#6C47FF] transition-colors flex flex-col">
            <div className="text-xs font-bold text-[#888899] uppercase tracking-widest mb-2">Total Addressable Market (TAM)</div>
          <div className="text-4xl font-black text-[#00D4AA] tracking-tight mb-4">{market?.tam ?? 'No market data yet'}</div>
            <div className="mt-auto pt-4 border-t border-[#0A0A0F] text-xs font-bold text-[#888899]">
              Source: {market?.tam_source ?? 'Backend market intelligence'}
            </div>
          </div>
          <div className="bg-[#111118] border-2 border-[#111118] p-6 hover:border-[#6C47FF] transition-colors flex flex-col">
            <div className="text-xs font-bold text-[#888899] uppercase tracking-widest mb-2">Serviceable Available Market (SAM)</div>
          <div className="text-4xl font-black text-[#6C47FF] tracking-tight mb-4">{market?.sam ?? 'No market data yet'}</div>
            <div className="mt-auto pt-4 border-t border-[#0A0A0F] text-xs font-bold text-[#888899]">
              Source: {market?.raw_search_results?.length ? `${market.raw_search_results.length} live result(s)` : 'Search-backed synthesis'}
            </div>
          </div>
          <div className="bg-[#111118] border-2 border-[#111118] p-6 hover:border-[#6C47FF] transition-colors flex flex-col">
            <div className="text-xs font-bold text-[#888899] uppercase tracking-widest mb-2">Serviceable Obtainable Market (SOM)</div>
          <div className="text-4xl font-black text-white tracking-tight mb-4">{market?.som ?? 'No market data yet'}</div>
            <div className="mt-auto pt-4 border-t border-[#0A0A0F] text-xs font-bold text-[#888899]">
              Source: Backend model output
            </div>
          </div>
        </div>

        {/* Competitor Table */}
        <div className="mb-10 w-full border-2 border-[#111118] bg-[#111118] flex flex-col">
          <div className="p-5 border-b-2 border-[#0A0A0F] flex justify-between items-center bg-[#0A0A0F]">
            <h2 className="text-sm font-black text-white uppercase tracking-widest">Competitor Landscape</h2>
            <button className="text-[#6C47FF] font-bold text-xs hover:text-[#00D4AA] transition-colors flex items-center gap-1">
              Export CSV <ExternalLink className="w-3 h-3" />
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#111118] border-b-2 border-[#0A0A0F]">
                <tr>
                  <th className="px-6 py-4 font-bold text-[#888899] uppercase tracking-wider text-xs">Company</th>
                  <th className="px-6 py-4 font-bold text-[#888899] uppercase tracking-wider text-xs">Founded</th>
                  <th className="px-6 py-4 font-bold text-[#888899] uppercase tracking-wider text-xs">Funding</th>
                  <th className="px-6 py-4 font-bold text-[#888899] uppercase tracking-wider text-xs">Pricing</th>
                  <th className="px-6 py-4 font-bold text-[#888899] uppercase tracking-wider text-xs">Market Focus</th>
                  <th className="px-6 py-4 font-bold text-[#888899] uppercase tracking-wider text-xs flex items-center gap-1 cursor-pointer hover:text-white">Threat Level <ArrowDown className="w-3 h-3" /></th>
                </tr>
              </thead>
              <tbody>
                {competitors.length ? competitors.map((c, i) => (
                  <tr key={i} className="border-b border-[#0A0A0F] hover:bg-[#0A0A0F]/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-white">{c.name}</td>
                    <td className="px-6 py-4 text-[#888899] font-mono">{c.founded}</td>
                    <td className="px-6 py-4 text-[#888899] font-mono">{c.funding}</td>
                    <td className="px-6 py-4 text-[#F0F0F0]">{c.pricing}</td>
                    <td className="px-6 py-4 text-[#F0F0F0]">{c.focus}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-bold uppercase border ${
                        c.threat === 'High' ? 'border-[#FF4D4F]/30 bg-[#FF4D4F]/10 text-[#FF4D4F]' :
                        c.threat === 'Medium' ? 'border-amber-500/30 bg-amber-500/10 text-amber-500' :
                        'border-[#00D4AA]/30 bg-[#00D4AA]/10 text-[#00D4AA]'
                      }`}>
                        {c.threat}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td className="px-6 py-6 text-[#888899]" colSpan={6}>No competitor data yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Market Gap Analysis */}
        <div className="mb-10 w-full border-2 border-[#111118] bg-[#111118] p-6">
          <h2 className="text-lg font-black text-white uppercase tracking-widest mb-6">Market Gap Analysis</h2>
          <div className="flex flex-col gap-4">
            {marketGaps.length ? marketGaps.map((gap, i) => (
              <div key={i} className={`border-l-4 ${i % 2 === 0 ? 'border-[#6C47FF]' : 'border-[#00D4AA]'} bg-[#0A0A0F] p-5`}>
                <h4 className="font-bold text-[#F0F0F0] mb-2">{i + 1}. Market Gap</h4>
                <p className="text-sm text-[#888899] leading-relaxed">{gap}</p>
              </div>
            )) : <div className="text-[#888899]">No market gaps captured yet.</div>}
          </div>
        </div>

        {/* Sources Panel */}
        <div>
          <h4 className="text-xs font-bold text-[#888899] uppercase tracking-widest mb-3">Cited Sources</h4>
          <div className="flex flex-wrap gap-3">
            {(market?.raw_search_results?.length ? market.raw_search_results.slice(0, 3) : []).map((url, i) => (
              <span key={i} className="px-3 py-1.5 bg-[#111118] border border-[#111118] text-[#6C47FF] text-xs font-mono transition-colors flex items-center gap-2">
                {url} <ExternalLink className="w-3 h-3" />
              </span>
            ))}
            {!market?.raw_search_results?.length && <span className="text-[#888899]">No source snippets yet.</span>}
          </div>
        </div>

      </main>
    </div>
  );
}
