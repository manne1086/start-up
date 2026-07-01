import { useState } from 'react';
import { 
  ArrowRight, 
  Download, 
  RefreshCw, 
  TrendingUp,
  PieChart,
  ChevronRight
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import GlobalNavbar from './GlobalNavbar';
import { useRouter } from '../router';

const chartData = [
  { year: 'Year 1', revenue: 48, gp: 35, ebitda: -15 },
  { year: 'Year 2', revenue: 120, gp: 95, ebitda: 10 },
  { year: 'Year 3', revenue: 350, gp: 290, ebitda: 120 },
  { year: 'Year 4', revenue: 680, gp: 580, ebitda: 280 },
  { year: 'Year 5', revenue: 920, gp: 800, ebitda: 450 },
];

export default function FinancialModel() {
  const { navigate } = useRouter();
  const [showFormula, setShowFormula] = useState(false);

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F0F0F0] flex flex-col font-sans pb-12">
      <GlobalNavbar />

      <main className="flex-1 w-full max-w-[1600px] mx-auto px-6 py-8">
        
        {/* Breadcrumb & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#888899] uppercase tracking-widest mb-2">
              <span className="hover:text-white cursor-pointer transition-colors" onClick={() => navigate('projects')}>Projects</span>
              <ChevronRight className="w-3 h-3" />
              <span className="hover:text-white cursor-pointer transition-colors" onClick={() => navigate('results')}>EduReach AI</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-[#6C47FF]">Financial Model</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">5-Year DCF Model</h1>
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

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Year 1 Revenue', value: '₹48L', trend: '+12%' },
            { label: 'IRR', value: '34%', trend: '+2%' },
            { label: 'NPV', value: '₹3.1Cr', trend: '+₹12L' },
            { label: 'Break-even', value: 'Month 22', trend: '-2 mo' },
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
          
          {/* Left Sidebar — Assumptions */}
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

          {/* Main Area — Chart & Table */}
          <div className="flex-1 flex flex-col gap-6">
            
            {/* Chart */}
            <div className="w-full border-2 border-[#111118] bg-[#111118] p-6 h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6C47FF" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6C47FF" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorGP" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00D4AA" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00D4AA" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorEBITDA" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#888899" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#888899" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2A35" vertical={false} />
                  <XAxis dataKey="year" stroke="#888899" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888899" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}L`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0A0A0F', borderColor: '#6C47FF', borderRadius: 0, color: '#fff' }}
                    itemStyle={{ color: '#00D4AA' }}
                  />
                  <Legend iconType="square" wrapperStyle={{ fontSize: '12px', color: '#888899' }} />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#6C47FF" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} />
                  <Area type="monotone" dataKey="gp" name="Gross Profit" stroke="#00D4AA" fillOpacity={1} fill="url(#colorGP)" strokeWidth={2} />
                  <Area type="monotone" dataKey="ebitda" name="EBITDA" stroke="#888899" fillOpacity={1} fill="url(#colorEBITDA)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Table */}
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
                  {chartData.map((row, i) => (
                    <tr key={i} className={`border-b border-[#0A0A0F] ${i % 2 === 0 ? 'bg-[#111118]' : 'bg-[#0D0D14]'}`}>
                      <td className="px-6 py-4 font-sans text-white font-bold">{row.year}</td>
                      <td className="px-6 py-4 text-[#00D4AA]">₹{row.revenue}L</td>
                      <td className="px-6 py-4 text-[#FF4D4F]">₹{row.revenue - row.gp}L</td>
                      <td className="px-6 py-4 text-[#F0F0F0]">₹{row.gp}L</td>
                      <td className="px-6 py-4 text-[#F0F0F0]">₹{row.ebitda}L</td>
                      <td className="px-6 py-4 text-[#888899]">₹{(row.ebitda * 0.75).toFixed(1)}L</td>
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
                  <code className="text-xs font-mono text-[#00D4AA] block mb-2">FCF = EBIT × (1 - Tax Rate) + D&A - CapEx - ΔNWC</code>
                  <p className="text-sm text-[#888899] leading-relaxed font-sans">
                    Free Cash Flow (FCF) is calculated by taking earnings before interest and taxes (EBIT), subtracting the assumed 25% corporate tax rate, adding back non-cash depreciation & amortization, and subtracting capital expenditures and changes in net working capital.
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
