import { Rocket, Bell, ChevronDown, User, Sparkles, Settings, LogOut, UserCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useGeneration } from '../generation';
import { useRouter } from '../router';
import { useAuth } from '../auth';
import { useNotifications } from '../notifications';
import { useEffect, useRef, useState } from 'react';

export default function GlobalNavbar() {
  const { screen, navigate, navigatePath } = useRouter();
  const { backendState } = useGeneration();
  const { authenticated, user, logout } = useAuth();
  const { unreadCount, notifications, fetchNotifications, markAsRead } = useNotifications();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!profileOpen && !notificationsOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [profileOpen, notificationsOpen]);

  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();
    navigate('landing');
  };

  return (
    <nav className={`w-full h-[64px] px-6 flex justify-between items-center z-50 sticky top-0 shrink-0 transition-all duration-300 ${scrolled ? 'bg-[#0A0A0F]/80 backdrop-blur-xl border-b border-[#6C47FF]/20 shadow-[0_4px_30px_rgba(0,0,0,0.5)]' : 'bg-[#0A0A0F] border-b border-transparent'}`}>
      <div className="flex items-center gap-8 h-full">
        {/* Logo */}
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => authenticated ? navigate('home') : navigate('landing')}
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
            onClick={() => navigate('how-it-works')}
            className={`h-full relative flex items-center transition-colors hover:text-white group ${screen === 'how-it-works' ? 'text-white' : ''}`}
          >
            How it works
            <div className={`absolute bottom-0 left-0 h-1 bg-[#6C47FF] rounded-t-full transition-all duration-300 ${screen === 'how-it-works' ? 'w-full shadow-[0_-2px_10px_rgba(108,71,255,0.5)]' : 'w-0 group-hover:w-full'}`}></div>
          </button>
          <button
            onClick={() => navigate('home')}
            className={`h-full relative flex items-center transition-colors hover:text-white group ${screen === 'home' ? 'text-white' : ''}`}
          >
            New Idea
            <div className={`absolute bottom-0 left-0 h-1 bg-[#6C47FF] rounded-t-full transition-all duration-300 ${screen === 'home' ? 'w-full shadow-[0_-2px_10px_rgba(108,71,255,0.5)]' : 'w-0 group-hover:w-full'}`}></div>
          </button>
          <button
            onClick={() => navigatePath('/community')}
            className={`h-full relative flex items-center transition-colors hover:text-white group ${location.pathname === '/community' ? 'text-white' : ''}`}
          >
            Community
            <div className={`absolute bottom-0 left-0 h-1 bg-[#6C47FF] rounded-t-full transition-all duration-300 ${location.pathname === '/community' ? 'w-full shadow-[0_-2px_10px_rgba(108,71,255,0.5)]' : 'w-0 group-hover:w-full'}`}></div>
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
          {/* Notification Bell */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                if (!notificationsOpen) {
                  void fetchNotifications();
                }
              }}
              className="text-[#888899] hover:text-white transition-colors relative p-2 rounded-full hover:bg-white/5"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <div className="absolute top-0 right-0 w-5 h-5 bg-[#FF4D4F] border-2 border-[#0A0A0F] rounded-full flex items-center justify-center text-[10px] font-bold text-white animate-pulse">
                  {unreadCount}
                </div>
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-[#111118] border border-[#6C47FF]/20 shadow-[4px_4px_0px_#6C47FF] z-50 max-h-96 overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-white/10 bg-[#0A0A0F]">
                  <p className="text-sm font-bold text-white">Notifications</p>
                </div>

                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-[#888899] text-sm">
                    No notifications yet
                  </div>
                ) : (
                  <div className="overflow-y-auto flex-1">
                    {notifications.map((notif) => (
                      <button
                        key={notif.id}
                        onClick={async () => {
                          await markAsRead(notif.id);
                          navigatePath(`/ideas/${notif.idea_id}`);
                          setNotificationsOpen(false);
                        }}
                        className={`w-full text-left p-3 border-b border-white/10 transition-colors ${
                          notif.is_read
                            ? 'bg-[#111118] hover:bg-[#0A0A0F]'
                            : 'bg-[#6C47FF]/10 hover:bg-[#6C47FF]/20'
                        }`}
                      >
                        <p className="text-sm text-[#F0F0F0] break-words">{notif.message}</p>
                        <p className="text-xs text-[#888899] mt-1">
                          {new Date(notif.created_at).toLocaleString()}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <button className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[#00D4AA]/10 text-[#00D4AA] rounded-full text-xs font-bold hover:bg-[#00D4AA] hover:text-[#0A0A0F] transition-all border border-[#00D4AA]/30">
            <Sparkles className="w-3.5 h-3.5" /> Upgrade
          </button>

          {/* Profile dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 text-[#888899] hover:text-white transition-colors p-1 rounded-full hover:bg-white/5 pr-2"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6C47FF] to-[#00D4AA] p-[2px]">
                <div className="w-full h-full bg-[#111118] rounded-full flex items-center justify-center overflow-hidden">
                  {user?.picture ? (
                    <img src={user.picture} alt="" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <User className="w-4 h-4 text-[#F0F0F0]" />
                  )}
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-[#111118] border border-[#6C47FF]/20 shadow-[4px_4px_0px_#6C47FF] z-50">
                {authenticated && user && (
                  <div className="px-4 py-3 border-b border-white/10">
                    <p className="text-sm font-bold text-white truncate">{user.name || 'User'}</p>
                    <p className="text-xs text-[#888899] truncate">{user.email}</p>
                  </div>
                )}

                <div className="py-1">
                  {authenticated && user?.username && (
                    <button
                      onClick={() => { setProfileOpen(false); navigatePath(`/users/${user.username}`); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#F0F0F0] hover:bg-[#6C47FF]/10 hover:text-white transition-colors text-left"
                    >
                      <UserCircle className="w-4 h-4 text-[#888899]" />
                      My Profile
                    </button>
                  )}

                  <button
                    onClick={() => { setProfileOpen(false); navigate('settings'); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#F0F0F0] hover:bg-[#6C47FF]/10 hover:text-white transition-colors text-left"
                  >
                    <Settings className="w-4 h-4 text-[#888899]" />
                    Settings
                  </button>
                </div>

                {authenticated && (
                  <>
                    <div className="border-t border-white/10"></div>
                    <div className="py-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#FF4D4F] hover:bg-[#FF4D4F]/10 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
