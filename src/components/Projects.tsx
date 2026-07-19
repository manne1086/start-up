import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MoreHorizontal, ArrowRight, ArrowBigUp, MessageSquare, Users, Hand, ChevronDown } from 'lucide-react';
import { useRouter } from '../router';
import GlobalNavbar from './GlobalNavbar';
import { useGeneration } from '../generation';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

type Tab = 'projects' | 'my-ideas';

type MyIdea = {
  id: string;
  title: string;
  one_liner: string | null;
  domain: string | null;
  is_public: boolean;
  ai_validation_score: number | null;
  created_at: string | null;
  comment_count: number;
  interest_count: number;
  reaction_counts: { upvote: number; would_use: number; have_this_problem: number };
  interests: {
    id: string;
    message: string | null;
    created_at: string | null;
    user: { id: string; username: string | null; name: string | null; picture: string | null };
  }[];
};

function relativeTime(iso: string | null): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export default function Projects() {
  const { navigate } = useRouter();
  const rrNavigate = useNavigate();
  const { backendState } = useGeneration();
  const [tab, setTab] = useState<Tab>('projects');
  const [myIdeas, setMyIdeas] = useState<MyIdea[]>([]);
  const [myIdeasLoading, setMyIdeasLoading] = useState(false);
  const [myIdeasError, setMyIdeasError] = useState('');
  const [expandedInterests, setExpandedInterests] = useState<Set<string>>(new Set());

  const projects = backendState
    ? [
        {
          id: backendState.thread_id ?? 'current',
          name: backendState.startup_name || backendState.idea || 'Current startup',
          industry: backendState.industry || 'Research-backed',
          status: backendState.status === 'complete' ? 'Complete' : backendState.status === 'failed' ? 'Failed' : backendState.status === 'paused' ? 'Draft' : 'Running',
          date: backendState.thread_id ? backendState.thread_id.slice(0, 8) : 'Live',
          updated: backendState.agent_logs?.length ? `${backendState.agent_logs.length} agent events` : 'No events yet',
          progress: backendState.completed_steps?.length ? `Step ${backendState.completed_steps.length} of 10` : null,
        },
      ]
    : [];

  useEffect(() => {
    if (tab !== 'my-ideas') return;
    let cancelled = false;
    (async () => {
      setMyIdeasLoading(true);
      setMyIdeasError('');
      try {
        const res = await fetch(`${API_URL}/api/ideas/mine`, { credentials: 'include' });
        if (res.status === 401) {
          if (!cancelled) setMyIdeasError('Sign in to see your published ideas.');
          return;
        }
        if (!res.ok) throw new Error(`Failed to load ideas (${res.status})`);
        const data = await res.json();
        if (!cancelled) setMyIdeas(Array.isArray(data.ideas) ? data.ideas : []);
      } catch (err: any) {
        if (!cancelled) setMyIdeasError(err?.message ?? 'Failed to load your ideas.');
      } finally {
        if (!cancelled) setMyIdeasLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [tab]);

  const toggleInterests = (ideaId: string) => {
    setExpandedInterests((prev) => {
      const next = new Set(prev);
      if (next.has(ideaId)) next.delete(ideaId);
      else next.add(ideaId);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F0F0F0] flex flex-col font-sans">
      <GlobalNavbar />

      <main className="flex-1 w-full max-w-[1400px] mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <h1 className="text-3xl font-black text-white tracking-tight">My Projects</h1>
          <button
            onClick={() => navigate('home')}
            className="px-5 py-2.5 bg-[#6C47FF] border-2 border-[#6C47FF] text-white font-bold text-sm hover:bg-[#111118] hover:text-[#6C47FF] shadow-[4px_4px_0px_#00D4AA] transition-all flex items-center justify-center gap-2"
          >
            New Project <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 border-b border-[#111118] mb-8">
          <button
            onClick={() => setTab('projects')}
            className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
              tab === 'projects' ? 'border-[#6C47FF] text-white' : 'border-transparent text-[#888899] hover:text-white'
            }`}
          >
            Generation Runs
          </button>
          <button
            onClick={() => setTab('my-ideas')}
            className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
              tab === 'my-ideas' ? 'border-[#6C47FF] text-white' : 'border-transparent text-[#888899] hover:text-white'
            }`}
          >
            My Ideas
          </button>
        </div>

        {/* Tab content: Generation Runs */}
        {tab === 'projects' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {projects.length ? projects.map((p) => (
              <div key={p.id} className="border-2 border-[#111118] bg-[#111118] p-6 hover:border-[#6C47FF] hover:shadow-[4px_4px_0px_#6C47FF] transition-all flex flex-col group">

                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-black text-white">{p.name}</h3>
                  <span className="px-2 py-1 border border-[#6C47FF]/30 bg-[#6C47FF]/10 text-[#6C47FF] text-xs font-bold uppercase">
                    {p.industry}
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-6">
                  <span className={`px-2 py-1 text-xs font-bold uppercase border ${
                    p.status === 'Complete' ? 'border-[#00D4AA]/30 bg-[#00D4AA]/10 text-[#00D4AA]' :
                    p.status === 'Draft' ? 'border-amber-500/30 bg-amber-500/10 text-amber-500' :
                    'border-[#FF4D4F]/30 bg-[#FF4D4F]/10 text-[#FF4D4F]'
                  }`}>
                    {p.status}
                  </span>
                  <span className="text-xs text-[#888899] font-medium">Created {p.date} • {p.updated}</span>
                </div>

                {p.progress && (
                  <div className="mb-6">
                    <div className="flex justify-between text-xs font-bold text-[#888899] mb-2 uppercase">
                      <span>Progress</span>
                      <span>{p.progress}</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#0A0A0F]">
                      <div className="h-full bg-amber-500 w-[50%]"></div>
                    </div>
                  </div>
                )}

                <div className="mt-auto flex items-center justify-between pt-6 border-t border-[#0A0A0F]">
                  <button
                    onClick={() => p.status === 'Complete' ? navigate('results') : navigate('progress')}
                    className="text-sm font-bold text-[#F0F0F0] hover:text-[#00D4AA] flex items-center gap-2 transition-colors"
                  >
                    {p.status === 'Complete' ? 'View Results' : p.status === 'Failed' ? 'View Error' : 'Resume'} <ArrowRight className="w-4 h-4" />
                  </button>
                  <button className="text-[#888899] hover:text-white transition-colors">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>

              </div>
            )) : (
              <div className="col-span-full border-2 border-[#111118] bg-[#111118] p-8 text-[#888899]">
                No project snapshots yet. Start a generation run and your live startup package will appear here.
              </div>
            )}
          </div>
        )}

        {/* Tab content: My Ideas */}
        {tab === 'my-ideas' && (
          <>
            {myIdeasError && (
              <div className="mb-6 border-2 border-[#FF4D4F]/30 bg-[#FF4D4F]/10 text-[#FF4D4F] px-5 py-3 text-sm font-bold flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#FF4D4F] animate-pulse shrink-0" />
                {myIdeasError}
              </div>
            )}

            {myIdeasLoading ? (
              <div className="border-2 border-[#111118] bg-[#111118] p-12 flex items-center justify-center gap-3 text-[#888899]">
                <div
                  className="w-4 h-4 border-2 border-[#888899]/30 border-t-[#888899] rounded-full"
                  style={{ animation: 'spin 0.8s linear infinite' }}
                />
                <span className="text-sm font-bold">Loading your ideas…</span>
              </div>
            ) : myIdeas.length === 0 && !myIdeasError ? (
              <div className="border-2 border-[#111118] bg-[#111118] p-8 text-[#888899]">
                You haven't published any ideas to the community yet. Generate a startup idea and publish it from the results page.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {myIdeas.map((idea) => {
                  const totalReactions = idea.reaction_counts.upvote + idea.reaction_counts.would_use + idea.reaction_counts.have_this_problem;
                  const isExpanded = expandedInterests.has(idea.id);

                  return (
                    <div key={idea.id} className="border-2 border-[#111118] bg-[#111118] hover:border-[#6C47FF] transition-all">
                      {/* Idea row */}
                      <div className="p-6 flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <button
                              onClick={() => rrNavigate(`/ideas/${idea.id}`)}
                              className="text-lg font-black text-white hover:text-[#00D4AA] transition-colors text-left"
                            >
                              {idea.title}
                            </button>
                            {idea.domain && (
                              <span className="px-2 py-1 border border-[#6C47FF]/30 bg-[#6C47FF]/10 text-[#6C47FF] text-xs font-bold uppercase">
                                {idea.domain}
                              </span>
                            )}
                            <span className={`px-2 py-1 text-xs font-bold uppercase border ${
                              idea.is_public
                                ? 'border-[#00D4AA]/30 bg-[#00D4AA]/10 text-[#00D4AA]'
                                : 'border-[#888899]/30 bg-[#888899]/10 text-[#888899]'
                            }`}>
                              {idea.is_public ? 'Public' : 'Private'}
                            </span>
                          </div>
                          {idea.one_liner && (
                            <p className="text-sm text-[#888899] leading-relaxed line-clamp-1 mb-3">{idea.one_liner}</p>
                          )}

                          {/* Stats */}
                          <div className="flex items-center gap-5 text-xs font-medium text-[#888899]">
                            <span className="flex items-center gap-1.5">
                              <ArrowBigUp className="w-3.5 h-3.5" />
                              <span className="font-bold text-white">{idea.reaction_counts.upvote}</span> upvotes
                            </span>
                            <span className="flex items-center gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span className="font-bold text-white">{idea.comment_count}</span> comments
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5" />
                              <span className="font-bold text-white">{totalReactions}</span> reactions
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Hand className="w-3.5 h-3.5" />
                              <span className="font-bold text-white">{idea.interest_count}</span> interested
                            </span>
                            <span className="text-[#555566]">·</span>
                            <span>{relativeTime(idea.created_at)}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => rrNavigate(`/ideas/${idea.id}`)}
                          className="text-sm font-bold text-[#F0F0F0] hover:text-[#00D4AA] flex items-center gap-2 transition-colors shrink-0"
                        >
                          View <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Interests toggle (owner-only data) */}
                      {idea.interests.length > 0 && (
                        <>
                          <button
                            onClick={() => toggleInterests(idea.id)}
                            className="w-full px-6 py-3 border-t border-[#0A0A0F] flex items-center justify-between text-xs font-bold text-[#888899] uppercase tracking-widest hover:text-white transition-colors"
                          >
                            <span className="flex items-center gap-2">
                              <Hand className="w-3.5 h-3.5 text-[#6C47FF]" />
                              {idea.interests.length} interested {idea.interests.length === 1 ? 'person' : 'people'}
                            </span>
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>

                          {isExpanded && (
                            <div className="px-6 pb-5 flex flex-col gap-3">
                              {idea.interests.map((it) => (
                                <div key={it.id} className="flex items-start gap-3 bg-[#0A0A0F] border border-[#111118] p-3">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      {it.user.username ? (
                                        <button
                                          onClick={() => rrNavigate(`/users/${it.user.username}`)}
                                          className="text-sm font-bold text-white hover:text-[#00D4AA] transition-colors"
                                        >
                                          {it.user.name || it.user.username}
                                        </button>
                                      ) : (
                                        <span className="text-sm font-bold text-white">{it.user.name || 'Anonymous'}</span>
                                      )}
                                      <span className="text-xs text-[#555566]">{relativeTime(it.created_at)}</span>
                                    </div>
                                    {it.message && (
                                      <p className="text-xs text-[#888899] leading-relaxed mt-1">{it.message}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

      </main>
    </div>
  );
}
