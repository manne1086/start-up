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
} from 'lucide-react';
import JSZip from 'jszip';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import GlobalNavbar from './GlobalNavbar';
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
  const market = backendState?.market as Record<string, unknown> | null | undefined;
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
    <div className="min-h-screen bg-[#0A0A0F] text-[#F0F0F0] flex flex-col font-sans pb-12">
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
      <div className="w-full bg-[#111118] border-b border-[#1E1E28] py-3 px-6 flex items-center gap-6 overflow-x-auto custom-scrollbar shrink-0 animate-fadeInDown">
        {statusItems.map(([label, value], i) => (
          <div key={String(label)} className="flex items-center gap-2 shrink-0 animate-fadeInLeft" style={{ animationDelay: `${i * 100}ms` }}>
            <CheckCircle2 className={`w-4 h-4 ${value ? 'text-[#00D4AA]' : 'text-[#888899]'}`} />
            <span className="text-xs font-semibold text-[#888899] uppercase tracking-wider">{label}</span>
          </div>
        ))}
      </div>

      <main className="flex-1 w-full max-w-[1400px] mx-auto px-6 py-8">

        {/* Back button */}
        <button onClick={() => navigate('projects')}
                className="flex items-center gap-2 mb-8 text-xs font-bold text-[#888899] uppercase tracking-widest hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Projects
        </button>

        {/* ── Hero Banner ── */}
        <div className="w-full bg-[#00D4AA]/10 border-2 border-[#00D4AA]/50 rounded-2xl p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 animate-fadeInUp shadow-[0_0_30px_rgba(0,212,170,0.15)]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#00D4AA]/20 rounded-full flex items-center justify-center shrink-0 border border-[#00D4AA]/30">
              <CheckCircle2 className="w-6 h-6 text-[#00D4AA]" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight mb-1">
                {ideaName} — Startup Package Complete
              </h2>
              <p className="text-sm text-[#00D4AA] font-semibold">Ready for investor review and execution.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleShare}
                    className="px-5 py-2.5 rounded-xl border-2 border-white/20 text-white font-bold text-sm hover:bg-white/10 transition-colors flex items-center gap-2">
              <Share2 className="w-4 h-4" /> Share
            </button>
            <button onClick={handleDownloadZip}
                    className="px-5 py-2.5 rounded-xl bg-[#6C47FF] border-2 border-[#6C47FF] text-white font-bold text-sm hover:bg-[#5a3ae0] hover:border-[#5a3ae0] transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(108,71,255,0.3)]">
              <Download className="w-4 h-4" /> Download All (.zip)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* ── Main grid ── */}
          <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* Market Research card */}
            <div className="bg-[#111118] rounded-2xl p-6 flex flex-col cursor-pointer card-hover animate-fadeInUp border-2 border-transparent hover:border-[#6C47FF]/50"
                 style={{ animationDelay: '100ms' }}
                 onClick={() => navigate('market')}>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-[#888899]" />
                  </div>
                  <h6 className="font-bold text-[#F0F0F0] text-sm">Market Research</h6>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-[#6C47FF] uppercase tracking-widest bg-[#6C47FF]/10 px-2 py-1 rounded-full">
                  View <ArrowRight className="w-3 h-3" />
                </div>
              </div>
              <div className="mb-6 flex-1">
                <div className="font-black text-[#00D4AA] text-3xl tracking-tight mb-2">
                  {market?.tam?.toString() ?? 'No data'}
                </div>
                <div className="text-xs text-[#888899] font-medium">
                  {market?.tam_source?.toString() ?? 'Backend market intelligence'}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(market?.competitors)
                  ? (market.competitors as Array<Record<string, unknown>>).slice(0, 3).map((comp, i) => (
                      <span key={i} className="px-2 py-1 bg-[#0A0A0F] border border-[#6C47FF]/30 text-[#888899] text-[10px] font-bold rounded-md">
                        {comp.name?.toString() ?? 'Competitor'}
                      </span>
                    ))
                  : null}
              </div>
            </div>

            {/* Financial Model card — spans 2 cols */}
            <div className="md:col-span-2 bg-[#111118] rounded-2xl p-6 flex flex-col cursor-pointer card-hover animate-fadeInUp border-2 border-transparent hover:border-[#00D4AA]/50"
                 style={{ animationDelay: '150ms' }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                  <PieChart className="w-5 h-5 text-[#888899]" />
                </div>
                <h6 className="font-bold text-[#F0F0F0] text-sm">Financial Model</h6>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center flex-1">
                <div className="h-[140px] cursor-pointer" onClick={() => navigate('financials')}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2A2A35" vertical={false} />
                      <XAxis dataKey="year" stroke="#888899" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888899" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}L`} />
                      {chartData.length > 0 && <Line type="monotone" dataKey="revenue" stroke="#6C47FF" strokeWidth={3} dot={false} animationDuration={1500} />}
                      {chartData.length > 0 && <Line type="monotone" dataKey="gp" stroke="#00D4AA" strokeWidth={3} dot={false} animationDuration={1500} />}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'NPV', val: financials?.npv ? `₹${financials.npv.toFixed(1)}` : '…' },
                      { label: 'IRR', val: financials?.irr ? `${financials.irr.toFixed(0)}%` : '…' },
                      { label: 'Payback', val: financials?.payback_months ? `${financials.payback_months}m` : '…' },
                    ].map(({ label, val }) => (
                      <div key={label} className="bg-[#0A0A0F] border border-[#1E1E28] rounded-xl p-3 text-center">
                        <div className="text-[10px] font-bold text-[#888899] uppercase tracking-widest mb-1">{label}</div>
                        <div className="text-base font-black text-[#00D4AA]">{val}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={handleExcelExport}
                            className="flex-1 py-2 bg-transparent border-2 border-[#1E1E28] text-[#888899] font-bold text-xs hover:border-[#00D4AA] hover:text-[#00D4AA] rounded-xl transition-colors flex items-center justify-center gap-2">
                      <Download className="w-3 h-3" /> Excel
                    </button>
                    <button onClick={() => navigate('financials')}
                            className="flex-1 py-2 bg-[#6C47FF]/10 border-2 border-[#6C47FF]/30 text-[#6C47FF] font-bold text-xs hover:bg-[#6C47FF] hover:text-white rounded-xl transition-colors flex items-center justify-center gap-2">
                      Interactive <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Legal card */}
            <div className="bg-[#111118] rounded-2xl p-6 flex flex-col cursor-pointer card-hover animate-fadeInUp border-2 border-transparent hover:border-[#6C47FF]/50"
                 style={{ animationDelay: '200ms' }}
                 onClick={() => navigate('legal')}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                  <Scale className="w-5 h-5 text-[#888899]" />
                </div>
                <h6 className="font-bold text-[#F0F0F0] text-sm">Legal & Compliance</h6>
              </div>
              <ul className="flex flex-col gap-3 flex-1 mb-6">
                <li className="flex items-center gap-3 text-sm text-[#F0F0F0] font-medium">
                  <CheckCircle2 className="w-4 h-4 text-[#00D4AA]" /> GDPR Safe
                </li>
                <li className="flex items-center gap-3 text-sm text-[#F0F0F0] font-medium">
                  <CheckCircle2 className="w-4 h-4 text-[#00D4AA]" />
                  {legal?.entity_recommendation?.toString() ?? 'Entity pending'}
                </li>
                <li className="flex items-center gap-3 text-sm text-amber-500 font-medium">
                  <AlertTriangle className="w-4 h-4" /> Review items in report
                </li>
              </ul>
              <button onClick={(e) => { e.stopPropagation(); navigate('legal'); }}
                      className="text-xs font-bold text-[#6C47FF] hover:text-white transition-colors flex items-center gap-1">
                Download NDA <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Pitch Deck card */}
            <div className="bg-[#111118] rounded-2xl p-6 flex flex-col cursor-pointer card-hover animate-fadeInUp border-2 border-transparent hover:border-[#6C47FF]/50"
                 style={{ animationDelay: '250ms' }}
                 onClick={() => navigate('pitch')}>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                    <Presentation className="w-5 h-5 text-[#888899]" />
                  </div>
                  <h6 className="font-bold text-[#F0F0F0] text-sm">Pitch Deck</h6>
                </div>
                <span className="px-2 py-1 bg-[#6C47FF]/10 text-[#6C47FF] text-[10px] font-bold uppercase tracking-widest rounded-md">
                  {pitchDeck?.slides?.length ?? 0} Slides
                </span>
              </div>
              <div className="flex-1 bg-[#0A0A0F] border border-[#1E1E28] rounded-xl flex flex-col items-center justify-center mb-6 p-6 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#6C47FF]/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
                <div className="text-lg font-black text-white tracking-widest mb-1 z-10 text-center">{ideaName}</div>
                <div className="text-[10px] font-bold text-[#888899] uppercase tracking-[0.2em] z-10 text-center">
                  {pitchDeck?.brand?.tagline ?? 'Pitch Deck'}
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={(e) => { e.stopPropagation(); navigate('pitch'); }}
                        className="flex-1 py-2.5 bg-transparent border-2 border-[#1E1E28] text-[#888899] font-bold text-xs hover:border-[#00D4AA] hover:text-[#00D4AA] rounded-xl transition-colors flex items-center justify-center gap-2">
                  <FileText className="w-3 h-3" /> View
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleDownloadPptx(); }} disabled={pptxLoading}
                        className="flex-1 py-2.5 bg-[#6C47FF]/10 border-2 border-[#6C47FF]/30 text-[#6C47FF] font-bold text-xs hover:bg-[#6C47FF] hover:text-white rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  {pptxLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                  {pptxLoading ? 'Generating…' : '.pptx'}
                </button>
              </div>
            </div>

            {/* MVP card */}
            <div className="bg-[#111118] rounded-2xl p-6 flex flex-col cursor-pointer card-hover animate-fadeInUp border-2 border-transparent hover:border-[#6C47FF]/50"
                 style={{ animationDelay: '300ms' }}
                 onClick={() => navigate('mvp')}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-[#888899]" />
                </div>
                <h6 className="font-bold text-[#F0F0F0] text-sm">MVP Architecture</h6>
              </div>
              <div className="flex flex-wrap gap-2 mb-6 flex-1">
                {(mvp?.recommended_stack ?? []).slice(0, 5).map((item, i) => (
                  <span key={i} className="px-2 py-1 bg-[#0A0A0F] border border-[#1E1E28] text-[#888899] text-[10px] font-bold uppercase tracking-widest rounded-md">
                    {item.technology?.toString() ?? 'Tech'}
                  </span>
                ))}
              </div>
              <div className="flex flex-col gap-3">
                <button onClick={(e) => { e.stopPropagation(); navigate('mvp'); }}
                        className="text-xs font-bold text-[#6C47FF] hover:text-white transition-colors flex items-center gap-1">
                  View Architecture <ArrowRight className="w-3 h-3" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); navigate('mvp'); }}
                        className="w-full py-2.5 bg-transparent border-2 border-[#1E1E28] text-[#888899] font-bold text-xs hover:border-[#00D4AA] hover:text-[#00D4AA] rounded-xl transition-colors flex items-center justify-center gap-2">
                  <Download className="w-3 h-3" /> Download Roadmap
                </button>
              </div>
            </div>

            {/* Pivot card — full width */}
            <div className="md:col-span-2 lg:col-span-3 bg-amber-500/5 border-2 border-amber-500/30 rounded-2xl p-6 cursor-pointer hover:bg-amber-500/10 hover:border-amber-500/50 transition-colors animate-fadeInUp shadow-[0_0_20px_rgba(234,179,8,0.1)] hover:shadow-[0_0_30px_rgba(234,179,8,0.2)]"
                 style={{ animationDelay: '350ms' }}
                 onClick={() => navigate('pivot')}>
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
                <h6 className="font-black text-amber-500 text-lg uppercase tracking-wide">Pivot Opportunity Found</h6>
              </div>
              <p className="text-sm text-[#F0F0F0] bg-[#0A0A0F] border border-amber-500/20 p-4 rounded-xl mb-4 leading-relaxed">
                {(pivots as any[])[0]?.rationale?.toString() ?? 'Pivot options are being generated from the backend run. Adversarial analysis ensures your strategy holds up.'}
              </p>
              <button onClick={(e) => { e.stopPropagation(); navigate('pivot'); }}
                      className="px-6 py-3 bg-amber-500 text-[#0A0A0F] font-black text-sm hover:bg-amber-400 rounded-xl transition-colors flex items-center gap-2 w-fit">
                Run Full Pivot Analysis <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* ── Sidebar ── */}
          <div className="xl:col-span-1">
            <div className="bg-[#111118] rounded-2xl p-6 sticky top-24 border-2 border-[#1E1E28] animate-fadeInLeft" style={{ animationDelay: '400ms' }}>
              {/* Publish to Community */}
              <button
                onClick={handlePublishToCommunity}
                disabled={publishLoading || published}
                className="w-full mb-6 px-5 py-2.5 bg-[#6C47FF] border-2 border-[#6C47FF] text-white font-bold text-sm hover:bg-[#111118] hover:text-[#6C47FF] shadow-[4px_4px_0px_#00D4AA] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {publishLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Users className="w-4 h-4" />
                )}
                {published ? 'Published!' : publishLoading ? 'Publishing…' : 'Publish to Community'}
              </button>

              <h6 className="font-black text-white text-base mb-6 tracking-wide">Share this package</h6>
              <div className="flex flex-col gap-3">
                {[
                  { icon: LinkIcon, label: 'Copy Link', action: handleCopyLink },
                  { icon: Mail, label: 'Email Investor', action: () => navigate('landing') },
                  { icon: Globe, label: 'Push to Drive', action: handleDrivePush },
                  { icon: FileArchive, label: pdfLoading ? 'Generating PDF…' : 'Export PDF', action: handleExportPdf, loading: pdfLoading },
                ].map(({ icon: Icon, label, action, loading }) => (
                  <button key={label} onClick={action} disabled={loading}
                          className="w-full py-3 px-4 bg-[#0A0A0F] border border-[#1E1E28] hover:border-[#6C47FF]/50 text-[#888899] hover:text-white text-sm font-bold rounded-xl transition-colors flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group">
                    {loading
                      ? <Loader2 className="w-4 h-4 animate-spin text-[#6C47FF]" />
                      : <Icon className="w-4 h-4 group-hover:text-[#6C47FF] transition-colors" />}
                    {label}
                  </button>
                ))}
              </div>

              {/* Progress */}
              <div className="mt-8 pt-8 border-t border-[#1E1E28]">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-[#888899] uppercase tracking-widest">Completion</span>
                  <span className="text-xs font-black text-[#00D4AA]">{progressPercent}%</span>
                </div>
                <div className="w-full h-2 bg-[#0A0A0F] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#6C47FF] to-[#00D4AA] rounded-full progress-animated"
                       style={{ width: `${progressPercent}%` }} />
                </div>
              </div>

              {/* Quick tips */}
              <div className="mt-8 bg-[#0A0A0F] border border-[#1E1E28] rounded-xl overflow-hidden group">
                <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors">
                  <div className="text-xs font-bold text-[#888899] uppercase tracking-widest flex items-center gap-2">
                    <span className="text-lg leading-none">💡</span> Next Steps
                  </div>
                </div>
                <div className="px-4 pb-4 border-t border-white/5 pt-3">
                  <ul className="text-xs font-medium text-[#888899] flex flex-col gap-2 pl-4 list-disc marker:text-[#6C47FF]">
                    <li>Export PDF for investor meetings</li>
                    <li>Download .pptx pitch deck</li>
                    <li>Review legal compliance items</li>
                    <li>Run pivot simulation if needed</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
