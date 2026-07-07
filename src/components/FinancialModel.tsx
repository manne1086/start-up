import { useState } from 'react';
import { ArrowRight, Download, RefreshCw, TrendingUp, PieChart, ChevronRight } from 'lucide-react';
import GlobalNavbar from './GlobalNavbar';
import { useGeneration } from '../generation';
import { useRouter } from '../router';
import { buildVisualizationData, formatMoney } from '../visualizationData';
import FinancialChart from './FinancialChart';

export default function FinancialModel() {
  const { navigate } = useRouter();
  const { backendState } = useGeneration();
  const [showFormula, setShowFormula] = useState(false);
  const viz = buildVisualizationData(backendState);

  const financials = backendState?.financials as
    | {
        npv?: number;
        irr?: number;
        payback_months?: number;
        fcf_formula?: string;
      }
    | null
    | undefined;

  const formula = financials?.fcf_formula ?? 'No financial model generated yet.';

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F0F0F0] flex flex-col font-sans pb-12">
      <GlobalNavbar />

      <main className="flex-1 w-full max-w-[1600px] mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#888899] uppercase tracking-widest mb-2">
              <span className="hover:text-white cursor-pointer transition-colors" onClick={() => navigate('projects')}>Projects</span>
              <ChevronRight className="w-3 h-3" />
              <span className="hover:text-white cursor-pointer transition-colors" onClick={() => navigate('results')}>
                {backendState?.startup_name || backendState?.idea || 'Startup'}
              </span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-[#6C47FF]">Financial Model</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              {backendState?.startup_name || backendState?.idea || 'Live'} 5-Year DCF Model
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button className="px-5 py-2 bg-transparent border-2 border-[#111118] text-[#888899] font-bold text-sm hover:border-[#00D4AA] hover:text-[#00D4AA] transition-colors flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Regenerate
            </button>
            <button className="px-5 py-2 bg-[#6C47FF]/10 border-2 border-[#6C47FF] text-[#6C47FF] font-bold text-sm hover:bg-[#6C47FF] hover:text-white transition-colors flex items-center gap-2">
              <Download className="w-4 h-4" /> Export .xlsx
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Year 1 Revenue', value: formatMoney(viz.financialForecast[0]?.revenue ?? 0), trend: '+12%' },
            { label: 'IRR', value: financials?.irr ? `${financials.irr.toFixed(0)}%` : 'Pending', trend: '+2%' },
            { label: 'NPV', value: financials?.npv ? formatMoney(Number(financials.npv)) : 'Pending', trend: '+$12K' },
            { label: 'Break-even', value: financials?.payback_months ? `Month ${financials.payback_months}` : 'Pending', trend: '-2 mo' },
          ].map((stat, i) => (
            <div key={i} className="bg-[#111118] border-2 border-[#111118] p-5 flex flex-col justify-between hover:border-[#6C47FF] transition-colors">
              <div className="text-xs font-bold text-[#888899] uppercase tracking-widest mb-2">{stat.label}</div>
              <div className="flex items-end gap-3">
                <div className="text-3xl font-black text-[#00D4AA]">{stat.value}</div>
                <div className="text-xs font-bold text-white bg-white/10 px-2 py-0.5 flex items-center gap-1 mb-1">
                  <TrendingUp className="w-3 h-3 text-[#00D4AA]" /> {stat.trend}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-[240px] shrink-0 border-2 border-[#111118] bg-[#111118] p-6 flex flex-col h-fit">
            <div className="flex items-center gap-2 mb-6">
              <PieChart className="w-5 h-5 text-[#888899]" />
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Assumptions</h3>
            </div>

            <div className="flex flex-col gap-5">
              <div>
                <label className="block text-xs font-bold text-[#888899] uppercase tracking-widest mb-2">Monthly Subs</label>
                <input type="number" defaultValue={120} className="w-full bg-[#0A0A0F] border border-[#111118] text-[#F0F0F0] font-mono text-sm px-3 py-2 focus:outline-none focus:border-[#6C47FF] transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#888899] uppercase tracking-widest mb-2">Price/School ₹</label>
                <input type="number" defaultValue={8000} className="w-full bg-[#0A0A0F] border border-[#111118] text-[#F0F0F0] font-mono text-sm px-3 py-2 focus:outline-none focus:border-[#6C47FF] transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#888899] uppercase tracking-widest mb-2">Churn Rate %</label>
                <input type="number" defaultValue={8} className="w-full bg-[#0A0A0F] border border-[#111118] text-[#F0F0F0] font-mono text-sm px-3 py-2 focus:outline-none focus:border-[#6C47FF] transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#888899] uppercase tracking-widest mb-2">Tax Rate %</label>
                <input type="number" defaultValue={25} className="w-full bg-[#0A0A0F] border border-[#111118] text-[#F0F0F0] font-mono text-sm px-3 py-2 focus:outline-none focus:border-[#6C47FF] transition-colors" />
              </div>
            </div>

            <button className="mt-8 w-full py-3 bg-[#00D4AA] text-[#0A0A0F] font-black text-sm uppercase tracking-wider hover:bg-white transition-colors shadow-[4px_4px_0px_#0A0A0F] border-2 border-[#0A0A0F] flex items-center justify-center gap-2">
              Recalculate <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 flex flex-col gap-6">
            <FinancialChart years={viz.financialChart.years} series={viz.financialChart.series} />

            <div className="w-full border-2 border-[#111118] bg-[#111118] overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-[#6C47FF]/10 border-b border-[#6C47FF]/30">
                  <tr>
                    <th className="px-6 py-4 font-bold text-[#F0F0F0] uppercase tracking-wider text-xs">Year</th>
                    <th className="px-6 py-4 font-bold text-[#F0F0F0] uppercase tracking-wider text-xs">Revenue</th>
                    <th className="px-6 py-4 font-bold text-[#F0F0F0] uppercase tracking-wider text-xs">COGS</th>
                    <th className="px-6 py-4 font-bold text-[#F0F0F0] uppercase tracking-wider text-xs">Gross Profit</th>
                    <th className="px-6 py-4 font-bold text-[#F0F0F0] uppercase tracking-wider text-xs">EBITDA</th>
                    <th className="px-6 py-4 font-bold text-[#F0F0F0] uppercase tracking-wider text-xs">FCF</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-xs">
                  {viz.financialForecast.map((row, i) => (
                    <tr key={i} className={`border-b border-[#0A0A0F] ${i % 2 === 0 ? 'bg-[#111118]' : 'bg-[#0D0D14]'}`}>
                      <td className="px-6 py-4 font-sans text-white font-bold">Year {row.year}</td>
                      <td className="px-6 py-4 text-[#00D4AA]">{formatMoney(row.revenue)}</td>
                      <td className="px-6 py-4 text-[#FF4D4F]">{formatMoney(Math.max(row.revenue - Math.max(row.ebitda, 0), 0))}</td>
                      <td className="px-6 py-4 text-[#F0F0F0]">{formatMoney(Math.max(row.revenue - Math.max(row.revenue - Math.max(row.ebitda, 0), 0), 0))}</td>
                      <td className="px-6 py-4 text-[#F0F0F0]">{formatMoney(row.ebitda)}</td>
                      <td className="px-6 py-4 text-[#888899]">{formatMoney(row.fcf)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="w-full border-2 border-[#111118] bg-[#111118] p-5">
              <button
                className="w-full flex items-center justify-between font-bold text-sm text-[#888899] hover:text-white transition-colors uppercase tracking-widest"
                onClick={() => setShowFormula(!showFormula)}
              >
                How was this calculated?
                <ChevronRight className={`w-4 h-4 transition-transform ${showFormula ? 'rotate-90' : ''}`} />
              </button>

              {showFormula && (
                <div className="mt-4 p-4 bg-[#0A0A0F] border border-[#111118]">
                  <code className="text-xs font-mono text-[#00D4AA] block mb-2">{formula}</code>
                  <p className="text-sm text-[#888899] leading-relaxed font-sans">
                    Free Cash Flow is modeled from revenue growth, margin expansion, and reinvestment needs.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
