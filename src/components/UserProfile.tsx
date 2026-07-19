import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { User, Sparkles, MessageSquare, GitFork, ArrowBigUp, Search } from 'lucide-react';
import GlobalNavbar from './GlobalNavbar';
import { useRouter } from '../router';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

type Stats = { ideas_published: number; upvotes_received: number; forks_received: number };
type ProfileIdea = {
  id: string;
  title: string;
  one_liner: string | null;
  domain: string | null;
  upvotes: number;
  comment_count: number;
};
type Activity = {
  type: string;
  timestamp: string;
  idea_id: string | null;
  idea_title: string | null;
  content: string | null;
};
type Profile = {
  username: string;
  name: string | null;
  bio: string | null;
  picture: string | null;
  created_at: string;
  stats: Stats;
  top_ideas: ProfileIdea[];
  activity: Activity[];
};

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

// KPI stat card, matching the app's existing metric cards. Rendered without a
// `key` so it stays a plain child component.
function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-[#111118] border-2 border-[#111118] p-6 hover:border-[#6C47FF] transition-colors flex flex-col">
      <div className="text-xs font-bold text-[#888899] uppercase tracking-widest mb-2">{label}</div>
      <div className={`text-4xl font-black tracking-tight ${color}`}>{value.toLocaleString()}</div>
    </div>
  );
}

function activityLabel(a: Activity): { verb: string; Icon: any } {
  if (a.type === 'idea_posted') return { verb: 'Published', Icon: Sparkles };
  if (a.type === 'idea_forked') return { verb: 'Forked', Icon: GitFork };
  return { verb: 'Commented on', Icon: MessageSquare };
}

