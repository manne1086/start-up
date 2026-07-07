import { useState } from 'react';
import { Presentation, Download, Share2, Play, ChevronLeft, ChevronRight, RefreshCw, MoveVertical, Image as ImageIcon } from 'lucide-react';
import { useGeneration } from '../generation';
import { useRouter } from '../router';
import GlobalNavbar from './GlobalNavbar';
import { downloadPitchDeckPptx } from '../pptx';

export default function PitchDeckEditor() {
  const { navigate } = useRouter();
  const [activeSlide, setActiveSlide] = useState(4); // Market slide
  const { backendState } = useGeneration();

  const pitchDeck = backendState?.pitch_deck as
    | {
        slides?: Array<{ number?: number; title?: string; content?: Record<string, unknown> }>;
        brand?: { tagline?: string; primary_color?: string; secondary_color?: string; font?: string };
      }
    | null
    | undefined;

  const deckSlides = pitchDeck?.slides ?? [];
  const activeContent = deckSlides.find((slide) => slide.number === activeSlide) ?? deckSlides[activeSlide - 1] ?? null;
  const brandTagline = pitchDeck?.brand?.tagline ?? 'Pitch Deck';
  const deckTitle = backendState?.startup_name || backendState?.idea || 'Startup';
  const handleDownload = async () => {
    await downloadPitchDeckPptx(backendState, deckTitle);
  };

  return (
    <div className="h-screen bg-[#0A0A0F] text-[#F0F0F0] flex flex-col font-sans overflow-hidden">
      <GlobalNavbar />

      {/* Top Action Bar */}
      <div className="h-14 border-b border-[#111118] bg-[#111118] px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('results')} className="text-[#888899] hover:text-[#00D4AA] transition-colors mr-2 flex items-center">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <Presentation className="w-5 h-5 text-[#6C47FF]" />
          <h1 className="font-bold text-white text-sm uppercase tracking-widest">{deckTitle} Pitch Deck Editor</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="px-4 py-1.5 bg-transparent border-2 border-[#111118] text-[#888899] font-bold text-xs hover:border-[#00D4AA] hover:text-[#00D4AA] transition-colors flex items-center gap-2">
            <Play className="w-3 h-3" /> Preview All
          </button>
          <button className="px-4 py-1.5 bg-transparent border-2 border-[#111118] text-[#888899] font-bold text-xs hover:border-[#00D4AA] hover:text-[#00D4AA] transition-colors flex items-center gap-2">
            Open in Gamma
          </button>
          <button className="px-4 py-1.5 bg-transparent border-2 border-[#111118] text-[#888899] font-bold text-xs hover:border-[#00D4AA] hover:text-[#00D4AA] transition-colors flex items-center gap-2">
            <Share2 className="w-3 h-3" /> Share
          </button>
          <button onClick={handleDownload} className="px-4 py-1.5 bg-[#6C47FF]/10 border-2 border-[#6C47FF] text-[#6C47FF] font-bold text-xs hover:bg-[#6C47FF] hover:text-white transition-colors flex items-center gap-2">
            <Download className="w-3 h-3" /> Download .pptx
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        
        {/* LEFT — Slide Navigator */}
        <div className="w-[180px] shrink-0 border-r border-[#111118] bg-[#0A0A0F] overflow-y-auto custom-scrollbar p-4 flex flex-col gap-4">
          {deckSlides.map((slide, i) => (
            <div 
              key={slide.id ?? slide.number ?? i} 
              onClick={() => setActiveSlide(slide.id ?? slide.number ?? i + 1)}
              className={`relative cursor-pointer group ${(activeSlide === (slide.id ?? slide.number ?? i + 1)) ? 'opacity-100' : 'opacity-50 hover:opacity-100'}`}
            >
              <div className="text-[10px] font-mono text-[#888899] mb-1">{i + 1}</div>
              <div className={`aspect-video border-2 bg-[#111118] flex items-center justify-center p-2 text-center transition-colors ${activeSlide === (slide.id ?? slide.number ?? i + 1) ? 'border-[#6C47FF] shadow-[2px_2px_0px_#6C47FF]' : 'border-[#111118] group-hover:border-[#888899]'}`}>
                <span className="text-[10px] font-bold text-[#F0F0F0] leading-tight">{slide.title}</span>
              </div>
              <div className="absolute top-6 -left-2 opacity-0 group-hover:opacity-100 cursor-grab">
                <MoveVertical className="w-3 h-3 text-[#888899]" />
              </div>
            </div>
          ))}
        </div>

        {/* CENTER — Canvas */}
        <div className="flex-1 bg-[#0A0A0F] p-8 flex flex-col items-center justify-center relative overflow-y-auto custom-scrollbar">
          
          {/* Active Slide Preview (Market Size example) */}
          <div className="w-full max-w-[960px] aspect-video bg-[#111118] border-2 border-[#111118] shadow-2xl flex flex-col p-12 relative overflow-hidden">
            {/* Slide Background Elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#6C47FF]/5 rounded-full blur-3xl -mr-[200px] -mt-[200px]"></div>
            
            <h2 className="text-4xl font-black text-white tracking-tight mb-4 z-10">{activeContent?.title ?? 'Pitch deck pending'}</h2>
            <div className="w-16 h-1 bg-[#00D4AA] mb-12 z-10"></div>

            <div className="flex-1 flex gap-8 items-center justify-center z-10">
              
              <div className="flex-1 flex flex-col items-center justify-center bg-[#0A0A0F] border border-[#111118] p-8">
                <div className="text-sm font-bold text-[#888899] uppercase tracking-widest mb-4">TAM</div>
                  <div className="text-6xl font-black text-[#6C47FF] mb-2">{(backendState?.market as { tam?: string } | null | undefined)?.tam ?? '—'}</div>
                  <div className="text-sm text-[#F0F0F0]">{brandTagline}</div>
              </div>
              
              <div className="flex-1 flex flex-col items-center justify-center bg-[#0A0A0F] border border-[#111118] p-8 shadow-[4px_4px_0px_#00D4AA]">
                <div className="text-sm font-bold text-[#888899] uppercase tracking-widest mb-4">SAM</div>
                  <div className="text-6xl font-black text-[#00D4AA] mb-2">{(backendState?.market as { sam?: string } | null | undefined)?.sam ?? '—'}</div>
                  <div className="text-sm text-[#F0F0F0]">Backend-sourced</div>
              </div>
              
              <div className="flex-1 flex flex-col items-center justify-center bg-[#0A0A0F] border border-[#111118] p-8">
                <div className="text-sm font-bold text-[#888899] uppercase tracking-widest mb-4">SOM</div>
                  <div className="text-6xl font-black text-white mb-2">{(backendState?.market as { som?: string } | null | undefined)?.som ?? '—'}</div>
                  <div className="text-sm text-[#F0F0F0]">Live generation output</div>
              </div>

            </div>
          </div>

          {/* Canvas Controls */}
          <div className="mt-8 flex items-center gap-6">
            <button 
              onClick={() => setActiveSlide(Math.max(1, activeSlide - 1))}
              className="p-2 bg-[#111118] border border-[#111118] hover:border-[#6C47FF] text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-xs font-mono font-bold text-[#888899]">{activeSlide} / {deckSlides.length}</span>
            <button 
              onClick={() => setActiveSlide(Math.min(deckSlides.length, activeSlide + 1))}
              className="p-2 bg-[#111118] border border-[#111118] hover:border-[#6C47FF] text-white transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* RIGHT — Edit Panel */}
        <div className="w-[300px] shrink-0 border-l border-[#111118] bg-[#111118] flex flex-col overflow-y-auto custom-scrollbar">
          <div className="p-5 border-b border-[#0A0A0F]">
            <h2 className="text-sm font-black text-white uppercase tracking-widest">Edit Slide</h2>
          </div>

          <div className="p-5 flex flex-col gap-6 flex-1">
            
            {/* Text Fields */}
            <div>
              <label className="block text-xs font-bold text-[#888899] uppercase tracking-widest mb-2">Heading</label>
              <input type="text" defaultValue={activeContent?.title ?? 'Market Size'} className="w-full bg-[#0A0A0F] border border-[#111118] text-[#F0F0F0] text-sm px-3 py-2 focus:outline-none focus:border-[#6C47FF] transition-colors" />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#888899] uppercase tracking-widest mb-2">TAM Value</label>
              <input type="text" defaultValue={(backendState?.market as { tam?: string } | null | undefined)?.tam ?? '$4.2B'} className="w-full bg-[#0A0A0F] border border-[#111118] text-[#F0F0F0] text-sm px-3 py-2 focus:outline-none focus:border-[#6C47FF] transition-colors" />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#888899] uppercase tracking-widest mb-2">SAM Value</label>
              <input type="text" defaultValue={(backendState?.market as { sam?: string } | null | undefined)?.sam ?? '$820M'} className="w-full bg-[#0A0A0F] border border-[#111118] text-[#F0F0F0] text-sm px-3 py-2 focus:outline-none focus:border-[#00D4AA] transition-colors" />
            </div>

            <div className="pt-6 border-t border-[#0A0A0F]">
              <h3 className="text-xs font-bold text-[#888899] uppercase tracking-widest mb-4">Brand Settings</h3>
              
              <div className="mb-4">
                <label className="block text-xs text-[#888899] mb-2">Colors</label>
                <div className="flex gap-2">
                  <div className="w-8 h-8 bg-[#6C47FF] border border-white cursor-pointer"></div>
                  <div className="w-8 h-8 bg-[#00D4AA] border border-[#111118] cursor-pointer"></div>
                  <div className="w-8 h-8 bg-[#0A0A0F] border border-[#111118] cursor-pointer"></div>
                  <div className="w-8 h-8 bg-[#F0F0F0] border border-[#111118] cursor-pointer"></div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs text-[#888899] mb-2">Font</label>
                <select className="w-full bg-[#0A0A0F] border border-[#111118] text-[#F0F0F0] text-sm px-3 py-2 focus:outline-none focus:border-[#6C47FF]">
                  <option>Inter (Sans)</option>
                  <option>JetBrains Mono</option>
                  <option>Space Grotesk</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-[#888899] mb-2">Logo</label>
                <button className="w-full py-4 border-2 border-dashed border-[#888899]/30 hover:border-[#6C47FF] text-[#888899] hover:text-[#6C47FF] transition-colors flex flex-col items-center justify-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  <span className="text-xs font-bold">Upload PNG/SVG</span>
                </button>
              </div>
            </div>
            
          </div>

          <div className="p-5 border-t border-[#0A0A0F]">
            <button className="w-full py-2.5 bg-transparent border-2 border-[#00D4AA] text-[#00D4AA] font-bold text-sm hover:bg-[#00D4AA] hover:text-[#0A0A0F] transition-colors flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4" /> Regenerate Slide
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
