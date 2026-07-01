import { Rocket } from 'lucide-react';

export default function Navbar({ onLaunch }: { onLaunch?: () => void }) {
  return (
    <nav className="w-full border-b-2 border-[#6C47FF]/30 px-6 py-5 flex justify-between items-center bg-[#0A0A0F] z-10 sticky top-0">
      <div className="flex items-center gap-3 cursor-pointer">
        <div className="bg-[#6C47FF] p-2 border-2 border-white shadow-[2px_2px_0px_#00D4AA]">
          <Rocket className="text-white w-5 h-5" />
        </div>
        <span className="text-2xl font-black tracking-tight text-white">VentureForge</span>
      </div>
      <div className="hidden md:flex items-center gap-8 text-sm font-bold text-gray-400">
        <a href="#" className="hover:text-[#00D4AA] transition-colors">How it works</a>
        <a href="#" className="hover:text-[#00D4AA] transition-colors">My Projects</a>
      </div>
      <div>
        <button 
          onClick={onLaunch}
          className="px-6 py-2.5 bg-[#0A0A0F] border-2 border-[#6C47FF] text-[#6C47FF] font-black text-sm tracking-widest hover:bg-[#6C47FF] hover:text-white hover:shadow-[4px_4px_0px_#00D4AA] hover:-translate-y-0.5 transition-all">
          LAUNCH IDEA
        </button>
      </div>
    </nav>
  );
}
