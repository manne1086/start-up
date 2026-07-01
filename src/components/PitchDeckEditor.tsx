import { useState } from 'react';
import { Presentation, Download, Share2, Play, ChevronLeft, ChevronRight, RefreshCw, MoveVertical, Image as ImageIcon } from 'lucide-react';
import GlobalNavbar from './GlobalNavbar';

const slides = [
  { id: 1, title: 'Title Slide', type: 'Title' },
  { id: 2, title: 'The Problem', type: 'Problem' },
  { id: 3, title: 'The Solution', type: 'Solution' },
  { id: 4, title: 'Market Size (TAM)', type: 'Market' },
  { id: 5, title: 'Product & MVP', type: 'Product' },
  { id: 6, title: 'Business Model', type: 'Business' },
  { id: 7, title: 'Go-to-Market', type: 'GTM' },
  { id: 8, title: 'Competition', type: 'Competition' },
  { id: 9, title: 'Financial Projections', type: 'Financials' },
  { id: 10, title: 'Team', type: 'Team' },
  { id: 11, title: 'The Ask', type: 'Ask' },
  { id: 12, title: 'Contact', type: 'Contact' },
];

export default function PitchDeckEditor() {
  const [activeSlide, setActiveSlide] = useState(4); // Market slide

  return (
    <div className="h-screen bg-[#0A0A0F] text-[#F0F0F0] flex flex-col font-sans overflow-hidden">
      <GlobalNavbar />

      {/* Top Action Bar */}
      <div className="h-14 border-b border-[#111118] bg-[#111118] px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Presentation className="w-5 h-5 text-[#6C47FF]" />
          <h1 className="font-bold text-white text-sm uppercase tracking-widest">Pitch Deck Editor</h1>
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
          <button className="px-4 py-1.5 bg-[#6C47FF]/10 border-2 border-[#6C47FF] text-[#6C47FF] font-bold text-xs hover:bg-[#6C47FF] hover:text-white transition-colors flex items-center gap-2">
            <Download className="w-3 h-3" /> Download .pptx
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        
        {/* LEFT — Slide Navigator */}
        <div className="w-[180px] shrink-0 border-r border-[#111118] bg-[#0A0A0F] overflow-y-auto custom-scrollbar p-4 flex flex-col gap-4">
          {slides.map((slide, i) => (
            <div 
              key={slide.id} 
              onClick={() => setActiveSlide(slide.id)}
              className={`relative cursor-pointer group ${activeSlide === slide.id ? 'opacity-100' : 'opacity-50 hover:opacity-100'}`}
            >
              <div className="text-[10px] font-mono text-[#888899] mb-1">{i + 1}</div>
              <div className={`aspect-video border-2 bg-[#111118] flex items-center justify-center p-2 text-center transition-colors ${activeSlide === slide.id ? 'border-[#6C47FF] shadow-[2px_2px_0px_#6C47FF]' : 'border-[#111118] group-hover:border-[#888899]'}`}>
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
            
            <h2 className="text-4xl font-black text-white tracking-tight mb-4 z-10">Market Size</h2>
            <div className="w-16 h-1 bg-[#00D4AA] mb-12 z-10"></div>

            <div className="flex-1 flex gap-8 items-center justify-center z-10">
              
              <div className="flex-1 flex flex-col items-center justify-center bg-[#0A0A0F] border border-[#111118] p-8">
                <div className="text-sm font-bold text-[#888899] uppercase tracking-widest mb-4">TAM</div>
                <div className="text-6xl font-black text-[#6C47FF] mb-2">$4.2B</div>
                <div className="text-sm text-[#F0F0F0]">EdTech India (2027)</div>
              </div>
              
              <div className="flex-1 flex flex-col items-center justify-center bg-[#0A0A0F] border border-[#111118] p-8 shadow-[4px_4px_0px_#00D4AA]">
                <div className="text-sm font-bold text-[#888899] uppercase tracking-widest mb-4">SAM</div>
                <div className="text-6xl font-black text-[#00D4AA] mb-2">$820M</div>
                <div className="text-sm text-[#F0F0F0]">Tier 2-3 BPS</div>
              </div>
              
              <div className="flex-1 flex flex-col items-center justify-center bg-[#0A0A0F] border border-[#111118] p-8">
                <div className="text-sm font-bold text-[#888899] uppercase tracking-widest mb-4">SOM</div>
                <div className="text-6xl font-black text-white mb-2">$41M</div>
                <div className="text-sm text-[#F0F0F0]">5% Capture Yr 3</div>
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
            <span className="text-xs font-mono font-bold text-[#888899]">{activeSlide} / {slides.length}</span>
            <button 
              onClick={() => setActiveSlide(Math.min(slides.length, activeSlide + 1))}
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
              <input type="text" defaultValue="Market Size" className="w-full bg-[#0A0A0F] border border-[#111118] text-[#F0F0F0] text-sm px-3 py-2 focus:outline-none focus:border-[#6C47FF] transition-colors" />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#888899] uppercase tracking-widest mb-2">TAM Value</label>
              <input type="text" defaultValue="$4.2B" className="w-full bg-[#0A0A0F] border border-[#111118] text-[#F0F0F0] text-sm px-3 py-2 focus:outline-none focus:border-[#6C47FF] transition-colors" />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#888899] uppercase tracking-widest mb-2">SAM Value</label>
              <input type="text" defaultValue="$820M" className="w-full bg-[#0A0A0F] border border-[#111118] text-[#F0F0F0] text-sm px-3 py-2 focus:outline-none focus:border-[#00D4AA] transition-colors" />
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
