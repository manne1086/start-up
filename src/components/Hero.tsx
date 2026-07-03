import { ArrowRight } from 'lucide-react';

export default function Hero({ onGenerate }: { onGenerate?: () => void }) {
  return (
    <section className="flex flex-col items-center text-center mt-20 px-4 w-full max-w-4xl mx-auto flex-1">
      <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight text-white leading-tight">
        From Idea to Investor-Ready Startup in <span className="text-[#6C47FF]">Minutes</span>
      </h1>
      <p className="text-xl text-gray-400 mb-12 max-w-2xl font-medium leading-relaxed">
        Multi-agent AI that researches the market, drafts the plan, and builds the operating package.
      </p>

      <div className="w-full max-w-5xl relative group">
        <textarea
          rows={1}
          placeholder="Describe your startup idea..."
          className="w-full min-h-[72px] bg-[#12121A] border-2 border-white/20 text-white placeholder-gray-500 px-8 py-4 rounded-full focus:outline-none focus:border-[#6C47FF] focus:shadow-[6px_6px_0px_#6C47FF] transition-all resize-none text-lg font-medium shadow-[4px_4px_0px_transparent]"
        />

        <div className="flex flex-wrap justify-center gap-4 mt-8">
          <span className="text-sm text-gray-500">Live suggestions appear after generation starts.</span>
        </div>
      </div>

      <button
        onClick={onGenerate}
        className="mt-16 flex items-center gap-3 px-12 py-5 bg-[#6C47FF] border-2 border-[#6C47FF] text-white font-black text-xl hover:bg-[#0A0A0F] hover:text-[#6C47FF] hover:border-[#6C47FF] shadow-[6px_6px_0px_#6C47FF] hover:shadow-[8px_8px_0px_#00D4AA] hover:-translate-y-1 transition-all group"
      >
        GENERATE STARTUP PACKAGE
        <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
      </button>
    </section>
  );
}
