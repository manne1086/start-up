import { Download, ExternalLink, ArrowDown, ArrowUp, Minus } from 'lucide-react';
import GlobalNavbar from './GlobalNavbar';

const competitors = [
  { name: 'BYJU\'s', founded: '2011', funding: '$5.5B', pricing: 'Premium ($500/yr)', focus: 'Tier 1 B2C', threat: 'High' },
  { name: 'Vedantu', founded: '2014', funding: '$200M', pricing: 'Mid ($200/yr)', focus: 'Live Tutoring', threat: 'High' },
  { name: 'Teachmint', founded: '2020', funding: '$118M', pricing: 'Freemium', focus: 'B2B ERP', threat: 'Medium' },
  { name: 'Doubtnut', founded: '2016', funding: '$50M', pricing: 'Ad-supported', focus: 'Vernacular Doubt', threat: 'Medium' },
  { name: 'Local Tutors', founded: '-', funding: '-', pricing: 'Low ($20/mo)', focus: 'Offline', threat: 'Low' },
];

export default function MarketResearch() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F0F0F0] flex flex-col font-sans pb-12">
      <GlobalNavbar />

      <main className="flex-1 w-full max-w-[1400px] mx-auto px-6 py-8">
        <h1 className="text-3xl font-black text-white tracking-tight mb-8">Market Research — EduReach AI</h1>

        {/* Top 3 Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-[#111118] border-2 border-[#111118] p-6 hover:border-[#6C47FF] transition-colors flex flex-col">
            <div className="text-xs font-bold text-[#888899] uppercase tracking-widest mb-2">Total Addressable Market (TAM)</div>
            <div className="text-4xl font-black text-[#00D4AA] tracking-tight mb-4">$4.2B</div>
            <div className="mt-auto pt-4 border-t border-[#0A0A0F] text-xs font-bold text-[#888899]">
              Source: RedSeer EdTech Report 2027
            </div>
          </div>
          <div className="bg-[#111118] border-2 border-[#111118] p-6 hover:border-[#6C47FF] transition-colors flex flex-col">
            <div className="text-xs font-bold text-[#888899] uppercase tracking-widest mb-2">Serviceable Available Market (SAM)</div>
            <div className="text-4xl font-black text-[#6C47FF] tracking-tight mb-4">$820M</div>
            <div className="mt-auto pt-4 border-t border-[#0A0A0F] text-xs font-bold text-[#888899]">
              Source: Tier 2/3 BPS Penetration Data
            </div>
          </div>
          <div className="bg-[#111118] border-2 border-[#111118] p-6 hover:border-[#6C47FF] transition-colors flex flex-col">
            <div className="text-xs font-bold text-[#888899] uppercase tracking-widest mb-2">Serviceable Obtainable Market (SOM)</div>
            <div className="text-4xl font-black text-white tracking-tight mb-4">$41M</div>
            <div className="mt-auto pt-4 border-t border-[#0A0A0F] text-xs font-bold text-[#888899]">
              Source: 5% Capture of SAM Yr 3
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
                {competitors.map((c, i) => (
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
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Market Gap Analysis */}
        <div className="mb-10 w-full border-2 border-[#111118] bg-[#111118] p-6">
          <h2 className="text-lg font-black text-white uppercase tracking-widest mb-6">Market Gap Analysis</h2>
          <div className="flex flex-col gap-4">
            <div className="border-l-4 border-[#6C47FF] bg-[#0A0A0F] p-5">
              <h4 className="font-bold text-[#F0F0F0] mb-2">1. The Vernacular Vacuum</h4>
              <p className="text-sm text-[#888899] leading-relaxed">
                92% of premium EdTech content is English-first. Tier 2-3 students require true bilingual learning (not just dubbed videos). Evidence: Doubtnut's rapid rise indicates massive demand for local language problem solving.
              </p>
            </div>
            <div className="border-l-4 border-[#00D4AA] bg-[#0A0A0F] p-5">
              <h4 className="font-bold text-[#F0F0F0] mb-2">2. B2B SaaS for Budget Private Schools</h4>
              <p className="text-sm text-[#888899] leading-relaxed">
                Over 400,000 Budget Private Schools (BPS) in India lack basic digital infrastructure. They cannot afford heavy ERPs like Teachmint. A lightweight, WhatsApp-integrated SaaS has zero direct competitors in the sub-₹10k/year segment.
              </p>
            </div>
            <div className="border-l-4 border-[#6C47FF] bg-[#0A0A0F] p-5">
              <h4 className="font-bold text-[#F0F0F0] mb-2">3. Asynchronous Low-Bandwidth Delivery</h4>
              <p className="text-sm text-[#888899] leading-relaxed">
                Live classes (Vedantu model) fail on 3G/unstable 4G networks common in target regions. Gap exists for AI-compressed, offline-first sync architecture.
              </p>
            </div>
          </div>
        </div>

        {/* Sources Panel */}
        <div>
          <h4 className="text-xs font-bold text-[#888899] uppercase tracking-widest mb-3">Cited Sources</h4>
          <div className="flex flex-wrap gap-3">
            {['redseer.com/reports/edtech-2027', 'kpmg.com/in/education', 'udiseplus.gov.in'].map((url, i) => (
              <a key={i} href="#" className="px-3 py-1.5 bg-[#111118] border border-[#111118] hover:border-[#6C47FF] text-[#6C47FF] text-xs font-mono transition-colors flex items-center gap-2">
                {url} <ExternalLink className="w-3 h-3" />
              </a>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
