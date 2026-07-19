import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowBigUp,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Users,
  ArrowLeft,
  GitFork,
  Hand,
  X,
} from 'lucide-react';
import GlobalNavbar from './GlobalNavbar';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

type Owner = { id: string; username: string | null; name: string | null; picture: string | null };
type ReactionCounts = { upvote: number; would_use: number; have_this_problem: number };
type Comment = {
  id: string;
  idea_id: string;
  author: Owner;
  content: string;
  created_at: string;
  parent_comment_id: string | null;
  replies: Comment[];
};
type Idea = {
  id: string;
  title: string;
  one_liner: string | null;
  description: string | null;
  domain: string | null;
  owner: Owner;
  created_at: string;
  is_public: boolean;
  ai_validation_score: number | null;
  ai_summary_json: any | null;
  reaction_counts: ReactionCounts;
  comment_count: number;
  interest_count: number;
  forked_from_id: string | null;
  fork_count: number;
};
type ForkSummary = { id: string; title: string; owner: Owner; created_at: string };
type Interest = {
  id: string;
  message: string | null;
  created_at: string;
  user: Owner | null;
};

type ReactionType = 'upvote' | 'would_use' | 'have_this_problem';

function relativeTime(iso: string): string {
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

function Section({
  title,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: any;
}) {
  return (
    <div className="border-2 border-[#111118] bg-[#111118]">
      <button
        onClick={onToggle}
        className="w-full p-5 flex items-center justify-between bg-[#0A0A0F] border-b-2 border-[#111118] hover:border-[#6C47FF] transition-colors"
      >
        <h2 className="text-sm font-black text-white uppercase tracking-widest">{title}</h2>
        <ChevronDown className={`w-4 h-4 text-[#888899] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && <div className="p-5 flex flex-col gap-5">{children}</div>}
    </div>
  );
}

function Field({ label, value }: { label: string; value: any }) {
  if (value == null || value === '') return null;
  return (
    <div>
      <div className="text-xs font-bold text-[#888899] uppercase tracking-widest mb-1">{label}</div>
      <div className="text-sm text-[#F0F0F0] leading-relaxed">{value}</div>
    </div>
  );
}

const THREAT_BADGE: Record<string, string> = {
  High: 'border-[#FF4D4F]/30 bg-[#FF4D4F]/10 text-[#FF4D4F]',
  Medium: 'border-amber-500/30 bg-amber-500/10 text-amber-500',
  Low: 'border-[#00D4AA]/30 bg-[#00D4AA]/10 text-[#00D4AA]',
};

export default function IdeaDetail({
  ideaId,
  onBack,
  onOpenIdea,
}: {
  ideaId: string;
  onBack?: () => void;
  onOpenIdea?: (id: string) => void;
}) {
  const navigate = useNavigate();
  const [idea, setIdea] = useState<Idea | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [counts, setCounts] = useState<ReactionCounts>({ upvote: 0, would_use: 0, have_this_problem: 0 });
  const [myReactions, setMyReactions] = useState<Set<string>>(new Set());

  const [open, setOpen] = useState<Record<string, boolean>>({
    market: true,
    icp: true,
    competitors: true,
    business: true,
    mvp: true,
  });

  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [posting, setPosting] = useState(false);

  const [contributors, setContributors] = useState<Interest[]>([]);
  const [contributorsVisible, setContributorsVisible] = useState(false);

  const [forks, setForks] = useState<ForkSummary[]>([]);
  const [forking, setForking] = useState(false);

  // Express Interest modal state
  const [interestOpen, setInterestOpen] = useState(false);
  const [interestMsg, setInterestMsg] = useState('');
  const [interestSubmitting, setInterestSubmitting] = useState(false);
  const [interestSent, setInterestSent] = useState(false);

  async function fetchDetail(showLoading = true) {
    if (showLoading) setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/ideas/${ideaId}`, { credentials: 'include' });
      if (res.status === 404) throw new Error('This idea could not be found.');
      if (!res.ok) throw new Error(`Failed to load idea (${res.status})`);
      const data = await res.json();
      setIdea(data.idea);
      setComments(Array.isArray(data.comments) ? data.comments : []);
      if (data.idea?.reaction_counts) setCounts(data.idea.reaction_counts);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load idea.');
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  useEffect(() => {
    fetchDetail();
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/ideas/${ideaId}/interest`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setContributors(Array.isArray(data.interests) ? data.interests : []);
          setContributorsVisible(true);
        } else {
          setContributorsVisible(false);
        }
      } catch {
        setContributorsVisible(false);
      }
    })();
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/ideas/${ideaId}/forks`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setForks(Array.isArray(data.forks) ? data.forks : []);
        }
      } catch {
        /* non-fatal */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ideaId]);

  async function handleFork() {
    setForking(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/ideas/${ideaId}/fork`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.status === 401) throw new Error('Sign in to fork this idea.');
      if (!res.ok) throw new Error((await res.text()) || 'Failed to fork idea.');
      const newIdea = await res.json();
      if (onOpenIdea) onOpenIdea(newIdea.id);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to fork idea.');
    } finally {
      setForking(false);
    }
  }

  async function handleReact(type: ReactionType) {
    setError('');
    // Optimistic update
    const wasActive = myReactions.has(type);
    const optimisticCounts = { ...counts };
    if (wasActive) {
      optimisticCounts[type] = Math.max(0, optimisticCounts[type] - 1);
    } else {
      optimisticCounts[type] = optimisticCounts[type] + 1;
    }
    const optimisticReactions = new Set(myReactions);
    if (wasActive) optimisticReactions.delete(type);
    else optimisticReactions.add(type);

    setCounts(optimisticCounts);
    setMyReactions(optimisticReactions);

    try {
      const res = await fetch(`${API_URL}/api/ideas/${ideaId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type }),
      });
      if (res.status === 401) {
        // Revert on auth error
        setCounts(counts);
        setMyReactions(myReactions);
        setError('Sign in to react to this idea.');
        return;
      }
      if (!res.ok) {
        setCounts(counts);
        setMyReactions(myReactions);
        setError((await res.text()) || 'Failed to react.');
        return;
      }
      const data = await res.json();
      setCounts(data.reaction_counts);
      setMyReactions(new Set<string>(data.user_reactions ?? []));
    } catch (err: any) {
      setCounts(counts);
      setMyReactions(myReactions);
      setError(err?.message ?? 'Failed to react.');
    }
  }

  async function submitComment(parentId: string | null, text: string) {
    if (!text.trim()) return;
    setPosting(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/ideas/${ideaId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: text, parent_comment_id: parentId }),
      });
      if (res.status === 401) throw new Error('Sign in to comment.');
      if (!res.ok) throw new Error((await res.text()) || 'Failed to post comment.');
      if (parentId) {
        setReplyText('');
        setReplyTo(null);
      } else {
        setCommentText('');
      }
      await fetchDetail(false);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to post comment.');
    } finally {
      setPosting(false);
    }
  }

  async function handleExpressInterest() {
    setInterestSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/ideas/${ideaId}/interest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: interestMsg.trim() || null }),
      });
      if (res.status === 401) throw new Error('Sign in to express interest.');
      if (!res.ok) throw new Error((await res.text()) || 'Failed to express interest.');
      setInterestSent(true);
      setInterestOpen(false);
      setInterestMsg('');
      // Bump the local interest count
      if (idea) setIdea({ ...idea, interest_count: idea.interest_count + 1 });
    } catch (err: any) {
      setError(err?.message ?? 'Failed to express interest.');
    } finally {
      setInterestSubmitting(false);
    }
  }

  const toggle = (key: string) => setOpen((o) => ({ ...o, [key]: !o[key] }));

  const summary = idea?.ai_summary_json ?? null;
  const market = summary?.market ?? null;
  const business = summary?.business ?? null;
  const financials = summary?.financials ?? null;
  const mvp = summary?.mvp ?? null;
  const competitors: any[] = Array.isArray(market?.competitors) ? market.competitors : [];

  const reactionButton = (
    type: ReactionType,
    label: string,
    Icon: any,
    count: number,
    accent: { border: string; text: string; activeBg: string; activeText: string; hover: string },
  ) => {
    const active = myReactions.has(type);
    return (
      <button
        onClick={() => handleReact(type)}
        className={`px-4 py-2.5 border-2 font-bold text-sm transition-all flex items-center gap-2 ${
          active
            ? `${accent.activeBg} ${accent.border} ${accent.activeText}`
            : `bg-transparent ${accent.border} ${accent.text} ${accent.hover}`
        }`}
      >
        <Icon className="w-4 h-4" />
        {label}
        <span className="font-mono">{count}</span>
      </button>
    );
  };

  function renderComment(c: Comment, depth: number) {
    return (
      <div key={c.id} className={depth > 0 ? 'mt-4 pl-4 border-l-2 border-[#111118]' : 'mt-5'}>
        <div className="flex items-center gap-2 mb-1">
          {c.author?.username ? (
            <button
              onClick={() => navigate(`/users/${c.author.username}`)}
              className="text-sm font-bold text-white hover:text-[#00D4AA] transition-colors"
            >
              {c.author.name || c.author.username}
            </button>
          ) : (
            <span className="text-sm font-bold text-white">{c.author?.name || 'Anonymous'}</span>
          )}
          <span className="text-xs text-[#555566] font-medium">{relativeTime(c.created_at)}</span>
        </div>
        <p className="text-sm text-[#F0F0F0]/90 leading-relaxed whitespace-pre-wrap">{c.content}</p>
        <button
          onClick={() => {
            setReplyTo(replyTo === c.id ? null : c.id);
            setReplyText('');
          }}
          className="mt-1 text-xs font-bold text-[#888899] hover:text-[#00D4AA] transition-colors"
        >
          Reply
        </button>

        {replyTo === c.id && (
          <div className="mt-3 flex flex-col gap-2">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Reply to ${c.author?.name || 'this comment'}…`}
              className="w-full h-[70px] bg-[#0A0A0F] border border-[#111118] text-[#F0F0F0] px-4 py-2 text-sm focus:outline-none focus:border-[#6C47FF] transition-colors resize-none"
            />
            <div className="flex items-center gap-3">
              <button
                onClick={() => submitComment(c.id, replyText)}
                disabled={posting || !replyText.trim()}
                className="px-4 py-2 bg-[#6C47FF] border-2 border-[#6C47FF] text-white font-bold text-xs hover:bg-[#111118] hover:text-[#6C47FF] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reply
              </button>
              <button
                onClick={() => setReplyTo(null)}
                className="text-xs font-bold text-[#888899] hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {c.replies?.length ? c.replies.map((r) => renderComment(r, depth + 1)) : null}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F0F0F0] flex flex-col font-sans pb-12">
      <GlobalNavbar />

      {/* Express Interest Modal */}
      {interestOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setInterestOpen(false)} />
          <div className="relative w-full max-w-md border-2 border-[#111118] bg-[#0A0A0F] shadow-[8px_8px_0px_#6C47FF]">
            <div className="p-5 border-b-2 border-[#111118] flex items-center justify-between">
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Express Interest</h3>
              <button onClick={() => setInterestOpen(false)} className="text-[#888899] hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <p className="text-sm text-[#888899]">
                Let the idea owner know you're interested in contributing or collaborating.
              </p>
              <textarea
                value={interestMsg}
                onChange={(e) => setInterestMsg(e.target.value)}
                placeholder="Optional message — introduce yourself, share what you can contribute…"
                className="w-full h-[100px] bg-[#111118] border border-[#111118] text-[#F0F0F0] px-4 py-3 text-sm focus:outline-none focus:border-[#6C47FF] transition-colors resize-none"
              />
              <div className="flex items-center gap-3">
                <button
                  onClick={handleExpressInterest}
                  disabled={interestSubmitting}
                  className="px-5 py-2.5 bg-[#6C47FF] border-2 border-[#6C47FF] text-white font-bold text-sm hover:bg-[#111118] hover:text-[#6C47FF] shadow-[4px_4px_0px_#00D4AA] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {interestSubmitting ? 'Sending…' : 'Send Interest'}
                </button>
                <button
                  onClick={() => setInterestOpen(false)}
                  className="text-sm font-bold text-[#888899] hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 w-full max-w-[1400px] mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-bold text-[#888899] uppercase tracking-widest mb-6">
          <button className="hover:text-white transition-colors flex items-center gap-1" onClick={() => onBack?.()}>
            <ArrowLeft className="w-3 h-3" /> Community
          </button>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#6C47FF] truncate max-w-[300px]">{idea?.title ?? 'Idea'}</span>
        </div>

        {error && (
          <div className="mb-6 border-2 border-[#FF4D4F]/30 bg-[#FF4D4F]/10 text-[#FF4D4F] px-4 py-3 text-sm font-bold flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#FF4D4F] animate-pulse shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="border-2 border-[#111118] bg-[#111118] p-12 flex items-center justify-center gap-3 text-[#888899]">
            <div
              className="w-4 h-4 border-2 border-[#888899]/30 border-t-[#888899] rounded-full"
              style={{ animation: 'spin 0.8s linear infinite' }}
            />
            <span className="text-sm font-bold">Loading idea…</span>
          </div>
        ) : !idea ? null : (
          <>
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <h1 className="text-3xl font-black text-white tracking-tight">{idea.title}</h1>
                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    {idea.domain && (
                      <span className="px-2 py-1 border border-[#6C47FF]/30 bg-[#6C47FF]/10 text-[#6C47FF] text-xs font-bold uppercase">
                        {idea.domain}
                      </span>
                    )}
                    {idea.ai_validation_score != null ? (
                      <span className={`px-2 py-1 text-xs font-bold uppercase border flex items-center gap-1 ${
                        idea.ai_validation_score >= 70
                          ? 'border-[#00D4AA]/30 bg-[#00D4AA]/10 text-[#00D4AA]'
                          : idea.ai_validation_score >= 40
                          ? 'border-amber-500/30 bg-amber-500/10 text-amber-500'
                          : 'border-[#FF4D4F]/30 bg-[#FF4D4F]/10 text-[#FF4D4F]'
                      }`}>
                        <CheckCircle2 className="w-3 h-3" /> Validated {Math.round(idea.ai_validation_score)}
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-bold uppercase border border-[#888899]/30 bg-[#888899]/10 text-[#888899]">
                        Unvalidated
                      </span>
                    )}
                    <span className="text-xs text-[#555566] font-medium">
                      by{' '}
                      {idea.owner?.username ? (
                        <button
                          onClick={() => navigate(`/users/${idea.owner.username}`)}
                          className="hover:text-[#00D4AA] transition-colors"
                        >
                          {idea.owner.name || idea.owner.username}
                        </button>
                      ) : (
                        idea.owner?.name || 'Anonymous'
                      )}
                      {' '}· {relativeTime(idea.created_at)}
                    </span>
                    {idea.forked_from_id && (
                      <button
                        onClick={() => onOpenIdea?.(idea.forked_from_id as string)}
                        className="text-xs font-bold text-[#888899] hover:text-[#00D4AA] transition-colors flex items-center gap-1"
                      >
                        <GitFork className="w-3 h-3" /> Forked from original
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => setInterestOpen(true)}
                    disabled={interestSent}
                    className="px-5 py-2.5 bg-[#6C47FF] border-2 border-[#6C47FF] text-white font-bold text-sm hover:bg-[#111118] hover:text-[#6C47FF] shadow-[4px_4px_0px_#00D4AA] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Hand className="w-4 h-4" /> {interestSent ? 'Interest Sent' : 'Express Interest'}
                  </button>
                  <button
                    onClick={handleFork}
                    disabled={forking}
                    className="px-5 py-2.5 bg-transparent border-2 border-[#00D4AA] text-[#00D4AA] font-bold text-sm hover:bg-[#00D4AA] hover:text-[#0A0A0F] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <GitFork className="w-4 h-4" /> {forking ? 'Forking…' : 'Fork'}
                  </button>
                </div>
              </div>

              {/* Reaction buttons */}
              <div className="flex items-center gap-3 mt-6 flex-wrap">
                {reactionButton('upvote', 'Upvote', ArrowBigUp, counts.upvote, {
                  border: 'border-[#6C47FF]',
                  text: 'text-[#6C47FF]',
                  activeBg: 'bg-[#6C47FF]',
                  activeText: 'text-white',
                  hover: 'hover:bg-[#6C47FF] hover:text-white',
                })}
                {reactionButton('would_use', 'Would Use', CheckCircle2, counts.would_use, {
                  border: 'border-[#00D4AA]',
                  text: 'text-[#00D4AA]',
                  activeBg: 'bg-[#00D4AA]',
                  activeText: 'text-[#0A0A0F]',
                  hover: 'hover:bg-[#00D4AA] hover:text-[#0A0A0F]',
                })}
                {reactionButton('have_this_problem', 'Have This Problem', AlertTriangle, counts.have_this_problem, {
                  border: 'border-amber-500',
                  text: 'text-amber-500',
                  activeBg: 'bg-amber-500',
                  activeText: 'text-[#0A0A0F]',
                  hover: 'hover:bg-amber-500 hover:text-[#0A0A0F]',
                })}
              </div>
            </div>

            {/* Main + sidebar */}
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6">
              {/* Main column — AI validation summary */}
              <div className="flex flex-col gap-6 min-w-0">
                {!summary ? (
                  <div className="border-2 border-[#111118] bg-[#111118] p-8 text-center text-sm font-bold text-[#888899]">
                    This idea was published without an AI validation summary.
                  </div>
                ) : (
                  <>
                    <Section title="Market Analysis" isOpen={open.market} onToggle={() => toggle('market')}>
                      {market ? (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Field label="TAM" value={market.tam} />
                            <Field label="SAM" value={market.sam} />
                            <Field label="SOM" value={market.som} />
                          </div>
                          <Field label="Source" value={market.tam_source} />
                          {Array.isArray(market.market_gaps) && market.market_gaps.length > 0 && (
                            <div>
                              <div className="text-xs font-bold text-[#888899] uppercase tracking-widest mb-2">Market Gaps</div>
                              <ul className="flex flex-col gap-2">
                                {market.market_gaps.map((g: string, i: number) => (
                                  <li key={i} className="text-sm text-[#F0F0F0] flex gap-2">
                                    <span className="text-[#6C47FF]">→</span> {g}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-sm text-[#888899]">Not available.</span>
                      )}
                    </Section>

                    <Section title="ICP" isOpen={open.icp} onToggle={() => toggle('icp')}>
                      {summary.icp ? (
                        <p className="text-sm text-[#F0F0F0] leading-relaxed">{summary.icp}</p>
                      ) : (
                        <span className="text-sm text-[#888899]">Not available.</span>
                      )}
                    </Section>

                    <Section title="Competitors" isOpen={open.competitors} onToggle={() => toggle('competitors')}>
                      {competitors.length > 0 ? (
                        <div className="flex flex-col gap-3">
                          {competitors.map((c: any, i: number) => (
                            <div
                              key={i}
                              className="flex items-center justify-between gap-4 bg-[#0A0A0F] border border-[#111118] p-3"
                            >
                              <div className="min-w-0">
                                <div className="text-sm font-bold text-white truncate">{c.name}</div>
                                {c.focus && <div className="text-xs text-[#888899] truncate">{c.focus}</div>}
                              </div>
                              {c.threat_level && (
                                <span
                                  className={`px-2 py-1 text-xs font-bold uppercase border shrink-0 ${
                                    THREAT_BADGE[c.threat_level] ?? THREAT_BADGE.Low
                                  }`}
                                >
                                  {c.threat_level}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-[#888899]">No competitors identified.</span>
                      )}
                    </Section>

                    <Section title="Business Model" isOpen={open.business} onToggle={() => toggle('business')}>
                      {business ? (
                        <>
                          <Field label="Problem" value={business.problem} />
                          <Field label="Solution" value={business.solution} />
                          <Field label="Value Proposition" value={business.value_proposition} />
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Revenue Model" value={business.revenue_model} />
                            <Field label="Pricing" value={business.pricing} />
                          </div>
                          <Field label="Go-to-Market" value={business.gtm_strategy} />
                          {financials && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#0A0A0F]">
                              <Field label="NPV" value={financials.npv} />
                              <Field label="IRR" value={financials.irr} />
                              <Field label="Payback (mo)" value={financials.payback_months} />
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-sm text-[#888899]">Not available.</span>
                      )}
                    </Section>

                    <Section title="MVP Scope" isOpen={open.mvp} onToggle={() => toggle('mvp')}>
                      {mvp ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <Field label="Timeline (weeks)" value={mvp.estimated_weeks} />
                          <Field label="Est. Cost" value={mvp.estimated_cost_inr} />
                          <Field label="Team Size" value={mvp.team_size} />
                        </div>
                      ) : (
                        <span className="text-sm text-[#888899]">Not available.</span>
                      )}
                    </Section>
                  </>
                )}
              </div>

              {/* Sidebar */}
              <div className="flex flex-col gap-6">
                {/* About */}
                <div className="border-2 border-[#111118] bg-[#111118] p-5">
                  <div className="text-xs font-black text-[#888899] uppercase tracking-widest mb-3">About</div>
                  {idea.one_liner && <p className="text-sm text-[#F0F0F0] leading-relaxed mb-4">{idea.one_liner}</p>}
                  {idea.domain && (
                    <span className="px-2 py-1 border border-[#6C47FF]/30 bg-[#6C47FF]/10 text-[#6C47FF] text-xs font-bold uppercase">
                      {idea.domain}
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="border-2 border-[#111118] bg-[#111118] p-5">
                  <div className="text-xs font-black text-[#888899] uppercase tracking-widest mb-4">Stats</div>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-[#888899] font-medium">
                        <ArrowBigUp className="w-4 h-4" /> Upvotes
                      </span>
                      <span className="font-mono font-bold text-white">{counts.upvote}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-[#888899] font-medium">
                        <MessageSquare className="w-4 h-4" /> Comments
                      </span>
                      <span className="font-mono font-bold text-white">{idea.comment_count}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-[#888899] font-medium">
                        <Users className="w-4 h-4" /> Interested
                      </span>
                      <span className="font-mono font-bold text-white">{idea.interest_count}</span>
                    </div>
                  </div>
                </div>

                {/* Interested Contributors */}
                <div className="border-2 border-[#111118] bg-[#111118] p-5">
                  <div className="text-xs font-black text-[#888899] uppercase tracking-widest mb-4">
                    Interested Contributors
                  </div>
                  {contributorsVisible ? (
                    contributors.length > 0 ? (
                      <div className="flex flex-col gap-3">
                        {contributors.map((it) => (
                          <div key={it.id} className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                              {it.user?.username ? (
                                <button
                                  onClick={() => navigate(`/users/${it.user!.username}`)}
                                  className="text-sm font-bold text-white hover:text-[#00D4AA] transition-colors"
                                >
                                  {it.user.name || it.user.username}
                                </button>
                              ) : (
                                <span className="text-sm font-bold text-white">{it.user?.name || 'Anonymous'}</span>
                              )}
                              <span className="text-xs text-[#555566]">{relativeTime(it.created_at)}</span>
                            </div>
                            {it.message && <p className="text-xs text-[#888899] leading-relaxed">{it.message}</p>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-[#888899]">No one yet — be the first.</span>
                    )
                  ) : (
                    <span className="text-sm text-[#888899]">
                      {idea.interest_count} interested. The full list is visible to the idea owner.
                    </span>
                  )}
                </div>

                {/* Forked by X people */}
                <div className="border-2 border-[#111118] bg-[#111118] p-5">
                  <div className="text-xs font-black text-[#888899] uppercase tracking-widest mb-4 flex items-center gap-2">
                    <GitFork className="w-3.5 h-3.5" />
                    Forked by {forks.length} {forks.length === 1 ? 'person' : 'people'}
                  </div>
                  {forks.length > 0 ? (
                    <div className="flex flex-col gap-3">
                      {forks.map((f) => (
                        <div key={f.id} className="group">
                          <button onClick={() => onOpenIdea?.(f.id)} className="text-left">
                            <div className="text-sm font-bold text-[#F0F0F0] group-hover:text-[#00D4AA] transition-colors truncate">
                              {f.title}
                            </div>
                          </button>
                          <div className="text-xs text-[#555566]">
                            by{' '}
                            {f.owner?.username ? (
                              <button
                                onClick={() => navigate(`/users/${f.owner.username}`)}
                                className="hover:text-[#00D4AA] transition-colors"
                              >
                                {f.owner.name || f.owner.username}
                              </button>
                            ) : (
                              f.owner?.name || 'Anonymous'
                            )}
                            {' '}· {relativeTime(f.created_at)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-[#888899]">No forks yet.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Comments */}
            <div className="mt-10 border-2 border-[#111118] bg-[#111118]">
              <div className="p-5 bg-[#0A0A0F] border-b-2 border-[#111118]">
                <h2 className="text-sm font-black text-white uppercase tracking-widest">
                  Comments <span className="text-[#555566]">({idea.comment_count})</span>
                </h2>
              </div>

              <div className="p-5">
                {/* New comment box */}
                <div className="flex flex-col gap-2">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment…"
                    className="w-full h-[90px] bg-[#0A0A0F] border border-[#111118] text-[#F0F0F0] px-4 py-3 text-sm focus:outline-none focus:border-[#6C47FF] transition-colors resize-none"
                  />
                  <div>
                    <button
                      onClick={() => submitComment(null, commentText)}
                      disabled={posting || !commentText.trim()}
                      className="px-6 py-2.5 bg-[#6C47FF] border-2 border-[#6C47FF] text-white font-black text-sm hover:bg-[#111118] hover:text-[#6C47FF] shadow-[4px_4px_0px_#00D4AA] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#6C47FF] disabled:hover:text-white"
                    >
                      {posting ? 'Posting…' : 'Comment'}
                    </button>
                  </div>
                </div>

                {/* Thread */}
                <div className="mt-4">
                  {comments.length > 0 ? (
                    comments.map((c) => renderComment(c, 0))
                  ) : (
                    <p className="text-sm text-[#888899] mt-4">No comments yet. Start the conversation.</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
