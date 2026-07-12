import { useState, useRef, useEffect } from 'react';
import { Presentation, Download, Share2, Play, ChevronLeft, ChevronRight, RefreshCw, MoveVertical, Image as ImageIcon, FileText, Plus, Trash2, Copy, Maximize, Edit3 } from 'lucide-react';
import { useGeneration } from '../generation';
import { useRouter } from '../router';
import GlobalNavbar from './GlobalNavbar';
import { downloadPitchDeckPptx } from '../pptx';
import { exportStartupPdf } from '../pdfExport';

export default function PitchDeckEditor() {
  const { navigate } = useRouter();
  const { backendState } = useGeneration();

  const initialDeck = backendState?.pitch_deck as
    | {
        slides?: Array<{ number?: number; id?: number; title?: string; type?: string; content?: Record<string, unknown> }>;
        brand?: { tagline?: string; primary_color?: string; secondary_color?: string; font?: string };
      }
    | null
    | undefined;

  // Local state for slide editing
  const [slides, setSlides] = useState(initialDeck?.slides ?? []);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [speakerNotes, setSpeakerNotes] = useState<Record<number, string>>({});
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const canvasRef = useRef<HTMLDivElement>(null);

  // Initialize slides if empty
  useEffect(() => {
    if (slides.length === 0) {
      setSlides([
        { id: 1, number: 1, title: 'Title Slide', type: 'title' },
        { id: 2, number: 2, title: 'Problem', type: 'content' },
        { id: 3, number: 3, title: 'Solution', type: 'content' },
        { id: 4, number: 4, title: 'Market Size', type: 'market' },
        { id: 5, number: 5, title: 'Team', type: 'team' },
      ]);
    }
  }, [slides.length]);

  const activeSlide = slides[activeSlideIndex] ?? slides[0];
  const brandTagline = initialDeck?.brand?.tagline ?? 'Pitch Deck';
  const deckTitle = backendState?.startup_name || backendState?.idea || 'Startup';

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input/textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      
      if (e.key === 'ArrowRight') {
        setActiveSlideIndex((prev) => Math.min(slides.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft') {
        setActiveSlideIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slides.length, isFullscreen]);

  // Slide Operations
  const handleAddSlide = () => {
    const newSlide = { id: Date.now(), number: slides.length + 1, title: 'New Slide', type: 'content' };
    setSlides([...slides, newSlide]);
    setActiveSlideIndex(slides.length);
  };

  const handleDeleteSlide = () => {
    if (slides.length <= 1) return;
    const newSlides = slides.filter((_, i) => i !== activeSlideIndex);
    setSlides(newSlides);
    setActiveSlideIndex(Math.max(0, activeSlideIndex - 1));
  };

  const handleDuplicateSlide = () => {
    const slideToCopy = slides[activeSlideIndex];
    const newSlide = { ...slideToCopy, id: Date.now(), number: slides.length + 1, title: `${slideToCopy.title} (Copy)` };
    const newSlides = [...slides];
    newSlides.splice(activeSlideIndex + 1, 0, newSlide);
    setSlides(newSlides);
    setActiveSlideIndex(activeSlideIndex + 1);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadError('');
    try {
      await downloadPitchDeckPptx(backendState, deckTitle);
    } catch (err: any) {
      const msg = err?.message ?? 'Failed to download PPTX. Please try again.';
      setDownloadError(msg);
      setTimeout(() => setDownloadError(''), 6000);
    } finally {
      setIsDownloading(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      canvasRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const renderSlideContent = (slide: typeof activeSlide) => {
    if (slide?.type === 'title') {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center z-10 w-full animate-fadeInUp">
          <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
            {deckTitle}
          </h1>
          <p className="text-xl lg:text-2xl text-[#888899] font-medium max-w-2xl">
            {brandTagline}
          </p>
        </div>
      );
    }
    
    if (slide?.type === 'market') {
      return (
        <div className="flex-1 flex gap-6 lg:gap-8 items-center justify-center z-10 w-full animate-scaleIn">
          <div className="flex-1 flex flex-col items-center justify-center bg-[#0A0A0F]/80 backdrop-blur-xl border border-[#111118] rounded-[32px] p-8 card-hover shadow-2xl">
            <div className="text-sm font-bold text-[#888899] uppercase tracking-widest mb-4">TAM</div>
            <div className="text-4xl lg:text-5xl font-black text-[#6C47FF] mb-2 break-words text-center">{(backendState?.market as any)?.tam ?? '$4.2B'}</div>
            <div className="text-sm text-[#888899] text-center">Total Addressable Market</div>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center bg-[#0A0A0F]/80 backdrop-blur-xl border border-[#111118] rounded-[32px] p-8 card-hover shadow-[0_0_40px_rgba(0,212,170,0.15)] relative">
            <div className="absolute inset-0 rounded-[32px] border-2 border-[#00D4AA]/30 pointer-events-none"></div>
            <div className="text-sm font-bold text-[#888899] uppercase tracking-widest mb-4">SAM</div>
            <div className="text-4xl lg:text-5xl font-black text-[#00D4AA] mb-2 break-words text-center">{(backendState?.market as any)?.sam ?? '$820M'}</div>
            <div className="text-sm text-[#888899] text-center">Serviceable Addressable Market</div>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center bg-[#0A0A0F]/80 backdrop-blur-xl border border-[#111118] rounded-[32px] p-8 card-hover shadow-2xl">
            <div className="text-sm font-bold text-[#888899] uppercase tracking-widest mb-4">SOM</div>
            <div className="text-4xl lg:text-5xl font-black text-white mb-2 break-words text-center">{(backendState?.market as any)?.som ?? '$120M'}</div>
            <div className="text-sm text-[#888899] text-center">Serviceable Obtainable Market</div>
          </div>
        </div>
      );
    }

    // Default content slide
    return (
      <div className="flex-1 w-full bg-[#0A0A0F]/50 backdrop-blur-md border border-white/5 rounded-[24px] p-8 z-10 animate-fadeInUp flex flex-col">
        <div className="w-full h-12 bg-white/5 rounded-lg mb-4 animate-pulse"></div>
        <div className="w-3/4 h-12 bg-white/5 rounded-lg mb-8 animate-pulse"></div>
        <div className="w-full flex-1 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center">
          <span className="text-[#555566] font-bold">Content Area</span>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen bg-[#0A0A0F] text-[#F0F0F0] flex flex-col font-sans overflow-hidden">
      <GlobalNavbar />

      {/* Top Action Bar */}
      <div className="h-14 border-b border-[#111118] bg-[#111118]/90 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('results')} className="text-[#888899] hover:text-[#00D4AA] transition-colors mr-2 flex items-center p-1 rounded-lg hover:bg-white/5">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <Presentation className="w-5 h-5 text-[#6C47FF]" />
          <div className="font-bold text-white text-sm uppercase tracking-widest flex items-center gap-2">
            {deckTitle} Pitch Deck
            <span className="px-2 py-0.5 rounded text-[10px] bg-white/10 text-white/70 normal-case tracking-normal">Auto-saved</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={toggleFullscreen} className="px-3 py-1.5 bg-transparent text-[#888899] font-bold text-xs hover:text-white transition-colors flex items-center gap-2 rounded-lg hover:bg-white/5">
            <Maximize className="w-3.5 h-3.5" /> Fullscreen
          </button>
          <button className="px-3 py-1.5 bg-transparent text-[#888899] font-bold text-xs hover:text-white transition-colors flex items-center gap-2 rounded-lg hover:bg-white/5">
            <Share2 className="w-3.5 h-3.5" /> Share
          </button>
          <div className="w-px h-4 bg-white/10 mx-1"></div>
          <button onClick={() => exportStartupPdf(backendState, deckTitle)} className="px-4 py-1.5 bg-transparent border border-[#00D4AA]/50 text-[#00D4AA] font-bold text-xs hover:bg-[#00D4AA] hover:text-[#0A0A0F] rounded-lg transition-all flex items-center gap-2">
            <FileText className="w-3.5 h-3.5" /> PDF
          </button>
          <button onClick={handleDownload} disabled={isDownloading} className="px-4 py-1.5 bg-[#6C47FF] text-white font-bold text-xs hover:bg-[#5a3ae0] rounded-lg transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(108,71,255,0.3)] hover:shadow-[0_0_20px_rgba(108,71,255,0.5)] disabled:opacity-50 disabled:cursor-not-allowed">
            {isDownloading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full" style={{ animation: 'spin 0.8s linear infinite' }} />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" /> Export PPTX
              </>
            )}
          </button>
        </div>
      </div>

      {/* Download error toast */}
      {downloadError && (
        <div className="fixed bottom-6 right-6 z-[9999] animate-slideInRight">
          <div className="glass-strong px-5 py-3 flex items-center gap-3 rounded-2xl border border-[#FF4D4F]/30 shadow-2xl max-w-md">
            <div className="w-2 h-2 rounded-full bg-[#FF4D4F] shrink-0 animate-pulse" />
            <span className="text-sm font-semibold text-[#FF4D4F]">{downloadError}</span>
            <button onClick={() => setDownloadError('')} className="ml-auto text-[#888899] hover:text-white text-lg leading-none">&times;</button>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* LEFT — Slide Navigator */}
        <div className="w-[200px] shrink-0 border-r border-[#111118] bg-[#0A0A0F]/95 backdrop-blur-md overflow-y-auto custom-scrollbar flex flex-col z-10">
          <div className="p-3 border-b border-white/5 flex gap-2">
            <button onClick={handleAddSlide} className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded text-xs font-bold flex items-center justify-center gap-1 transition-colors tooltip-trigger" title="New Slide">
              <Plus className="w-3.5 h-3.5" /> New
            </button>
          </div>
          <div className="p-3 flex flex-col gap-3 flex-1">
            {slides.map((slide, i) => (
              <div 
                key={slide.id} 
                onClick={() => setActiveSlideIndex(i)}
                className={`relative cursor-pointer group rounded-xl transition-all duration-200 ${(activeSlideIndex === i) ? 'opacity-100 bg-white/5 p-2' : 'opacity-60 hover:opacity-100 p-2'}`}
              >
                <div className="text-[10px] font-mono text-[#888899] mb-1.5 flex justify-between items-center">
                  <span>{i + 1}</span>
                  <MoveVertical className="w-3 h-3 text-[#555566] opacity-0 group-hover:opacity-100 cursor-grab" />
                </div>
                <div className={`aspect-video bg-[#111118] flex items-center justify-center p-2 text-center rounded-lg transition-all duration-300 ${activeSlideIndex === i ? 'border-2 border-[#6C47FF] shadow-[0_0_15px_rgba(108,71,255,0.2)]' : 'border border-white/10 group-hover:border-[#888899]'}`}>
                  <span className="text-[10px] font-bold text-[#F0F0F0] leading-tight truncate px-1">{slide.title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CENTER — Canvas & Controls */}
        <div className="flex-1 bg-[#0A0A0F] flex flex-col relative overflow-hidden">
          
          {/* Main Canvas Area */}
          <div className="flex-1 p-4 md:p-8 flex items-center justify-center relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1a1a24] to-[#0A0A0F]">
            
            {/* The Slide Container */}
            <div 
              ref={canvasRef}
              className={`w-full max-w-[1024px] aspect-video bg-[#0D0D14] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col p-10 md:p-14 relative overflow-hidden transition-all duration-500 ease-in-out ${isFullscreen ? 'border-none rounded-none w-screen h-screen max-w-none' : 'rounded-[24px]'}`}
            >
              {/* Decorative Background Elements */}
              <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-b from-[#6C47FF]/10 to-transparent rounded-full blur-3xl -mr-[300px] -mt-[300px] pointer-events-none transition-all duration-700"></div>
              <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-t from-[#00D4AA]/5 to-transparent rounded-full blur-3xl -ml-[200px] -mb-[200px] pointer-events-none transition-all duration-700"></div>
              
              {/* Slide Header */}
              {activeSlide?.type !== 'title' && (
                <div className="flex items-center gap-4 mb-8 z-10 animate-fadeInDown">
                  <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">{activeSlide?.title ?? 'Slide'}</h2>
                  <div className="h-1 flex-1 bg-gradient-to-r from-[#6C47FF] to-transparent rounded-full opacity-30 mt-2"></div>
                </div>
              )}

              {/* Dynamic Content */}
              {renderSlideContent(activeSlide)}
              
              {/* Slide Number */}
              <div className="absolute bottom-6 right-8 text-[#555566] font-mono text-xs z-10">
                {activeSlideIndex + 1}
              </div>
            </div>
          </div>

          {/* Bottom Control Bar */}
          <div className="h-16 border-t border-white/5 bg-[#111118]/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-20">
            <div className="flex gap-2">
              <button onClick={handleDuplicateSlide} className="p-2 text-[#888899] hover:text-white hover:bg-white/5 rounded-lg transition-colors tooltip-trigger" title="Duplicate">
                <Copy className="w-4 h-4" />
              </button>
              <button onClick={handleDeleteSlide} disabled={slides.length <= 1} className="p-2 text-[#888899] hover:text-[#FF4D4F] hover:bg-[#FF4D4F]/10 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent tooltip-trigger" title="Delete">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex items-center gap-4 bg-[#0A0A0F] p-1.5 rounded-full border border-white/5">
              <button 
                onClick={() => setActiveSlideIndex(Math.max(0, activeSlideIndex - 1))}
                disabled={activeSlideIndex === 0}
                className="p-1.5 hover:bg-white/10 rounded-full text-white transition-colors disabled:opacity-30"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="text-xs font-mono font-bold text-[#888899] px-2 min-w-[50px] text-center">
                <span className="text-white">{activeSlideIndex + 1}</span> / {slides.length}
              </div>
              <button 
                onClick={() => setActiveSlideIndex(Math.min(slides.length - 1, activeSlideIndex + 1))}
                disabled={activeSlideIndex === slides.length - 1}
                className="p-1.5 hover:bg-white/10 rounded-full text-white transition-colors disabled:opacity-30"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            
            <button onClick={toggleFullscreen} className="px-4 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-full text-xs font-bold flex items-center gap-2 transition-colors">
              <Play className="w-3 h-3 fill-current" /> Present
            </button>
          </div>
        </div>

        {/* RIGHT — Edit Panel */}
        <div className="w-[320px] shrink-0 border-l border-[#111118] bg-[#111118] flex flex-col overflow-y-auto custom-scrollbar z-10">
          <div className="p-4 border-b border-[#0A0A0F] flex items-center gap-2 bg-[#0A0A0F]/50">
            <Edit3 className="w-4 h-4 text-[#00D4AA]" />
            <h2 className="text-sm font-black text-white uppercase tracking-widest">Edit Slide</h2>
          </div>

          <div className="p-5 flex flex-col gap-6 flex-1">
            {/* Slide Settings */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#888899] uppercase tracking-widest mb-2">Heading</label>
                <input 
                  type="text" 
                  value={activeSlide?.title ?? ''} 
                  onChange={(e) => {
                    const newSlides = [...slides];
                    newSlides[activeSlideIndex].title = e.target.value;
                    setSlides(newSlides);
                  }}
                  className="w-full bg-[#0A0A0F] border border-[#111118] text-[#F0F0F0] text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-[#6C47FF] transition-colors" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#888899] uppercase tracking-widest mb-2">Layout Type</label>
                <select 
                  value={activeSlide?.type ?? 'content'}
                  onChange={(e) => {
                    const newSlides = [...slides];
                    newSlides[activeSlideIndex].type = e.target.value;
                    setSlides(newSlides);
                  }}
                  className="w-full bg-[#0A0A0F] border border-[#111118] text-[#F0F0F0] text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-[#6C47FF] transition-colors cursor-pointer"
                >
                  <option value="title">Title Slide</option>
                  <option value="content">Content</option>
                  <option value="market">Market Size (TAM/SAM/SOM)</option>
                  <option value="team">Team Profile</option>
                </select>
              </div>
            </div>

            {/* Speaker Notes */}
            <div className="flex-1 flex flex-col border-t border-[#0A0A0F] pt-6">
              <label className="block text-xs font-bold text-[#888899] uppercase tracking-widest mb-2 flex items-center justify-between">
                Speaker Notes
                <span className="normal-case text-[10px] font-normal opacity-70">Visible in presenter mode</span>
              </label>
              <textarea 
                value={speakerNotes[activeSlide?.id ?? 0] ?? ''}
                onChange={(e) => setSpeakerNotes({...speakerNotes, [activeSlide?.id ?? 0]: e.target.value})}
                placeholder="Add notes for your presentation..."
                className="w-full flex-1 min-h-[150px] bg-[#0A0A0F] border border-[#111118] text-[#F0F0F0] text-sm px-4 py-3 rounded-xl focus:outline-none focus:border-[#6C47FF] transition-colors resize-none"
              />
            </div>
          </div>

          <div className="p-4 border-t border-[#0A0A0F] bg-[#0A0A0F]/50">
            <button className="w-full py-3 bg-[#6C47FF]/10 border border-[#6C47FF]/30 text-[#C9BEFF] font-bold text-sm hover:bg-[#6C47FF] hover:text-white rounded-xl transition-all flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4" /> AI Regenerate
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
