import { Rocket, ArrowRight } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../auth';
import { useRouter } from '../router';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

/**
 * Slim marketing navbar for the public landing page.
 *
 * Unlike GlobalNavbar (used inside the authenticated app), this navbar
 * shows only:
 *  - Logo
 *  - Sign in / Log out state
 *  - "Launch Idea" CTA button
 *
 * When the visitor is authenticated we still show their name + log out
 * so they can access the marketing page without losing session context.
 */
export default function LandingNavbar() {
  const { loading, authenticated, user, logout } = useAuth();
  const { navigate, navigatePath } = useRouter();
  const location = useLocation();

  const handleSignIn = () => {
    window.location.href = `${API_URL}/api/auth/oauth/google`;
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <nav className="w-full h-16 px-8 flex justify-between items-center z-50 sticky top-0 bg-[#07070C]/80 backdrop-blur-md border-b border-white/[0.06]">
      <div className="flex items-center gap-8 h-full">
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => navigate('landing')}
        >
          <div className="bg-gradient-to-br from-[#6C47FF] to-[#00D4AA] p-2 rounded-lg group-hover:shadow-[0_0_15px_rgba(108,71,255,0.4)] transition-all duration-300">
            <Rocket className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-black tracking-tight text-white">VentureForge</span>
        </div>

        {/* Middle nav links — only visible when authenticated */}
        {authenticated && (
          <div className="hidden md:flex items-center gap-6 text-sm font-bold text-[#888899]">
            <button
              onClick={() => navigate('projects')}
              className={`hover:text-white transition-colors ${location.pathname === '/projects' ? 'text-white' : ''}`}
            >
              Projects
            </button>
            <button
              onClick={() => navigate('how-it-works')}
              className={`hover:text-white transition-colors ${location.pathname === '/how-it-works' ? 'text-white' : ''}`}
            >
              How it works
            </button>
            <button
              onClick={() => navigate('home')}
              className={`hover:text-white transition-colors ${location.pathname === '/home' ? 'text-white' : ''}`}
            >
              New Idea
            </button>
            <button
              onClick={() => navigatePath('/community')}
              className={`hover:text-white transition-colors ${location.pathname === '/community' ? 'text-white' : ''}`}
            >
              Community
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-6 text-sm font-semibold">
        {loading ? (
          <span className="text-[#888899]">Checking session...</span>
        ) : authenticated ? (
          <div className="flex items-center gap-4">
            <span className="text-[#E0E0EE] hidden sm:inline">
              {user?.name ?? user?.email ?? 'Signed in'}
            </span>
            <button
              onClick={handleLogout}
              className="text-[#888899] hover:text-[#E0E0EE] transition-colors"
            >
              Log out
            </button>
          </div>
        ) : (
          <button
            onClick={handleSignIn}
            className="text-[#888899] hover:text-[#E0E0EE] transition-colors"
          >
            Sign in
          </button>
        )}
        <button
          onClick={() => (authenticated ? navigate('home') : handleSignIn())}
          className="px-6 py-2.5 rounded-lg bg-[#6C47FF] hover:bg-[#7D5AFF] text-white font-bold text-sm transition-all duration-200 hover:shadow-[2px_2px_0px_#00D4AA] flex items-center gap-2"
        >
          {authenticated ? 'Launch Idea' : 'Get started'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </nav>
  );
}