export default function UserProfile() {
  const { username } = useParams();
  const { navigatePath } = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      setNotFound(false);
      try {
        const res = await fetch(`${API_URL}/api/users/${encodeURIComponent(username ?? '')}`, {
          credentials: 'include',
        });
        if (res.status === 404) {
          if (!cancelled) setNotFound(true);
          return;
        }
        if (!res.ok) throw new Error(`Failed to load profile (${res.status})`);
        const data = await res.json();
        if (!cancelled) setProfile(data);
      } catch (err: any) {
        if (!cancelled) setError(err?.message ?? 'Failed to load profile.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [username]);

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F0F0F0] flex flex-col font-sans pb-12">
      <GlobalNavbar />

      <main className="flex-1 w-full max-w-[1400px] mx-auto px-6 py-10">
        {loading ? (
          <div className="border-2 border-[#111118] bg-[#0A0A0F] p-12 flex items-center justify-center gap-3 text-[#888899]">
            <div
              className="w-4 h-4 border-2 border-[#888899]/30 border-t-[#888899] rounded-full"
              style={{ animation: 'spin 0.8s linear infinite' }}
            />
            <span className="text-sm font-bold">Loading profile…</span>
          </div>
        ) : notFound ? (
          <div className="border-2 border-[#111118] bg-[#0A0A0F] p-12 text-center flex flex-col items-center justify-center gap-4">
            <Search className="w-8 h-8 text-[#111118]" />
            <span className="text-sm font-bold text-[#888899]">No user found for “{username}”.</span>
          </div>
        ) : error ? (
          <div className="border border-[#FF4D4F]/30 bg-[#FF4D4F]/10 text-[#FF4D4F] px-4 py-3 text-sm font-semibold flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#FF4D4F] animate-pulse shrink-0" />
            {error}
          </div>
        ) : !profile ? null : (
          <>
            {/* Header */}
            <div className="flex items-center gap-6 mb-10 flex-wrap">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#6C47FF] to-[#00D4AA] p-[2px] shrink-0">
                <div className="w-full h-full bg-[#111118] rounded-full flex items-center justify-center overflow-hidden">
                  {profile.picture ? (
                    <img src={profile.picture} alt={profile.username} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-[#F0F0F0]" />
                  )}
                </div>
              </div>
              <div className="min-w-0">
                <h1 className="text-3xl font-black text-white tracking-tight">{profile.name || profile.username}</h1>
                <div className="text-[#6C47FF] font-bold text-sm mt-0.5">@{profile.username}</div>
                <p className="text-sm text-[#888899] mt-2 max-w-2xl leading-relaxed">
                  {profile.bio || 'No bio yet.'}
                </p>
                <div className="text-xs text-[#555566] font-medium mt-2">Joined {relativeTime(profile.created_at)}</div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
              <StatCard label="Ideas Published" value={profile.stats.ideas_published} color="text-[#00D4AA]" />
              <StatCard label="Upvotes Received" value={profile.stats.upvotes_received} color="text-[#6C47FF]" />
              <StatCard label="Forks Of Their Ideas" value={profile.stats.forks_received} color="text-white" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-6">
              {/* Top ideas */}
              <div className="border-2 border-[#111118] bg-[#111118]">
                <div className="p-5 bg-[#0A0A0F] border-b-2 border-[#111118]">
                  <h2 className="text-sm font-black text-white uppercase tracking-widest">Top Ideas</h2>
                </div>
                {profile.top_ideas.length > 0 ? (
                  <div className="divide-y divide-[#0A0A0F]">
                    {profile.top_ideas.map((idea) => (
                      <div key={idea.id} className="group px-5 py-4 hover:bg-[#0A0A0F] transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <button
                            onClick={() => navigatePath(`/ideas/${idea.id}`)}
                            className="text-left font-bold text-[#F0F0F0] hover:text-[#00D4AA] transition-colors truncate max-w-full"
                          >
                            {idea.title}
                          </button>
                          {idea.domain && (
                            <span className="px-2 py-1 border border-[#6C47FF]/30 bg-[#6C47FF]/10 text-[#6C47FF] text-xs font-bold uppercase whitespace-nowrap shrink-0">
                              {idea.domain}
                            </span>
                          )}
                        </div>
                        {idea.one_liner && (
                          <p className="text-sm text-[#888899] mt-1 line-clamp-2">{idea.one_liner}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-[#888899] font-medium">
                          <span className="flex items-center gap-1">
                            <ArrowBigUp className="w-3.5 h-3.5" /> {idea.upvotes}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3.5 h-3.5" /> {idea.comment_count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-sm font-bold text-[#888899]">No public ideas yet.</div>
                )}
              </div>

              {/* Activity */}
              <div className="border-2 border-[#111118] bg-[#111118]">
                <div className="p-5 bg-[#0A0A0F] border-b-2 border-[#111118]">
                  <h2 className="text-sm font-black text-white uppercase tracking-widest">Activity</h2>
                </div>
                <div className="p-5">
                  {profile.activity.length > 0 ? (
                    <div className="flex flex-col gap-4">
                      {profile.activity.map((a, i) => {
                        const { verb, Icon } = activityLabel(a);
                        return (
                          <div key={i} className="flex gap-3">
                            <div className="w-7 h-7 rounded-full bg-[#0A0A0F] border border-[#111118] flex items-center justify-center shrink-0">
                              <Icon className="w-3.5 h-3.5 text-[#6C47FF]" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm text-[#F0F0F0]">
                                <span className="text-[#888899]">{verb} </span>
                                {a.idea_id ? (
                                  <button
                                    onClick={() => navigatePath(`/ideas/${a.idea_id}`)}
                                    className="font-bold text-[#F0F0F0] hover:text-[#00D4AA] transition-colors"
                                  >
                                    {a.idea_title || 'an idea'}
                                  </button>
                                ) : (
                                  <span className="font-bold">{a.idea_title || 'an idea'}</span>
                                )}
                              </div>
                              {a.type === 'comment' && a.content && (
                                <p className="text-xs text-[#888899] mt-0.5 line-clamp-2">“{a.content}”</p>
                              )}
                              <div className="text-xs text-[#555566] mt-0.5">{relativeTime(a.timestamp)}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-sm text-[#888899]">No activity yet.</span>
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
