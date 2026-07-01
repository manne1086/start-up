import { useState } from 'react';
import GlobalNavbar from './GlobalNavbar';
import { Download, AlertTriangle, Search, Activity, Pause, CheckCircle2 } from 'lucide-react';

export default function ComponentLibrary() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F0F0F0] flex flex-col font-sans pb-24">
      <GlobalNavbar />

      <main className="flex-1 w-full max-w-[1200px] mx-auto px-6 py-12 flex flex-col gap-16">
        
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">VentureForge UI Kit</h1>
          <p className="text-[#888899]">Design system components</p>
        </div>

        {/* Buttons */}
        <section>
          <h2 className="text-sm font-black text-[#888899] uppercase tracking-widest mb-6 border-b border-[#111118] pb-2">Buttons</h2>
          <div className="flex flex-wrap items-center gap-6">
            <button className="px-6 py-3 bg-[#6C47FF] border-2 border-[#6C47FF] text-white font-black text-sm hover:bg-[#111118] hover:text-[#6C47FF] shadow-[4px_4px_0px_#00D4AA] transition-all">
              Primary Action
            </button>
            <button className="px-6 py-3 bg-transparent border-2 border-[#00D4AA] text-[#00D4AA] font-bold text-sm hover:bg-[#00D4AA] hover:text-[#0A0A0F] shadow-[2px_2px_0px_transparent] hover:shadow-[4px_4px_0px_#6C47FF] transition-all">
              Secondary Action
            </button>
            <button className="px-6 py-3 bg-transparent text-[#888899] font-bold text-sm hover:text-white transition-colors">
              Ghost Button
            </button>
            <button className="px-6 py-3 bg-[#FF4D4F] border-2 border-[#FF4D4F] text-white font-black text-sm hover:bg-[#0A0A0F] transition-all">
              Danger Action
            </button>
          </div>
        </section>

        {/* Badges */}
        <section>
          <h2 className="text-sm font-black text-[#888899] uppercase tracking-widest mb-6 border-b border-[#111118] pb-2">Badges & Status</h2>
          <div className="flex flex-wrap items-center gap-6">
            <span className="px-2 py-1 text-xs font-bold uppercase border border-[#00D4AA]/30 bg-[#00D4AA]/10 text-[#00D4AA]">Complete</span>
            <span className="px-2 py-1 text-xs font-bold uppercase border border-amber-500/30 bg-amber-500/10 text-amber-500">Draft</span>
            <span className="px-2 py-1 text-xs font-bold uppercase border border-[#FF4D4F]/30 bg-[#FF4D4F]/10 text-[#FF4D4F]">Failed</span>
            <span className="px-2 py-1 text-xs font-bold uppercase border border-[#888899]/30 bg-[#888899]/10 text-[#888899]">Waiting</span>
            <span className="px-2 py-1 text-xs font-bold uppercase border border-[#6C47FF]/30 bg-[#6C47FF]/10 text-[#6C47FF] flex items-center gap-1">
              <div className="w-2 h-2 bg-[#6C47FF] rounded-full animate-pulse"></div> Active
            </span>
          </div>
        </section>

        {/* Cards */}
        <section>
          <h2 className="text-sm font-black text-[#888899] uppercase tracking-widest mb-6 border-b border-[#111118] pb-2">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="bg-[#111118] border-2 border-[#111118] p-5 flex flex-col justify-between hover:border-[#6C47FF] transition-colors">
              <div className="text-xs font-bold text-[#888899] uppercase tracking-widest mb-2">KPI Stat Card</div>
              <div className="flex items-end gap-3">
                <div className="text-3xl font-black text-[#00D4AA]">₹48L</div>
                <div className="text-xs font-bold text-white bg-white/10 px-2 py-0.5">+12%</div>
              </div>
            </div>

            <div className="border-2 border-[#111118] bg-[#0D0D14] flex flex-col relative shadow-[4px_4px_0px_#6C47FF] p-4 font-mono text-sm">
              <div className="text-xs font-bold text-[#6C47FF] mb-2 border-b border-[#6C47FF]/30 pb-2">Terminal Log Card</div>
              <div className="flex justify-between text-[#00D4AA]"><div className="flex gap-4"><span className="opacity-50">[Market]</span><span>TAM found</span></div><span>✅</span></div>
              <div className="flex justify-between text-amber-500"><div className="flex gap-4"><span className="opacity-50">[Validator]</span><span>Warning</span></div><span>⚠</span></div>
            </div>

            <div className="border-2 border-[#111118] bg-[#111118] p-6 hover:border-[#6C47FF] hover:shadow-[4px_4px_0px_#6C47FF] transition-all">
              <h3 className="text-xl font-black text-white mb-2">Pivot Option Card</h3>
              <p className="text-sm text-[#888899] mb-4">Rationale text goes here.</p>
              <div className="flex justify-between items-center text-sm font-bold bg-[#0A0A0F] p-3 border border-[#111118]">
                <span className="text-[#888899]">Impact</span><span className="text-[#00D4AA]">+₹1.2Cr</span>
              </div>
            </div>

            <button className="bg-[#111118] border-2 border-[#111118] hover:border-[#6C47FF] p-4 flex items-center justify-between transition-colors group text-left">
              <div>
                <div className="font-bold text-[#F0F0F0] text-sm">File Download Card</div>
                <div className="text-xs text-[#888899] font-mono mt-1">.pdf</div>
              </div>
              <Download className="w-4 h-4 text-[#6C47FF] opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

          </div>
        </section>

        {/* Inputs */}
        <section>
          <h2 className="text-sm font-black text-[#888899] uppercase tracking-widest mb-6 border-b border-[#111118] pb-2">Inputs & Controls</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
            
            <div>
              <label className="block text-xs font-bold text-[#888899] uppercase tracking-widest mb-2">Text Input</label>
              <input type="text" placeholder="Enter value..." className="w-full bg-[#0A0A0F] border border-[#111118] text-[#F0F0F0] px-4 py-2 focus:outline-none focus:border-[#6C47FF] transition-colors" />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#888899] uppercase tracking-widest mb-2">Number Input (Mono)</label>
              <input type="number" defaultValue={120} className="w-full bg-[#0A0A0F] border border-[#111118] text-[#F0F0F0] font-mono px-4 py-2 focus:outline-none focus:border-[#6C47FF] transition-colors" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#888899] uppercase tracking-widest mb-2">Textarea</label>
              <textarea placeholder="Description..." className="w-full h-[80px] bg-[#0A0A0F] border border-[#111118] text-[#F0F0F0] px-4 py-2 focus:outline-none focus:border-[#6C47FF] transition-colors resize-none"></textarea>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#888899] uppercase tracking-widest mb-2">Select Dropdown</label>
              <select className="w-full bg-[#0A0A0F] border border-[#111118] text-[#F0F0F0] px-4 py-2 focus:outline-none focus:border-[#6C47FF] transition-colors">
                <option>Option 1</option>
                <option>Option 2</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#888899] uppercase tracking-widest mb-2">Toggle Switch</label>
              <div className="w-10 h-5 bg-[#6C47FF] rounded-full relative cursor-pointer border-2 border-[#111118]">
                <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full"></div>
              </div>
            </div>

          </div>
        </section>

        {/* Banners */}
        <section>
          <h2 className="text-sm font-black text-[#888899] uppercase tracking-widest mb-6 border-b border-[#111118] pb-2">Feedback & Banners</h2>
          <div className="flex flex-col gap-4 max-w-3xl">
            
            <div className="bg-[#6C47FF] text-white px-4 py-3 flex items-center gap-3">
              <Pause className="w-5 h-5 fill-white text-[#6C47FF]" />
              <span className="text-sm font-bold tracking-wide">Info / Paused Banner</span>
            </div>

            <div className="border-2 border-[#00D4AA] bg-[#00D4AA]/10 p-4 flex items-center gap-3">
              <CheckCircle2 className="text-[#00D4AA] w-5 h-5 shrink-0" />
              <span className="text-sm font-bold text-white uppercase tracking-wide">Success Banner</span>
            </div>

            <div className="border border-amber-500 bg-amber-500/5 p-4 flex gap-3 shadow-[4px_4px_0px_rgba(234,179,8,0.2)]">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              <span className="text-sm text-[#F0F0F0]">Warning Banner / Validator Flag</span>
            </div>

            <div className="w-full border-2 border-[#111118] bg-[#0A0A0F] p-8 text-center flex flex-col items-center justify-center gap-4">
              <Search className="w-8 h-8 text-[#111118]" />
              <span className="text-sm font-bold text-[#888899]">Empty State Placeholder</span>
            </div>

          </div>
        </section>

      </main>
    </div>
  );
}
