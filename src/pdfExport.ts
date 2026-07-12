/**
 * pdfExport.ts — VentureForge PDF generation
 *
 * Uses jsPDF (loaded from CDN via window.jspdf) to build a
 * structured multi-section PDF without needing html2canvas or print().
 *
 * CDN import: add to index.html (already handled via dynamic load below).
 */

type BackendState = Record<string, any> | null | undefined;

const BRAND = {
  violet: [108, 71, 255] as [number, number, number],
  aqua: [0, 212, 170] as [number, number, number],
  dark: [17, 17, 24] as [number, number, number],
  bg: [10, 10, 15] as [number, number, number],
  text: [240, 240, 240] as [number, number, number],
  muted: [136, 136, 153] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  amber: [251, 191, 36] as [number, number, number],
};

async function loadJsPDF(): Promise<any> {
  // If already loaded from CDN
  if ((window as any).jspdf) return (window as any).jspdf.jsPDF;

  // Dynamically inject jsPDF CDN script
  await new Promise<void>((resolve, reject) => {
    if (document.getElementById('jspdf-cdn')) return resolve();
    const script = document.createElement('script');
    script.id = 'jspdf-cdn';
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load jsPDF'));
    document.head.appendChild(script);
  });

  return (window as any).jspdf.jsPDF;
}

function safeStr(val: unknown): string {
  if (val === null || val === undefined) return 'N/A';
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  return JSON.stringify(val);
}

