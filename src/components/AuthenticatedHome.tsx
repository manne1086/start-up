import { useEffect, useState } from 'react';
import { Sparkles, ArrowRight, Lightbulb, ThumbsUp, MessageSquare, TrendingUp, CheckCircle2 } from 'lucide-react';
import GlobalNavbar from './GlobalNavbar';
import { useAuth } from '../auth';
import { useGeneration } from '../generation';
import { useRouter } from '../router';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

const SUGGESTIONS = [
  'AI-powered resume builder for job seekers',
  'SaaS analytics dashboard for D2C brands',
  'Marketplace connecting local farmers to restaurants',
  'EdTech platform for competitive exam prep',
];

type UserIdea = {
  id: string;
  title: string;
  one_liner: string | null;
  domain: string | null;
  created_at: string;
  status?: 'complete' | 'running' | 'paused' | 'failed';
};

type CommunityIdea = {
  id: string;
  title: string;
  one_liner: string | null;
  owner: { username: string | null; name: string | null };
  reaction_counts: { upvote: number; would_use: number; have_this_problem: number };
  comment_count: number;
};

/**
 * Avatar component with gradient border for community post authors
 */
function Avatar({ name, initials }: { name?: string; initials?: string }) {
  const finalInitials = initials || (name?.charAt(0)?.toUpperCase() ?? '?');
  const colors = ['from-[#6C47FF] to-[#00D4AA]', 'from-[#00D4AA] to-[#6C47FF]', 'from-[#7D5AFF] to-[#00E5B8]'];
  const colorIndex = (name?.charCodeAt(0) ?? 0) % colors.length;
  const gradient = colors[colorIndex];

  return (
    <div className={`relative w-6 h-6 flex-shrink-0`}>
      <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${gradient} opacity-40`} />
      <div className="absolute inset-0.5 rounded-full bg-[#111118] flex items-center justify-center">
        <span className="text-[10px] font-bold text-[#00D4AA]">{finalInitials}</span>
      </div>
    </div>
  );
}

export default function AuthenticatedHome() {
  const { authenticated } = useAuth();
  const { startGeneration, switchToRun } = useGeneration();
  const { navigate, navigatePath } = useRouter();

  const [userIdeas, setUserIdeas] = useState<UserIdea[]>([]);
  const [communityIdeas, setCommunityIdeas] = useState<CommunityIdea[]>([]);
  const [newIdea, setNewIdea] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!authenticated) return;
    const fetchUserIdeas = async () => {
      try {
        const response = await fetch(`${API_URL}/api/ideas/mine`, { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          const ideas: UserIdea[] = (data.ideas ?? []).map((idea: any) => ({
            id: idea.id,
            title: idea.title,
            one_liner: idea.one_liner,
            domain: idea.domain,
            created_at: idea.created_at,
            status: idea.status ?? 'complete',
          }));
          setUserIdeas(ideas);
        }
      } catch { /* ignore */ }
    };
    void fetchUserIdeas();
  }, [authenticated]);

  useEffect(() => {
    const fetchCommunityIdeas = async () => {
      try {
        const response = await fetch(`${API_URL}/api/ideas?limit=10&sort=top`, { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setCommunityIdeas(data.ideas ?? []);
        }
      } catch { /* ignore */ }
    };
    void fetchCommunityIdeas();
  }, []);

  const handleGenerateIdea = async () => {
    if (!newIdea.trim()) return;
    setGenerating(true);
    try {
      await startGeneration(newIdea);
      setNewIdea('');
      navigate('progress');
    } catch (err: any) {
      console.error('Generation failed:', err);
      setGenerating(false);
    }
  };

  const handleSwitchIdea = async (tid: string) => {
    try {
      await switchToRun(tid);
      navigate('progress');
    } catch (err: any) {
      console.error('Failed to switch run:', err);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const statusStyle = (status: string) => {
    switch (status) {
      case 'complete':
        return 'bg-[#00D4AA]/10 text-[#00D4AA] border border-[#00D4AA]/30 font-bold text-[10px] uppercase tracking-wide';
      case 'running':
        return 'bg-[#6C47FF]/10 text-[#6C47FF] border border-[#6C47FF]/30 animate-pulse font-bold text-[10px] uppercase tracking-wide';
      case 'paused':
        return 'bg-[#FFB800]/10 text-[#FFB800] border border-[#FFB800]/30 font-bold text-[10px] uppercase tracking-wide';
      case 'failed':
        return 'bg-[#FF6B6B]/10 text-[#FF6B6B] border border-[#FF6B6B]/30 font-bold text-[10px] uppercase tracking-wide';
      default:
        return 'bg-[#888899]/10 text-[#888899] border border-[#888899]/30 font-bold text-[10px] uppercase tracking-wide';
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="h-screen bg-[#07070C] text-[#F0F0F0] flex flex-col font-sans overflow-hidden">
      <GlobalNavbar />

      <main className="flex-1 flex gap-4 p-4 pt-3 overflow-hidden min-h-0">

        {/* ── LEFT PANEL: Your Ideas ── */}
        <div className="w-72 flex flex-col rounded-2xl border border-white/[0.06] bg-[#0D0D14] overflow-hidden flex-shrink-0 shadow-xl">
          {/* Subtle top accent gradient */}
          <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-[#6C47FF] via-transparent to-transparent" style={{ width: '100%' }} />

          <div className="px-5 py-4 border-b border-white/[0.06] bg-gradient-to-r from-[#0D0D14] to-[#0D0D14]">
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#6C47FF] flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Your Ideas
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col gap-3 p-4">
            {userIdeas.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-12">
                <div className="w-12 h-12 rounded-xl bg-[#6C47FF]/10 flex items-center justify-center mb-4">
                  <Lightbulb className="w-6 h-6 text-[#6C47FF]/40" />
                </div>
                <p className="text-sm font-semibold text-[#E0E0EE]">No ideas yet</p>
                <p className="text-xs text-[#555566] mt-1.5">Your brainstorms will appear here</p>
              </div>
            ) : (
              userIdeas.map((idea) => (
                <button
                  key={idea.id}
                  onClick={() => handleSwitchIdea(idea.id)}
                  className="group relative text-left p-4 bg-[#111118] rounded-xl border border-white/[0.06] hover:border-[#6C47FF]/50 hover:bg-[#1A1A22] transition-all duration-300 overflow-hidden"
                >
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#6C47FF]/0 via-[#6C47FF]/0 to-[#6C47FF]/0 group-hover:from-[#6C47FF]/10 group-hover:via-transparent group-hover:to-[#6C47FF]/5 transition-all duration-300" />

                  <div className="relative z-10">
                    <p className="font-bold text-sm text-[#F0F0F0] truncate group-hover:text-[#E0E0EE] transition-colors">{idea.title}</p>
                    {idea.one_liner && (
                      <p className="text-xs text-[#888899] mt-2 truncate">{idea.one_liner}</p>
                    )}
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className={`px-2.5 py-1 rounded-md ${statusStyle(idea.status ?? 'complete')}`}>
                        {idea.status ?? 'complete'}
                      </span>
                      <span className="text-[11px] text-[#555566] flex-shrink-0">{formatDate(idea.created_at)}</span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── MIDDLE PANEL: Brainstorm (Hero Section) ── */}
        <div className="flex-1 flex flex-col rounded-2xl border border-white/[0.08] bg-[#0D0D14] overflow-hidden min-w-0 relative shadow-2xl">
          {/* Animated background gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#00D4AA]/[0.02] via-transparent to-[#6C47FF]/[0.02] pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#00D4AA] to-transparent" />

          <div className="px-6 py-4 border-b border-white/[0.06] relative z-10">
            <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-[#00D4AA] flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 animate-pulse" />
              Brainstorm
            </h2>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center px-8 pb-8 pt-6 min-h-0 relative z-10">
            {/* Hero heading with emphasis */}
            <div className="text-center mb-10 animate-fadeInUp">
              <h3 className="text-3xl font-black text-white tracking-tight leading-tight">
                What are you <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6C47FF] via-[#00D4AA] to-[#00D4AA] animate-pulse">building</span>?
              </h3>
              <p className="text-sm text-[#888899] mt-3">Describe your idea and let our AI agents do the rest</p>
            </div>

            {/* Pill-shaped input box - Gemini style */}
            <div className="w-full max-w-2xl animate-fadeInUp">
              <div className="relative group">
                {/* Soft glow on focus */}
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#6C47FF]/20 via-[#00D4AA]/20 to-[#6C47FF]/20 opacity-0 group-focus-within:opacity-100 blur-xl transition-all duration-400" />

                {/* Pill-shaped container */}
                <div className="relative flex items-center bg-[#111118] rounded-full border border-white/[0.12] group-focus-within:border-[#6C47FF]/60 hover:border-white/[0.2] transition-all duration-300 shadow-2xl group-focus-within:shadow-[0_0_30px_rgba(108,71,255,0.3)]">
                  {/* Left icon space */}
                  <div className="pl-6 py-3 text-[#6C47FF] group-focus-within:text-[#00D4AA] transition-colors duration-300">
                    <Sparkles className="w-5 h-5" />
                  </div>

                  <input
                    type="text"
                    value={newIdea}
                    onChange={(e) => setNewIdea(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleGenerateIdea();
                      }
                    }}
                    placeholder="Describe your startup idea..."
                    disabled={generating}
                    className="flex-1 bg-transparent px-4 py-3 text-base text-white placeholder-[#555566] focus:outline-none"
                    autoFocus
                  />

                  {/* Right icon + button */}
                  <button
                    onClick={handleGenerateIdea}
                    disabled={generating || !newIdea.trim()}
                    className="mr-2 p-2.5 rounded-full bg-gradient-to-r from-[#6C47FF] to-[#00D4AA] hover:from-[#7D5AFF] hover:to-[#00E5B8] disabled:from-[#222233] disabled:to-[#222233] disabled:text-[#444455] text-white flex items-center justify-center transition-all duration-200 flex-shrink-0 shadow-lg hover:shadow-[0_0_20px_rgba(108,71,255,0.4)]"
                    title="Generate analysis"
                  >
                    {generating ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <ArrowRight className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Keyboard hint */}
              <div className="flex items-center gap-2 mt-3 px-1">
                <kbd className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[11px] font-mono text-[#555566]">Enter</kbd>
                <span className="text-xs text-[#555566]">to generate</span>
              </div>
            </div>

            {/* Suggestion chips */}
            <div className="mt-10 w-full max-w-lg animate-fadeInUp">
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#555566] mb-3.5 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" /> Try an example
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setNewIdea(s)}
                    className="px-3.5 py-2.5 rounded-lg bg-[#111118] border border-white/[0.06] text-xs font-medium text-[#888899] hover:bg-[#1A1A22] hover:border-[#00D4AA]/30 hover:text-[#00D4AA] transition-all duration-200"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL: Community Feed (Social Trust) ── */}
        <div className="w-72 flex flex-col rounded-2xl border border-white/[0.06] bg-[#0D0D14] overflow-hidden flex-shrink-0 shadow-xl">
          {/* Subtle top accent gradient */}
          <div className="absolute right-0 h-1 bg-gradient-to-r from-transparent via-[#00D4AA] to-transparent" style={{ width: '100%' }} />

          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between bg-gradient-to-r from-[#0D0D14] to-[#0D0D14]">
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#00D4AA] flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Community
            </h2>
            <button
              onClick={() => navigatePath('/community')}
              className="text-xs font-bold text-[#6C47FF] hover:text-[#8B6AFF] transition-colors"
            >
              View all
            </button>
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col gap-3 p-4">
            {communityIdeas.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-12">
                <div className="w-12 h-12 rounded-xl bg-[#00D4AA]/10 flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-[#00D4AA]/40" />
                </div>
                <p className="text-sm font-semibold text-[#E0E0EE]">No ideas yet</p>
                <p className="text-xs text-[#555566] mt-1.5">Community ideas will show here</p>
              </div>
            ) : (
              communityIdeas.map((idea) => (
                <button
                  key={idea.id}
                  onClick={() => navigatePath(`/ideas/${idea.id}`)}
                  className="group relative text-left p-4 bg-[#111118] rounded-xl border border-white/[0.06] hover:border-[#00D4AA]/50 hover:bg-[#1A1A22] transition-all duration-300 overflow-hidden"
                >
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#00D4AA]/0 via-[#00D4AA]/0 to-[#00D4AA]/0 group-hover:from-[#00D4AA]/10 group-hover:via-transparent group-hover:to-[#00D4AA]/5 transition-all duration-300" />

                  <div className="relative z-10">
                    {/* Title */}
                    <p className="font-bold text-sm text-[#F0F0F0] truncate group-hover:text-[#E0E0EE] transition-colors">{idea.title}</p>

                    {/* Author byline with avatar */}
                    <div className="flex items-center gap-2 mt-2">
                      <Avatar
                        name={idea.owner?.name || idea.owner?.username}
                        initials={getInitials(idea.owner?.name || idea.owner?.username)}
                      />
                      <span className="text-xs text-[#888899] group-hover:text-[#00D4AA]/80 transition-colors truncate">
                        {idea.owner?.name || idea.owner?.username || 'Anonymous'}
                      </span>
                    </div>

                    {/* One-liner description */}
                    {idea.one_liner && (
                      <p className="text-xs text-[#555566] mt-2.5 line-clamp-2">{idea.one_liner}</p>
                    )}

                    {/* Social signals (trust indicators) */}
                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/[0.04]">
                      <span className="flex items-center gap-1.5 text-[11px] text-[#555566] group-hover:text-[#00D4AA] transition-colors">
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span className="font-semibold">{idea.reaction_counts?.upvote ?? 0}</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-[11px] text-[#555566] group-hover:text-[#6C47FF] transition-colors">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span className="font-semibold">{idea.comment_count ?? 0}</span>
                      </span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
