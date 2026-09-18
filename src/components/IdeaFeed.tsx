import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowBigUp, MessageSquare, Users, CheckCircle2, Clock, ArrowRight, Shield, Trash2 } from 'lucide-react';
import { useAuth } from '../auth';
import GlobalNavbar from './GlobalNavbar';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
const PAGE_SIZE = 20;

type Owner = { id: string; username: string | null; name: string | null; picture: string | null };
type ReactionCounts = { upvote: number; would_use: number; have_this_problem: number };
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
  reaction_counts: ReactionCounts;
  comment_count: number;
  interest_count: number;
};

type SortKey = 'top' | 'newest';

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

function UserAvatar({ picture, name, size = 32 }: { picture: string | null; name: string | null; size?: number }) {
  const initials = name
    ?.split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase() || '?';

  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundImage: picture ? `url('${picture}')` : undefined,
      }}
      className="rounded-full bg-cover bg-center border-2 border-transparent group-hover:border-[#6C47FF] transition-all duration-200"
      title={name || 'User'}
    >
      {!picture && (
        <div
          className="w-full h-full rounded-full flex items-center justify-center text-xs font-bold bg-gradient-to-br from-[#6C47FF] to-[#00D4AA] text-white"
          style={{ fontSize: size / 2.5 }}
        >
          {initials}
        </div>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="border border-white/[0.06] bg-[#111118] hover:bg-[#1A1A22] p-6 flex flex-col animate-pulse transition-colors rounded-lg">
      <div className="flex items-start gap-4 mb-4">
        <div className="h-8 w-8 bg-[#0A0A0F] rounded-full animate-shimmer" />
        <div className="flex-1">
          <div className="h-6 w-3/4 bg-[#0A0A0F] rounded animate-shimmer mb-2" />
          <div className="h-4 w-1/2 bg-[#0A0A0F] rounded animate-shimmer" />
        </div>
      </div>
      <div className="h-4 w-full bg-[#0A0A0F] rounded mb-2 animate-shimmer" />
      <div className="h-4 w-2/3 bg-[#0A0A0F] rounded mb-4 animate-shimmer" />
      <div className="flex items-center gap-2 mb-6">
        <div className="h-5 w-16 bg-[#0A0A0F] rounded animate-shimmer" />
        <div className="h-5 w-12 bg-[#0A0A0F] rounded animate-shimmer" />
      </div>
      <div className="mt-auto pt-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-4">
          <div className="h-4 w-10 bg-[#0A0A0F] rounded animate-shimmer" />
          <div className="h-4 w-10 bg-[#0A0A0F] rounded animate-shimmer" />
          <div className="h-4 w-10 bg-[#0A0A0F] rounded animate-shimmer" />
        </div>
      </div>
    </div>
  );
}