export async function exportStartupPdf(backendState: BackendState, ideaName: string): Promise<void> {
  const JsPDF = await loadJsPDF();
  const doc = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const W = 210; // A4 width mm
  const H = 297; // A4 height mm
  const margin = 16;
  const contentW = W - margin * 2;
  let y = 0;

  // ── helpers ──────────────────────────────────────────────────────────────
  const newPage = () => {
    doc.addPage();
    y = margin;
  };

  const checkY = (needed: number) => {
    if (y + needed > H - margin) newPage();
  };

  const setColor = (rgb: [number, number, number]) =>
    doc.setTextColor(rgb[0], rgb[1], rgb[2]);

  const setFill = (rgb: [number, number, number]) =>
    doc.setFillColor(rgb[0], rgb[1], rgb[2]);

  const setDraw = (rgb: [number, number, number]) =>
    doc.setDrawColor(rgb[0], rgb[1], rgb[2]);

  const text = (
    str: string,
    x: number,
    yPos: number,
    opts?: { align?: 'left' | 'center' | 'right'; maxWidth?: number }
  ) => doc.text(str, x, yPos, opts as any);

  const sectionHeader = (title: string) => {
    checkY(14);
    setFill(BRAND.violet);
    doc.roundedRect(margin, y, contentW, 10, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    setColor(BRAND.white);
    text(title.toUpperCase(), margin + 4, y + 6.8);
    y += 14;
  };

  const kv = (label: string, value: string, indent = 0) => {
    checkY(7);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    setColor(BRAND.muted);
    text(label, margin + indent, y);
    doc.setFont('helvetica', 'normal');
    setColor(BRAND.text);
    text(value, margin + indent + 38, y);
    y += 6;
  };

  const bullet = (str: string, indent = 0) => {
    checkY(6);
    setColor(BRAND.aqua);
    text('▸', margin + indent, y);
    setColor(BRAND.text);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const lines = doc.splitTextToSize(str, contentW - indent - 6) as string[];
    text(lines.join('\n'), margin + indent + 5, y);
    y += lines.length * 5 + 1;
  };

  const divider = () => {
    checkY(4);
    setDraw(BRAND.dark);
    doc.setLineWidth(0.4);
    doc.line(margin, y, W - margin, y);
    y += 5;
  };

  // ── COVER PAGE ────────────────────────────────────────────────────────────
  setFill(BRAND.bg);
  doc.rect(0, 0, W, H, 'F');

  // Accent bar top
  setFill(BRAND.violet);
  doc.rect(0, 0, W, 4, 'F');

  // Logo area
  y = 28;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  setColor(BRAND.violet);
  text('VENTUREFORGE', W / 2, y, { align: 'center' });
  y += 7;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  setColor(BRAND.white);
  const nameLines = doc.splitTextToSize(ideaName, contentW) as string[];
  text(nameLines.join('\n'), W / 2, y + 8, { align: 'center' });
  y += nameLines.length * 14 + 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  setColor(BRAND.aqua);
  text('AI-Generated Startup Package', W / 2, y, { align: 'center' });
  y += 8;

  const tagline = safeStr(backendState?.pitch_deck?.brand?.tagline);
  if (tagline !== 'N/A') {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    setColor(BRAND.muted);
    text(`"${tagline}"`, W / 2, y, { align: 'center' });
    y += 8;
  }

  // Divider
  y += 4;
  setDraw(BRAND.violet);
  doc.setLineWidth(0.8);
  doc.line(margin + 30, y, W - margin - 30, y);
  y += 10;

  // Summary stats boxes
  const stats = [
    { label: 'Market TAM', value: safeStr(backendState?.market?.tam) },
    { label: 'NPV', value: backendState?.financials?.npv ? `₹${Number(backendState.financials.npv).toFixed(1)}` : 'Pending' },
    { label: 'IRR', value: backendState?.financials?.irr ? `${Number(backendState.financials.irr).toFixed(0)}%` : 'Pending' },
    { label: 'Build Cost', value: safeStr(backendState?.mvp?.estimated_cost_inr) },
  ];
  const boxW = (contentW - 9) / 4;
  stats.forEach((stat, i) => {
    const bx = margin + i * (boxW + 3);
    setFill(BRAND.dark);
    doc.roundedRect(bx, y, boxW, 18, 2, 2, 'F');
    setDraw(BRAND.violet);
    doc.setLineWidth(0.5);
    doc.roundedRect(bx, y, boxW, 18, 2, 2, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    setColor(BRAND.muted);
    text(stat.label.toUpperCase(), bx + boxW / 2, y + 5.5, { align: 'center' });
    doc.setFontSize(11);
    setColor(BRAND.aqua);
    text(stat.value.slice(0, 18), bx + boxW / 2, y + 13, { align: 'center' });
  });
  y += 26;

  // Date & generation note
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  setColor(BRAND.muted);
  text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, W / 2, y, { align: 'center' });
  y += 5;
  text('Powered by VentureForge AI  ·  ventureforge.ai', W / 2, y, { align: 'center' });

  // Accent bar bottom
  setFill(BRAND.aqua);
  doc.rect(0, H - 4, W, 4, 'F');

  // ── PAGE 2 — MARKET RESEARCH ─────────────────────────────────────────────
  newPage();
  sectionHeader('01  Market Research');

  const market = backendState?.market as Record<string, any> | null | undefined;
  kv('TAM', safeStr(market?.tam));
  kv('SAM', safeStr(market?.sam));
  kv('SOM', safeStr(market?.som));
  kv('Source', safeStr(market?.tam_source));
  divider();

  if (Array.isArray(market?.market_gaps) && market.market_gaps.length) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    setColor(BRAND.aqua);
    text('Market Gaps', margin, y);
    y += 6;
    market.market_gaps.slice(0, 6).forEach((g: unknown) => bullet(safeStr(g)));
    divider();
  }

  if (Array.isArray(market?.competitors) && market.competitors.length) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    setColor(BRAND.aqua);
    text('Competitors', margin, y);
    y += 6;

    const cols = ['Name', 'Funding', 'Threat', 'Pricing'];
    const colW = [50, 38, 28, contentW - 116];
    const colX = [margin, margin + 50, margin + 88, margin + 116];

    setFill(BRAND.dark);
    doc.rect(margin, y, contentW, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    setColor(BRAND.muted);
    cols.forEach((col, i) => text(col, colX[i] + 2, y + 5));
    y += 8;

    (market.competitors as any[]).slice(0, 6).forEach((comp: any, ri: number) => {
      checkY(8);
      if (ri % 2 === 0) {
        setFill([20, 20, 28]);
        doc.rect(margin, y - 1, contentW, 7, 'F');
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      setColor(BRAND.text);
      text(safeStr(comp.name).slice(0, 22), colX[0] + 2, y + 4.5);
      text(safeStr(comp.funding).slice(0, 14), colX[1] + 2, y + 4.5);
      const threat = safeStr(comp.threat);
      const threatColor = threat === 'High' ? BRAND.amber : threat === 'Medium' ? BRAND.violet : BRAND.aqua;
      setColor(threatColor);
      text(threat, colX[2] + 2, y + 4.5);
      setColor(BRAND.muted);
      text(safeStr(comp.pricing).slice(0, 24), colX[3] + 2, y + 4.5);
      y += 7;
    });
  }

  // ── PAGE 3 — FINANCIALS ───────────────────────────────────────────────────
  newPage();
  sectionHeader('02  Financial Model');

  const fin = backendState?.financials as Record<string, any> | null | undefined;
  kv('NPV', fin?.npv ? `₹${Number(fin.npv).toFixed(2)}` : 'N/A');
  kv('IRR', fin?.irr ? `${Number(fin.irr).toFixed(1)}%` : 'N/A');
  kv('Payback Period', fin?.payback_months ? `${fin.payback_months} months` : 'N/A');
  divider();

  if (Array.isArray(fin?.projections) && fin.projections.length) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    setColor(BRAND.aqua);
    text('5-Year Projections (₹)', margin, y);
    y += 7;

    const projCols = ['Year', 'Revenue', 'COGS', 'Gross Profit', 'EBITDA', 'FCF'];
    const projColX = [margin, margin + 22, margin + 52, margin + 82, margin + 122, margin + 158];

    setFill(BRAND.dark);
    doc.rect(margin, y, contentW, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    setColor(BRAND.muted);
    projCols.forEach((col, i) => text(col, projColX[i] + 1, y + 5));
    y += 8;

    fin.projections.slice(0, 5).forEach((row: any, ri: number) => {
      checkY(8);
      if (ri % 2 === 0) {
        setFill([20, 20, 28]);
        doc.rect(margin, y - 1, contentW, 7, 'F');
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      setColor(BRAND.text);
      const fmt = (v: unknown) => {
        const n = Number(v ?? 0);
        if (Math.abs(n) >= 1e7) return `₹${(n / 1e7).toFixed(1)}Cr`;
        if (Math.abs(n) >= 1e5) return `₹${(n / 1e5).toFixed(1)}L`;
        return `₹${n.toLocaleString('en-IN')}`;
      };
      text(safeStr(row.year), projColX[0] + 1, y + 4.5);
      text(fmt(row.revenue), projColX[1] + 1, y + 4.5);
      text(fmt(row.cogs), projColX[2] + 1, y + 4.5);
      text(fmt(row.gross_profit ?? row.gp), projColX[3] + 1, y + 4.5);
      const ebitda = Number(row.ebitda ?? 0);
      setColor(ebitda >= 0 ? BRAND.aqua : BRAND.amber);
      text(fmt(row.ebitda), projColX[4] + 1, y + 4.5);
      const fcf = Number(row.fcf ?? 0);
      setColor(fcf >= 0 ? BRAND.aqua : BRAND.amber);
      text(fmt(row.fcf), projColX[5] + 1, y + 4.5);
      y += 7;
    });
  }

  // ── PAGE 4 — LEGAL ────────────────────────────────────────────────────────
  newPage();
  sectionHeader('03  Legal & Compliance');

  const legal = backendState?.legal as Record<string, any> | null | undefined;
  kv('Entity Type', safeStr(legal?.entity_recommendation));
  kv('Jurisdiction', safeStr(legal?.jurisdiction));
  divider();

  if (Array.isArray(legal?.compliance_checklist) && legal.compliance_checklist.length) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    setColor(BRAND.aqua);
    text('Compliance Checklist', margin, y);
    y += 6;
    legal.compliance_checklist.slice(0, 8).forEach((item: unknown) => bullet(safeStr(item)));
    divider();
  }

  if (Array.isArray(legal?.risks) && legal.risks.length) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    setColor(BRAND.amber);
    text('Legal Risks', margin, y);
    y += 6;
    legal.risks.slice(0, 5).forEach((r: unknown) => bullet(safeStr(r)));
  }

  // ── PAGE 5 — MVP ARCHITECTURE ─────────────────────────────────────────────
  newPage();
  sectionHeader('04  MVP Architecture');

  const mvp = backendState?.mvp as Record<string, any> | null | undefined;
  kv('Est. Duration', safeStr(mvp?.estimated_weeks) + ' weeks');
  kv('Team Size', safeStr(mvp?.team_size) + ' engineers');
  kv('Est. Cost', safeStr(mvp?.estimated_cost_inr));
  divider();

  if (Array.isArray(mvp?.recommended_stack) && mvp.recommended_stack.length) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    setColor(BRAND.aqua);
    text('Recommended Tech Stack', margin, y);
    y += 7;

    (mvp.recommended_stack as any[]).slice(0, 8).forEach((item: any) => {
      checkY(12);
      setFill(BRAND.dark);
      doc.roundedRect(margin, y, contentW, 10, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      setColor(BRAND.violet);
      text(safeStr(item.layer).toUpperCase(), margin + 3, y + 6.8);
      setColor(BRAND.aqua);
      text(safeStr(item.technology), margin + 42, y + 6.8);
      doc.setFont('helvetica', 'normal');
      setColor(BRAND.muted);
      const reasonLines = doc.splitTextToSize(safeStr(item.reason), contentW - 120) as string[];
      text(reasonLines[0] ?? '', margin + 112, y + 6.8);
      y += 12;
    });
  }

  // ── PAGE 6 — PITCH DECK OUTLINE ───────────────────────────────────────────
  newPage();
  sectionHeader('05  Pitch Deck Outline');

  const pitch = backendState?.pitch_deck as Record<string, any> | null | undefined;
  if (pitch?.brand?.tagline) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    setColor(BRAND.aqua);
    text(`"${safeStr(pitch.brand.tagline)}"`, W / 2, y, { align: 'center' });
    y += 9;
  }
  divider();

  if (Array.isArray(pitch?.slides) && pitch.slides.length) {
    pitch.slides.slice(0, 12).forEach((slide: any, i: number) => {
      checkY(14);
      setFill(BRAND.dark);
      doc.roundedRect(margin, y, contentW, 12, 2, 2, 'F');
      // slide number pill
      setFill(BRAND.violet);
      doc.roundedRect(margin + 2, y + 2, 8, 8, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      setColor(BRAND.white);
      text(String(i + 1), margin + 6, y + 7.2, { align: 'center' });
      // slide title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      setColor(BRAND.white);
      text(safeStr(slide.title), margin + 14, y + 7.8);
      // content preview
      const content = safeStr(slide.content ?? slide.body ?? slide.bullets?.[0]);
      if (content !== 'N/A') {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        setColor(BRAND.muted);
        const preview = content.slice(0, 80);
        text(`  ${preview}${content.length > 80 ? '…' : ''}`, margin + 68, y + 7.8);
      }
      y += 14;
    });
  } else {
    setColor(BRAND.muted);
    doc.setFontSize(9);
    text('Pitch deck slides will appear here once generation is complete.', margin, y);
    y += 10;
  }

  // ── PAGE 7 — PIVOTS ───────────────────────────────────────────────────────
  const pivots = backendState?.pivots;
  if (Array.isArray(pivots) && pivots.length) {
    newPage();
    sectionHeader('06  Pivot Opportunities');
    pivots.slice(0, 4).forEach((pivot: any, i: number) => {
      checkY(22);
      setFill(BRAND.dark);
      doc.roundedRect(margin, y, contentW, 20, 2, 2, 'F');
      setDraw(BRAND.amber);
      doc.setLineWidth(0.5);
      doc.roundedRect(margin, y, contentW, 20, 2, 2, 'S');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      setColor(BRAND.amber);
      text(`Pivot ${i + 1}: ${safeStr(pivot.name ?? pivot.title)}`, margin + 4, y + 7);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      setColor(BRAND.text);
      const rationale = doc.splitTextToSize(safeStr(pivot.rationale ?? pivot.description), contentW - 8) as string[];
      text(rationale.slice(0, 2).join('\n'), margin + 4, y + 13.5);
      y += 23;
    });
  }

  // ── FOOTER on all pages ───────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    if (i > 1) {
      setFill(BRAND.bg);
      doc.rect(0, H - 10, W, 10, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      setColor(BRAND.muted);
      text('VentureForge AI  ·  Confidential', margin, H - 4);
      text(`${i} / ${totalPages}`, W - margin, H - 4, { align: 'right' });
      text(ideaName, W / 2, H - 4, { align: 'center' });
    }
  }

  // Save
  const filename = ideaName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'ventureforge';
  doc.save(`${filename}-startup-package.pdf`);
}
