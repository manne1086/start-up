import { Rocket, Bell, ChevronDown, User } from 'lucide-react';
import { useGeneration } from '../generation';
import { useRouter } from '../router';

export default function GlobalNavbar() {
  const { screen, navigate } = useRouter();
  const { backendState } = useGeneration();

  return (
    <nav className="w-full h-[56px] border-b border-[#6C47FF] px-6 flex justify-between items-center bg-[#0A0A0F] z-50 sticky top-0 shrink-0">
      <div className="flex items-center gap-8 h-full">
        {/* Logo */}
        <div 
          className="flex items-center gap-3 cursor-pointer group" 
          onClick={() => navigate('landing')}
        >
          <div className="bg-[#6C47FF] p-1.5 border-2 border-[#111118] group-hover:shadow-[2px_2px_0px_#00D4AA] transition-all">
            <Rocket className="text-white w-4 h-4" />
          </div>
          <span className="text-xl font-black tracking-tight text-white">VentureForge</span>
        </div>

        {/* Links */}
        <div className="hidden md:flex items-center h-full gap-6 text-sm font-bold text-[#888899]">
          <button 
            onClick={() => navigate('projects')}
            className={`h-full border-b-2 flex items-center transition-colors hover:text-[#00D4AA] ${screen === 'projects' ? 'border-[#6C47FF] text-white' : 'border-transparent'}`}
          >
            Projects
          </button>
          <button 
            onClick={() => navigate('landing')}
            className={`h-full border-b-2 flex items-center transition-colors hover:text-[#00D4AA] border-transparent`}
          >
            How it works
          </button>
          <button 
            className={`h-full border-b-2 flex items-center transition-colors hover:text-[#00D4AA] border-transparent`}
          >
            Pricing
          </button>
          <button 
            onClick={() => navigate('components')}
            className={`h-full border-b-2 flex items-center transition-colors hover:text-[#00D4AA] ${screen === 'components' ? 'border-[#6C47FF] text-white' : 'border-transparent'}`}
          >
            UI Kit
          </button>
        </div>
      </div>

      <div className="flex items-center gap-6 h-full">
        {/* Project Switcher */}
        <div className="hidden lg:flex items-center gap-2 cursor-pointer text-sm font-bold hover:text-[#00D4AA] transition-colors text-[#F0F0F0]">
          {backendState?.startup_name || backendState?.idea?.toString()?.slice(0, 24) || 'EduReach AI'}
          <ChevronDown className="w-4 h-4 text-[#888899]" />
        </div>

        <div className="w-px h-6 bg-[#6C47FF]/30 hidden md:block"></div>

        {/* Notifications & User */}
        <div className="flex items-center gap-4">
          <button className="text-[#888899] hover:text-white transition-colors relative">
            <Bell className="w-5 h-5" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#FF4D4F] rounded-full"></div>
          </button>
          <button 
            onClick={() => navigate('settings')}
            className="flex items-center gap-2 text-[#888899] hover:text-white transition-colors"
          >
            <div className="w-8 h-8 bg-[#111118] border border-[#6C47FF]/50 flex items-center justify-center overflow-hidden">
              <User className="w-4 h-4 text-[#6C47FF]" />
            </div>
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  );
}
