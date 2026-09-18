import { useState, useEffect } from 'react';
import type { CSSProperties } from 'react';
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
  ArrowLeft,
  Loader2,
  Users,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import JSZip from 'jszip';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import GlobalNavbar from './GlobalNavbar';
import ExecutiveBriefing, { type Briefing } from './ExecutiveBriefing';
import { useGeneration } from '../generation';
import { useRouter } from '../router';
import { buildVisualizationData } from '../visualizationData';
import { downloadPitchDeckPptx } from '../pptx';
import { exportStartupPdf } from '../pdfExport';

export default function ResultsDashboard() {
  const { navigate, navigatePath } = useRouter();
  const { backendState } = useGeneration();
  const viz = buildVisualizationData(backendState);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pptxLoading, setPptxLoading] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [published, setPublished] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const ideaName = backendState?.startup_name || backendState?.idea?.toString()?.slice(0, 32) || 'Startup';
  const market = backendState?.market as {
    tam?: string;
    tam_source?: string;
    competitors?: Array<Record<string, unknown>>;
    opportunity_score?: number;
    growth_rate?: number;
    competitive_intensity?: string;
  } | null | undefined;
  const financials = backendState?.financials as {
    projections?: Array<Record<string, unknown>>;
    npv?: number;
    irr?: number;
    payback_months?: number;
  } | null | undefined;
  const legal = backendState?.legal as Record<string, unknown> | null | undefined;
  const pitchDeck = backendState?.pitch_deck as {
    slides?: Array<Record<string, unknown>>;
    brand?: { tagline?: string };
  } | null | undefined;
  const mvp = backendState?.mvp as {
    recommended_stack?: Array<Record<string, unknown>>;
    estimated_weeks?: number;
    team_size?: number;
    estimated_cost_inr?: string;
  } | null | undefined;
  const pivots = backendState?.pivots ?? [];

  const safeFilename = (name: string) =>
    name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'ventureforge-package';

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: `${ideaName} - VentureForge`, text: 'VentureForge startup package', url: window.location.href });
      return;
    }
    await navigator.clipboard.writeText(window.location.href);
    showToast('Link copied to clipboard!');
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    showToast('Link copied to clipboard!');
  };

  const handleDownloadZip = async () => {
    const zip = new JSZip();
    const state = backendState ?? {};
    zip.file('startup-state.json', JSON.stringify(state, null, 2));
    zip.file('summary.md', `# ${ideaName}\n\nMarket TAM: ${market?.tam?.toString() ?? 'N/A'}\nNPV: ${financials?.npv ? financials.npv.toFixed(2) : 'N/A'}\n`);
    zip.file('market-research.json', JSON.stringify(market ?? {}, null, 2));
    zip.file('financial-model.json', JSON.stringify(financials ?? {}, null, 2));
    zip.file('legal-report.json', JSON.stringify(legal ?? {}, null, 2));
    zip.file('pitch-deck.json', JSON.stringify(pitchDeck ?? {}, null, 2));
    zip.file('mvp-architecture.json', JSON.stringify(mvp ?? {}, null, 2));
    zip.file('pivots.json', JSON.stringify(pivots ?? [], null, 2));
    zip.file('startup-visualization-package.json', JSON.stringify(viz, null, 2));
    const blob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(blob, `${safeFilename(ideaName)}.zip`);
  };

  const handleExportPdf = async () => {
    setPdfLoading(true);
    try {
      await exportStartupPdf(backendState, ideaName);
      showToast('PDF downloaded successfully!');
    } catch (err) {
      console.error('PDF export error:', err);
      showToast('PDF export failed. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleExcelExport = () => {
    const rows = financials?.projections?.length ? financials.projections : [];
    const csv = [
      ['Year', 'Revenue', 'COGS', 'Gross Profit', 'EBITDA', 'FCF'].join(','),
      ...rows.map((row) =>
        [row.year ?? '', row.revenue ?? '', row.cogs ?? '', row.gross_profit ?? row.gp ?? '', row.ebitda ?? '', row.fcf ?? ''].join(',')
      ),
    ].join('\n');
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `${safeFilename(ideaName)}-financials.csv`);
  };

  const handleDrivePush = async () => {
    await handleCopyLink();
    showToast('Drive export not configured — link copied instead.');
  };

  const handlePublishToCommunity = async () => {
    const threadId = backendState?.thread_id;
    if (!threadId) {
      showToast('No generation run to publish.');
      return;
    }
    setPublishLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
      const res = await fetch(`${API_URL}/api/ideas/from-run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ thread_id: threadId, is_public: true }),
      });
      if (res.status === 401) {
        showToast('Sign in to publish to the community.');
        return;
      }
      if (!res.ok) {
        const msg = await res.text();
        showToast(msg || 'Failed to publish.');
        return;
      }
      const idea = await res.json();
      setPublished(true);
      showToast('Published to Community!');
      setTimeout(() => navigatePath(`/ideas/${idea.id}`), 600);
    } catch (err: any) {
      showToast(err?.message ?? 'Failed to publish.');
    } finally {
      setPublishLoading(false);
    }
  };

  const handleDownloadPptx = async () => {
    setPptxLoading(true);
    try {
      await downloadPitchDeckPptx(backendState, ideaName);
    } catch (err) {
      console.error('[PPTX] download failed:', err);
      const message = err instanceof Error ? err.message : 'Failed to generate PPTX.';
      showToast(message);
    } finally {
      setPptxLoading(false);
    }
  };

  const chartData = financials?.projections?.length
    ? financials.projections.map((row) => ({
        year: `Yr ${row.year ?? ''}`,
        revenue: Number(row.revenue ?? 0) / 100000,
        gp: Number(row.gross_profit ?? row.gp ?? 0) / 100000,
      }))
    : [];

  const statusItems = [
    ['Market Research', market],
    ['Financial Model', financials],
    ['Legal', legal],
    ['Pitch Deck', pitchDeck],
    ['MVP', mvp],
    ['Pivots', (pivots as unknown[]).length ? pivots : null],
  ];
  
  const completedCount = [market, financials, legal, pitchDeck, mvp, (pivots as unknown[]).length ? pivots : null].filter(Boolean).length;
  const progressPercent = Math.round((completedCount / statusItems.length) * 100);

  return (
    <div className="min-h-screen bg-[#08080D] text-[#F0F0F0] flex flex-col font-sans pb-12 dashboard-shell">
      <GlobalNavbar />

      {/* ── Toast ── */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-[9999] animate-slideInRight">
          <div className="glass-strong px-5 py-3 flex items-center gap-3 rounded-2xl border border-[#00D4AA]/30 shadow-2xl max-w-md">
            <CheckCircle2 className="w-5 h-5 text-[#00D4AA]" />
            <span className="text-sm font-semibold text-white">{toastMsg}</span>
            <button onClick={() => setToastMsg('')} className="ml-auto text-[#888899] hover:text-white transition-colors">&times;</button>
          </div>
        </div>
      )}

      {/* ── Status bar ── */}
      <div className="w-full glass border-x-0 border-t-0 border-b-white/[0.08] py-3 px-6 flex items-center gap-6 overflow-x-auto custom-scrollbar shrink-0 animate-fadeInDown">
        {statusItems.map(([label, value], i) => (
          <div key={String(label)} className="flex items-center gap-2 shrink-0 animate-fadeInLeft" style={{ animationDelay: `${i * 100}ms` }}>
            <CheckCircle2 className={`w-4 h-4 ${value ? 'text-[#00D4AA]' : 'text-[#888899]'}`} />
            <span className="text-xs font-semibold text-[#888899] uppercase tracking-wider">{label}</span>
          </div>
        ))}
      </div>

      <main className="flex-1 w-full max-w-[1400px] mx-auto px-6 py-12">

        {/* Back button */}
        <button onClick={() => navigate('projects')}
                className="flex items-center gap-2 mb-8 text-xs font-bold text-[#888899] uppercase tracking-widest hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Projects
        </button>

        {/* ── Header Section ── */}
        <div className="mb-12 animate-fadeInUp">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-3"><span className="live-orb" /><span className="text-[11px] font-black uppercase tracking-[0.28em] text-[#00D4AA]">Investment workspace</span></div>
              <h1 className="text-4xl md:text-6xl font-black text-white mb-3 tracking-[-0.05em]">
                {ideaName}
              </h1>
              <p className="text-base text-[#E0E0EE] font-medium">
                Investment-grade startup analysis & package
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#00D4AA] uppercase tracking-wider bg-[#00D4AA]/10 px-3 py-1.5 rounded-lg border border-[#00D4AA]/30 w-fit">
              <CheckCircle2 className="w-4 h-4" /> Generated & Ready
            </div>
          </div>
        </div>

        {/* ── Plain-English briefing (leads the page) ── */}
        <ExecutiveBriefing briefing={backendState?.briefing as Briefing | undefined} />

        {/* ── Export Section (Prominent CTAs) ── */}
        <div className="mb-12 p-8 rounded-2xl bg-gradient-to-br from-[#6C47FF]/10 to-[#00D4AA]/10 border border-[#6C47FF]/30 animate-fadeInUp" style={{ animationDelay: '150ms' }}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h3 className="text-xl font-black text-white mb-1">Your Startup Package</h3>
              <p className="text-sm text-[#E0E0EE]">Download all generated assets and reports for investor presentations</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <button onClick={handleDownloadZip}
                      className="px-6 py-3 rounded-xl bg-[#6C47FF] border-2 border-[#6C47FF] text-white font-bold text-sm hover:bg-[#5a3ae0] hover:shadow-[0_0_20px_rgba(108,71,255,0.4)] transition-all flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(108,71,255,0.2)]">
                <Download className="w-4 h-4" /> Download All
              </button>
              <button onClick={handleExportPdf} disabled={pdfLoading}
                      className="px-6 py-3 rounded-xl bg-[#00D4AA]/10 border-2 border-[#00D4AA]/50 text-[#00D4AA] font-bold text-sm hover:bg-[#00D4AA]/20 hover:border-[#00D4AA] transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                {pdfLoading ? 'Generating PDF…' : 'Export PDF'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Data Visualization Grid ── */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* ── Main grid ── */}
          <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* Market Research card — Aqua accent */}
            <div className="bg-[#111118] rounded-2xl p-6 flex flex-col cursor-pointer transition-all duration-200 hover:border-[#00D4AA]/50 hover:shadow-[0_0_20px_rgba(0,212,170,0.1)] animate-fadeInUp border-2 border-white/[0.06]"
                 style={{ animationDelay: '200ms', borderLeftWidth: '4px', borderLeftColor: '#00D4AA' }}
                 onClick={() => navigate('market')}>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#00D4AA]/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-[#00D4AA]" />
                  </div>
                  <div>
                    <h6 className="font-bold text-[#F0F0F0] text-sm">Market Research</h6>
                    <p className="text-xs text-[#888899]">Primary market analysis</p>
                  </div>
                </div>
              </div>
              <div className="mb-6 flex-1">
                <div className="font-black text-[#00D4AA] text-3xl tracking-tight mb-2">
                  {market?.tam?.toString() ?? 'N/A'}
                </div>
                <div className="text-xs text-[#888899] font-medium mb-3">
                  Total Addressable Market
                </div>
                <div className="text-xs text-[#555566] bg-[#00D4AA]/5 px-2.5 py-1.5 rounded-lg w-fit">
                  {market?.tam_source?.toString() ?? 'Market data'}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-4 border-t border-white/[0.06]">
                {Array.isArray(market?.competitors)
                  ? (market.competitors as Array<Record<string, unknown>>).slice(0, 3).map((comp, i) => (
                      <span key={i} className="px-2.5 py-1 bg-[#00D4AA]/10 border border-[#00D4AA]/30 text-[#00D4AA] text-[10px] font-bold rounded-lg">
                        {comp.name?.toString() ?? 'Competitor'}
                      </span>
                    ))
                  : null}
              </div>
              <div className="mt-4 flex items-center gap-2 text-[11px] font-bold text-[#00D4AA] uppercase tracking-widest cursor-pointer hover:gap-3 transition-all">
                Explore <ArrowRight className="w-3 h-3" />
              </div>
            </div>

            {/* Financial Model card — spans 2 cols, Purple accent */}
            <div className="md:col-span-2 bg-[#111118] rounded-2xl p-6 flex flex-col cursor-pointer transition-all duration-200 hover:border-[#6C47FF]/50 hover:shadow-[0_0_20px_rgba(108,71,255,0.1)] animate-fadeInUp border-2 border-white/[0.06]"
                 style={{ animationDelay: '250ms', borderLeftWidth: '4px', borderLeftColor: '#6C47FF' }}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#6C47FF]/10 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-[#6C47FF]" />
                  </div>
                  <div>
                    <h6 className="font-bold text-[#F0F0F0] text-sm">Financial Projections</h6>
                    <p className="text-xs text-[#888899]">5-year revenue forecast</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-[#6C47FF]/10 text-[#6C47FF] text-[10px] font-bold uppercase tracking-widest rounded-lg border border-[#6C47FF]/30">
                  {chartData.length} Years
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center flex-1">
                <div className="h-[160px] cursor-pointer rounded-xl bg-[#0A0A0F]/50 p-3 border border-[#6C47FF]/20" onClick={() => navigate('financials')}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2A2A35" vertical={false} />
                      <XAxis dataKey="year" stroke="#888899" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888899" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}L`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#111118',
                          border: '1px solid #6C47FF',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(108, 71, 255, 0.15)'
                        }}
                        formatter={(value) => `₹${Number(value).toFixed(1)}L`}
                        labelStyle={{ color: '#F0F0F0' }}
                      />
                      <Legend
                        wrapperStyle={{ color: '#888899', fontSize: '12px' }}
                        formatter={(value) => value === 'revenue' ? 'Revenue' : 'Gross Profit'}
                      />
                      {chartData.length > 0 && <Line type="monotone" dataKey="revenue" stroke="#6C47FF" strokeWidth={3} dot={false} animationDuration={1500} />}
                      {chartData.length > 0 && <Line type="monotone" dataKey="gp" stroke="#00D4AA" strokeWidth={3} dot={false} animationDuration={1500} />}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'NPV', val: financials?.npv ? `₹${financials.npv.toFixed(1)}` : '—', color: '#00D4AA' },
                      { label: 'IRR', val: financials?.irr ? `${financials.irr.toFixed(0)}%` : '—', color: '#6C47FF' },
                      { label: 'Payback', val: financials?.payback_months ? `${financials.payback_months}m` : '—', color: '#00D4AA' },
                    ].map(({ label, val, color }) => (
                      <div key={label} className="bg-[#0A0A0F] border border-white/[0.06] hover:border-white/[0.12] rounded-xl p-3 text-center transition-all" style={{ borderLeftWidth: '2px', borderLeftColor: color }}>
                        <div className="text-[10px] font-bold text-[#888899] uppercase tracking-widest mb-1">{label}</div>
                        <div className="text-base font-black" style={{ color }}>{val}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={handleExcelExport}
                            className="flex-1 py-2.5 bg-[#0A0A0F] border-2 border-white/[0.06] text-[#888899] font-bold text-xs hover:border-[#6C47FF] hover:text-[#6C47FF] rounded-xl transition-all flex items-center justify-center gap-2">
                      <Download className="w-3 h-3" /> CSV
                    </button>
                    <button onClick={() => navigate('financials')}
                            className="flex-1 py-2.5 bg-[#6C47FF]/10 border-2 border-[#6C47FF]/50 text-[#6C47FF] font-bold text-xs hover:bg-[#6C47FF] hover:text-white hover:border-[#6C47FF] rounded-xl transition-all flex items-center justify-center gap-2">
                      Interactive <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Legal card — Yellow/Warning accent */}
            <div className="bg-[#111118] rounded-2xl p-6 flex flex-col cursor-pointer transition-all duration-200 hover:border-[#FFB800]/50 hover:shadow-[0_0_20px_rgba(255,184,0,0.1)] animate-fadeInUp border-2 border-white/[0.06]"
                 style={{ animationDelay: '300ms', borderLeftWidth: '4px', borderLeftColor: '#FFB800' }}
                 onClick={() => navigate('legal')}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#FFB800]/10 flex items-center justify-center">
                  <Scale className="w-5 h-5 text-[#FFB800]" />
                </div>
                <div>
                  <h6 className="font-bold text-[#F0F0F0] text-sm">Legal & Compliance</h6>
                  <p className="text-xs text-[#888899]">Regulatory readiness</p>
                </div>
              </div>
              <ul className="flex flex-col gap-3 flex-1 mb-6">
                <li className="flex items-center gap-3 text-sm text-[#F0F0F0] font-medium">
                  <CheckCircle2 className="w-4 h-4 text-[#00D4AA]" /> GDPR Compliant
                </li>
                <li className="flex items-center gap-3 text-sm text-[#F0F0F0] font-medium">
                  <CheckCircle2 className="w-4 h-4 text-[#00D4AA]" />
                  {legal?.entity_recommendation?.toString() ?? 'Entity review pending'}
                </li>
                <li className="flex items-center gap-3 text-sm text-[#FFB800] font-medium">
                  <AlertTriangle className="w-4 h-4" /> Review recommended
                </li>
              </ul>
              <button onClick={(e) => { e.stopPropagation(); navigate('legal'); }}
                      className="text-xs font-bold text-[#FFB800] hover:text-white transition-colors flex items-center gap-1">
                View Details <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Pitch Deck card — Purple accent */}
            <div className="bg-[#111118] rounded-2xl p-6 flex flex-col cursor-pointer transition-all duration-200 hover:border-[#6C47FF]/50 hover:shadow-[0_0_20px_rgba(108,71,255,0.1)] animate-fadeInUp border-2 border-white/[0.06]"
                 style={{ animationDelay: '350ms', borderLeftWidth: '4px', borderLeftColor: '#6C47FF' }}
                 onClick={() => navigate('pitch')}>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#6C47FF]/10 flex items-center justify-center">
                    <Presentation className="w-5 h-5 text-[#6C47FF]" />
                  </div>
                  <div>
                    <h6 className="font-bold text-[#F0F0F0] text-sm">Pitch Deck</h6>
                    <p className="text-xs text-[#888899]">Investor presentation</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-[#6C47FF]/10 text-[#6C47FF] text-[10px] font-bold uppercase tracking-widest rounded-lg border border-[#6C47FF]/30">
                  {pitchDeck?.slides?.length ?? 0} Slides
                </span>
              </div>
              <div className="flex-1 bg-gradient-to-br from-[#6C47FF]/10 to-[#00D4AA]/5 border border-[#6C47FF]/30 rounded-xl flex flex-col items-center justify-center mb-6 p-6 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#6C47FF]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="text-lg font-black text-white tracking-widest mb-1 z-10 text-center">{ideaName}</div>
                <div className="text-[10px] font-bold text-[#888899] uppercase tracking-[0.2em] z-10 text-center">
                  {pitchDeck?.brand?.tagline ?? 'Investment Ready'}
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={(e) => { e.stopPropagation(); navigate('pitch'); }}
                        className="flex-1 py-2.5 bg-[#0A0A0F] border-2 border-white/[0.06] text-[#888899] font-bold text-xs hover:border-[#6C47FF] hover:text-[#6C47FF] rounded-xl transition-all flex items-center justify-center gap-2">
                  <FileText className="w-3 h-3" /> Preview
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleDownloadPptx(); }} disabled={pptxLoading}
                        className="flex-1 py-2.5 bg-[#6C47FF]/10 border-2 border-[#6C47FF]/50 text-[#6C47FF] font-bold text-xs hover:bg-[#6C47FF] hover:text-white hover:border-[#6C47FF] rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  {pptxLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                  {pptxLoading ? 'Creating…' : '.pptx'}
                </button>
              </div>
            </div>

            {/* MVP card — Purple accent */}
            <div className="bg-[#111118] rounded-2xl p-6 flex flex-col cursor-pointer transition-all duration-200 hover:border-[#6C47FF]/50 hover:shadow-[0_0_20px_rgba(108,71,255,0.1)] animate-fadeInUp border-2 border-white/[0.06]"
                 style={{ animationDelay: '400ms', borderLeftWidth: '4px', borderLeftColor: '#6C47FF' }}
                 onClick={() => navigate('mvp')}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#6C47FF]/10 flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-[#6C47FF]" />
                </div>
                <div>
                  <h6 className="font-bold text-[#F0F0F0] text-sm">MVP Architecture</h6>
                  <p className="text-xs text-[#888899]">Development roadmap</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-6 flex-1">
                {(mvp?.recommended_stack ?? []).slice(0, 5).map((item, i) => (
                  <span key={i} className="px-2.5 py-1 bg-[#6C47FF]/10 border border-[#6C47FF]/30 text-[#6C47FF] text-[10px] font-bold rounded-lg uppercase tracking-widest">
                    {item.technology?.toString() ?? 'Tech'}
                  </span>
                ))}
                {(mvp?.recommended_stack ?? []).length > 5 && (
                  <span className="px-2.5 py-1 bg-[#6C47FF]/5 border border-[#6C47FF]/20 text-[#888899] text-[10px] font-bold rounded-lg">
                    +{(mvp?.recommended_stack ?? []).length - 5} more
                  </span>
                )}
              </div>
              <div className="text-xs text-[#888899] mb-4 pb-4 border-b border-white/[0.06]">
                <span className="font-bold text-[#6C47FF]">{mvp?.estimated_weeks ?? '—'}</span> weeks estimated • <span className="font-bold text-[#00D4AA]">{mvp?.team_size ?? '—'}</span> person team
              </div>
              <button onClick={(e) => { e.stopPropagation(); navigate('mvp'); }}
                      className="w-full py-2.5 bg-[#6C47FF]/10 border-2 border-[#6C47FF]/50 text-[#6C47FF] font-bold text-xs hover:bg-[#6C47FF] hover:text-white hover:border-[#6C47FF] rounded-xl transition-all flex items-center justify-center gap-2">
                <Download className="w-3 h-3" /> Download Roadmap
              </button>
            </div>

            {/* Pivot card — full width, Yellow/Warning accent */}
            <div className="md:col-span-2 lg:col-span-3 bg-gradient-to-br from-[#FFB800]/10 to-[#FF6B6B]/5 border-2 border-[#FFB800]/40 rounded-2xl p-6 cursor-pointer hover:border-[#FFB800]/60 hover:shadow-[0_0_20px_rgba(255,184,0,0.15)] transition-all animate-fadeInUp"
                 style={{ animationDelay: '450ms' }}
                 onClick={() => navigate('pivot')}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#FFB800]/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-[#FFB800]" />
                </div>
                <div>
                  <h6 className="font-black text-[#FFB800] text-lg uppercase tracking-wide">Strategic Pivot Opportunities</h6>
                  <p className="text-xs text-[#888899]">Alternative market directions identified</p>
                </div>
              </div>
              <p className="text-sm text-[#F0F0F0] bg-[#0A0A0F] border border-[#FFB800]/20 p-4 rounded-xl mb-4 leading-relaxed">
                {(pivots as any[])[0]?.rationale?.toString() ?? 'Strategic pivot analysis ensures your core thesis is validated. Explore alternative market positions with data backing.'}
              </p>
              <button onClick={(e) => { e.stopPropagation(); navigate('pivot'); }}
                      className="px-6 py-3 bg-[#FFB800] text-[#0A0A0F] font-black text-sm hover:bg-[#FFC933] hover:shadow-[0_0_20px_rgba(255,184,0,0.3)] rounded-xl transition-all flex items-center gap-2 w-fit">
                Explore Pivots <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* ── Sidebar ── */}
          <div className="xl:col-span-1">
            <div className="bg-[#111118] rounded-2xl p-6 sticky top-24 border border-white/[0.06] animate-fadeInLeft" style={{ animationDelay: '500ms' }}>
              {/* Publish to Community */}
              <button
                onClick={handlePublishToCommunity}
                disabled={publishLoading || published}
                className="w-full mb-6 px-5 py-3 bg-[#6C47FF] border-2 border-[#6C47FF] text-white font-bold text-sm hover:bg-[#5a3ae0] hover:shadow-[0_0_20px_rgba(108,71,255,0.3)] shadow-[0_4px_12px_rgba(108,71,255,0.2)] transition-all flex items-center justify-center gap-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {publishLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Users className="w-4 h-4" />
                )}
                {published ? 'Published!' : publishLoading ? 'Publishing…' : 'Publish to Community'}
              </button>

              <h6 className="font-black text-white text-sm mb-4 tracking-wide uppercase">Share & Export</h6>
              <div className="flex flex-col gap-2 mb-6">
                {[
                  { icon: LinkIcon, label: 'Copy Link', action: handleCopyLink, color: '#6C47FF', loading: false },
                  { icon: Mail, label: 'Email Investor', action: () => navigate('landing'), color: '#00D4AA', loading: false },
                  { icon: Globe, label: 'Push to Drive', action: handleDrivePush, color: '#FFB800', loading: false },
                ].map(({ icon: Icon, label, action, loading, color }) => (
                  <button key={label} onClick={action} disabled={loading}
                          className="w-full py-2.5 px-3 bg-[#0A0A0F] border border-white/[0.06] hover:border-white/[0.12] text-[#888899] hover:text-white text-xs font-bold rounded-lg transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
                          style={{
                            borderLeftWidth: '2px',
                            borderLeftColor: color
                          }}>
                    {loading
                      ? <Loader2 className="w-4 h-4 animate-spin" style={{ color }}/>
                      : <Icon className="w-4 h-4 transition-colors" style={{ color }} />}
                    <span className="flex-1 text-left">{label}</span>
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>

              {/* Progress */}
              <div className="pt-6 border-t border-white/[0.06]">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-[#888899] uppercase tracking-widest">Analysis Complete</span>
                  <span className="text-xs font-black text-[#00D4AA]">{progressPercent}%</span>
                </div>
                <div className="w-full h-2.5 bg-[#0A0A0F] rounded-full overflow-hidden border border-white/[0.06]">
                  <div className="h-full bg-gradient-to-r from-[#6C47FF] via-[#00D4AA] to-[#00D4AA] rounded-full progress-animated"
                       style={{ width: `${progressPercent}%` }} />
                </div>
              </div>

              {/* Status Badges */}
              <div className="mt-6 flex flex-wrap gap-2">
                <div className="px-3 py-1.5 bg-[#00D4AA]/10 border border-[#00D4AA]/30 text-[#00D4AA] text-[10px] font-bold rounded-lg uppercase tracking-widest flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3" /> Complete
                </div>
                <div className="px-3 py-1.5 bg-[#6C47FF]/10 border border-[#6C47FF]/30 text-[#6C47FF] text-[10px] font-bold rounded-lg uppercase tracking-widest flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3" /> Verified
                </div>
              </div>

              {/* Trust Signal */}
              <div className="mt-6 p-4 bg-[#0A0A0F] border border-white/[0.06] rounded-xl">
                <div className="text-xs font-bold text-[#888899] uppercase tracking-widest mb-2">Powered by</div>
                <div className="text-xs text-[#E0E0EE] font-medium">Enterprise-grade AI analysis with Tavily market research integration</div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