export default function IdeaFeed({ onOpenIdea }: { onOpenIdea?: (id: string) => void }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('All');
  const [sort, setSort] = useState<SortKey>('top');
  const [hasMore, setHasMore] = useState(true);
  const [deletingIdeaId, setDeletingIdeaId] = useState<string | null>(null);
  const offsetRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const fetchIdeas = useCallback(async (reset: boolean) => {
    if (reset) {
      setLoading(true);
      setIdeas([]);
      offsetRef.current = 0;
      setHasMore(true);
    } else {
      setLoadingMore(true);
    }
    setError('');

    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(offsetRef.current),
        sort,
      });
      if (selectedDomain !== 'All') params.set('domain', selectedDomain);

      const res = await fetch(`${API_URL}/api/ideas?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error(`Failed to load ideas (${res.status})`);
      const data = await res.json();
      const newIdeas: Idea[] = Array.isArray(data.ideas) ? data.ideas : [];

      if (reset) {
        setIdeas(newIdeas);
      } else {
        setIdeas((prev) => [...prev, ...newIdeas]);
      }

      offsetRef.current += newIdeas.length;
      setHasMore(newIdeas.length >= PAGE_SIZE);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load ideas.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [sort, selectedDomain]);

  const handleDeleteIdea = async (e: React.MouseEvent, ideaId: string, ideaTitle: string) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${ideaTitle}"? This cannot be undone.`)) return;

    setDeletingIdeaId(ideaId);
    try {
      const res = await fetch(`${API_URL}/api/ideas/${ideaId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`Failed to delete idea (${res.status})`);
      setIdeas((prev) => prev.filter((idea) => idea.id !== ideaId));
    } catch (err: any) {
      setError(err?.message ?? 'Failed to delete idea.');
    } finally {
      setDeletingIdeaId(null);
    }
  };

  useEffect(() => {
    fetchIdeas(true);
  }, [fetchIdeas]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          fetchIdeas(false);
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, fetchIdeas]);

  // Collect unique domains from loaded ideas for the dropdown
  const domains = useMemo<string[]>(() => {
    const set = new Set<string>();
    for (const idea of ideas) {
      if (idea.domain?.trim()) set.add(idea.domain.trim());
    }
    return [...set].sort();
  }, [ideas]);

  return (
    <div className="min-h-screen bg-[#07070C] text-[#F0F0F0] flex flex-col font-sans">
      <GlobalNavbar />

      <main className="flex-1 w-full max-w-[1400px] mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <h1 className="text-4xl font-black text-white tracking-tight">Community Ideas</h1>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] mb-8 flex-wrap pb-4">
          {/* Sort tabs */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => setSort('top')}
              className={`pb-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
                sort === 'top' ? 'border-[#6C47FF] text-white' : 'border-transparent text-[#888899] hover:text-white'
              }`}
            >
              <ArrowBigUp className="w-4 h-4" /> Top
            </button>
            <button
              onClick={() => setSort('newest')}
              className={`pb-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
                sort === 'newest' ? 'border-[#6C47FF] text-white' : 'border-transparent text-[#888899] hover:text-white'
              }`}
            >
              <Clock className="w-4 h-4" /> Newest
            </button>
          </div>

          {/* Domain filter dropdown */}
          <div className="flex items-center gap-3 pb-2">
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="bg-[#111118] border border-white/[0.08] text-[#F0F0F0] px-4 py-2 text-sm font-bold focus:outline-none focus:border-[#6C47FF] transition-colors cursor-pointer rounded-lg"
            >
              <option value="All">All Domains</option>
              {domains.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-6 border border-[#FF6B6B]/30 bg-[#FF6B6B]/10 text-[#FF6B6B] px-5 py-3 text-sm font-bold flex items-center gap-3 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-[#FF6B6B] animate-pulse shrink-0" />
            {error}
          </div>
        )}

        {/* Skeleton loading state */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : ideas.length === 0 && !error ? (
          /* Empty state */
          <div className="border border-white/[0.06] bg-[#111118] p-8 text-center rounded-lg">
            <p className="text-[#888899] font-bold text-sm">
              {selectedDomain !== 'All'
                ? `No ideas yet in ${selectedDomain} — be the first to publish one.`
                : 'No ideas yet — be the first to publish one.'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {ideas.map((idea) => (
                <div
                  key={idea.id}
                  onClick={() => onOpenIdea?.(idea.id)}
                  className="group border border-white/[0.06] bg-[#111118] hover:bg-[#1A1A22] hover:border-white/[0.12] p-6 flex flex-col cursor-pointer transition-all duration-200 rounded-lg hover:shadow-[0_0_20px_rgba(108,71,255,0.15)]"
                >
                  {/* Creator Info */}
                  <div className="flex items-start gap-3 mb-4">
                    <UserAvatar picture={idea.owner?.picture} name={idea.owner?.name} size={32} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (idea.owner?.username) navigate(`/users/${idea.owner.username}`);
                          }}
                          className="font-bold text-[#F0F0F0] hover:text-[#00D4AA] transition-colors truncate text-sm"
                        >
                          {idea.owner?.name || idea.owner?.username || 'Anonymous'}
                        </button>
                        <Shield className="w-4 h-4 text-[#00D4AA] shrink-0" />
                      </div>
                      <span className="text-xs text-[#555566]">{relativeTime(idea.created_at)}</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-black text-white line-clamp-2 leading-tight mb-3 group-hover:text-[#00D4AA] transition-colors">
                    {idea.title}
                  </h3>

                  {/* One-liner */}
                  {idea.one_liner && (
                    <p className="text-sm text-[#888899] leading-relaxed line-clamp-2 mb-4">{idea.one_liner}</p>
                  )}

                  {/* Badges */}
                  <div className="flex items-center gap-2 mb-6 flex-wrap">
                    {idea.domain && (
                      <span className="px-3 py-1.5 border border-[#6C47FF]/30 bg-[#6C47FF]/10 text-[#6C47FF] text-xs font-bold rounded-md">
                        {idea.domain}
                      </span>
                    )}
                    {idea.ai_validation_score != null ? (
                      <span className={`px-3 py-1.5 text-xs font-bold rounded-md border flex items-center gap-1 ${
                        idea.ai_validation_score >= 70
                          ? 'border-[#00D4AA]/30 bg-[#00D4AA]/10 text-[#00D4AA]'
                          : idea.ai_validation_score >= 40
                          ? 'border-amber-500/30 bg-amber-500/10 text-amber-500'
                          : 'border-[#FF6B6B]/30 bg-[#FF6B6B]/10 text-[#FF6B6B]'
                      }`}>
                        <CheckCircle2 className="w-3 h-3" />
                        {Math.round(idea.ai_validation_score)}
                      </span>
                    ) : (
                      <span className="px-3 py-1.5 text-xs font-bold rounded-md border border-[#888899]/30 bg-[#888899]/10 text-[#888899]">
                        Unvalidated
                      </span>
                    )}
                  </div>

                  {/* Footer - Engagement metrics */}
                  <div className="mt-auto pt-4 border-t border-white/[0.06]">
                    <div className="flex items-center gap-4 text-xs font-medium text-[#888899] mb-3">
                      <span className="flex items-center gap-1.5 hover:text-[#6C47FF] transition-colors" title="Upvotes">
                        <ArrowBigUp className="w-4 h-4" />
                        <span>{idea.reaction_counts.upvote}</span>
                      </span>
                      <span className="flex items-center gap-1.5 hover:text-[#00D4AA] transition-colors" title="Comments">
                        <MessageSquare className="w-4 h-4" />
                        <span>{idea.comment_count}</span>
                      </span>
                      <span className="flex items-center gap-1.5 hover:text-[#6C47FF] transition-colors" title="Interested">
                        <Users className="w-4 h-4" />
                        <span>{idea.interest_count}</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#555566]">
                        {idea.reaction_counts.upvote} people interested
                      </span>
                      <div className="flex items-center gap-2">
                        {user?.username === idea.owner?.username && (
                          <button
                            onClick={(e) => handleDeleteIdea(e, idea.id, idea.title)}
                            disabled={deletingIdeaId === idea.id}
                            className="text-[#888899] hover:text-[#FF4D4F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed opacity-0 group-hover:opacity-100"
                            title="Delete idea"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <span className="text-sm font-bold text-[#6C47FF] flex items-center gap-1 transition-colors opacity-0 group-hover:opacity-100">
                          View <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Loading more skeletons while fetching next page */}
              {loadingMore && (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              )}
            </div>

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-1" />

            {!hasMore && ideas.length > 0 && (
              <div className="mt-8 text-center text-xs font-bold text-[#555566] uppercase tracking-widest">
                You've seen all ideas
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
