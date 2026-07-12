import { Rocket, Bell, ChevronDown, User, Sparkles } from 'lucide-react';
import { useGeneration } from '../generation';
import { useRouter } from '../router';
import { useEffect, useState } from 'react';

export default function GlobalNavbar() {
  const { screen, navigate } = useRouter();
  const { backendState } = useGeneration();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`w-full h-[64px] px-6 flex justify-between items-center z-50 sticky top-0 shrink-0 transition-all duration-300 ${scrolled ? 'bg-[#0A0A0F]/80 backdrop-blur-xl border-b border-[#6C47FF]/20 shadow-[0_4px_30px_rgba(0,0,0,0.5)]' : 'bg-[#0A0A0F] border-b border-transparent'}`}>
      <div className="flex items-center gap-8 h-full">
        {/* Logo */}
        <div 
          className="flex items-center gap-3 cursor-pointer group" 
          onClick={() => navigate('landing')}
        >
          <div className="bg-gradient-to-br from-[#6C47FF] to-[#00D4AA] p-2 rounded-xl border border-white/10 group-hover:shadow-[0_0_15px_rgba(108,71,255,0.4)] transition-all duration-300">
            <Rocket className="text-white w-4 h-4 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
          <span className="text-xl font-black tracking-tight text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-[#00D4AA] transition-all">VentureForge</span>
        </div>

        {/* Links */}
        <div className="hidden md:flex items-center h-full gap-8 text-sm font-bold text-[#888899]">
          <button 
            onClick={() => navigate('projects')}
            className={`h-full relative flex items-center transition-colors hover:text-white group ${screen === 'projects' ? 'text-white' : ''}`}
          >
            Projects
            <div className={`absolute bottom-0 left-0 h-1 bg-[#6C47FF] rounded-t-full transition-all duration-300 ${screen === 'projects' ? 'w-full shadow-[0_-2px_10px_rgba(108,71,255,0.5)]' : 'w-0 group-hover:w-full'}`}></div>
          </button>
          <button 
            onClick={() => navigate('mvp')}
            className={`h-full relative flex items-center transition-colors hover:text-white group ${screen === 'mvp' ? 'text-white' : ''}`}
          >
            How it works
            <div className={`absolute bottom-0 left-0 h-1 bg-[#6C47FF] rounded-t-full transition-all duration-300 ${screen === 'mvp' ? 'w-full shadow-[0_-2px_10px_rgba(108,71,255,0.5)]' : 'w-0 group-hover:w-full'}`}></div>
          </button>
          <button 
            className="h-full relative flex items-center transition-colors hover:text-white group"
          >
            Pricing
            <div className="absolute bottom-0 left-0 h-1 bg-[#6C47FF] rounded-t-full transition-all duration-300 w-0 group-hover:w-full"></div>
          </button>
          <button 
            onClick={() => navigate('components')}
            className={`h-full relative flex items-center transition-colors hover:text-white group ${screen === 'components' ? 'text-white' : ''}`}
          >
            UI Kit
            <div className={`absolute bottom-0 left-0 h-1 bg-[#6C47FF] rounded-t-full transition-all duration-300 ${screen === 'components' ? 'w-full shadow-[0_-2px_10px_rgba(108,71,255,0.5)]' : 'w-0 group-hover:w-full'}`}></div>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-6 h-full">
        {/* Project Switcher */}
        <div className="hidden lg:flex items-center gap-2 cursor-pointer text-sm font-bold hover:text-white transition-colors text-[#F0F0F0] px-3 py-1.5 rounded-lg hover:bg-white/5">
          {backendState?.startup_name || backendState?.idea?.toString()?.slice(0, 24) || 'EduReach AI'}
          <ChevronDown className="w-4 h-4 text-[#888899]" />
        </div>

        <div className="w-px h-6 bg-white/10 hidden md:block"></div>

        {/* Notifications & User */}
        <div className="flex items-center gap-4">
          <button className="text-[#888899] hover:text-white transition-colors relative p-2 rounded-full hover:bg-white/5">
            <Bell className="w-5 h-5" />
            <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#FF4D4F] border-2 border-[#0A0A0F] rounded-full animate-pulse"></div>
          </button>
          
          <button className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[#00D4AA]/10 text-[#00D4AA] rounded-full text-xs font-bold hover:bg-[#00D4AA] hover:text-[#0A0A0F] transition-all border border-[#00D4AA]/30">
            <Sparkles className="w-3.5 h-3.5" /> Upgrade
          </button>
          
          <button 
            onClick={() => navigate('settings')}
            className="flex items-center gap-2 text-[#888899] hover:text-white transition-colors p-1 rounded-full hover:bg-white/5 pr-2"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6C47FF] to-[#00D4AA] p-[2px]">
              <div className="w-full h-full bg-[#111118] rounded-full flex items-center justify-center overflow-hidden">
                <User className="w-4 h-4 text-[#F0F0F0]" />
              </div>
            </div>
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  );
}
