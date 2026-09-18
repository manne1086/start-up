import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
const STORAGE_KEY = 'ventureforge:generation';
const STALE_THRESHOLD_MS = 30_000;
const MAX_RECENT_RUNS = 10;

type RunStatus = 'idle' | 'running' | 'paused' | 'complete' | 'failed';

type GenerationState = {
  thread_id?: string;
  idea?: string;
  startup_name?: string;
  status?: RunStatus;
  awaiting_human_review?: boolean;
  completed_steps?: string[];
  agent_logs?: Array<{
    agent: string;
    message: string;
    status: 'info' | 'success' | 'warning' | 'error';
    timestamp?: string;
    thought?: string;
    search_query?: string;
    url?: string;
  }>;
  business_plan?: Record<string, unknown> | null;
  market?: Record<string, unknown> | null;
  financials?: Record<string, unknown> | null;
  legal?: Record<string, unknown> | null;
  pitch_deck?: Record<string, unknown> | null;
  mvp?: Record<string, unknown> | null;
  pivots?: Array<Record<string, unknown>>;
  human_patch?: Record<string, unknown>;
  error?: string | null;
  [key: string]: unknown;
};

type RunEntry = {
  idea: string;
  startup_name: string;
  status: RunStatus;
  backendState: GenerationState | null;
  lastVisited: number;
  createdAt: number;
};

type StoredGenerationMap = {
  runs: Record<string, RunEntry>;
  activeThreadId: string | null;
  recentOrder: string[];
};

export type RecentRun = {
  threadId: string;
  idea: string;
  startup_name: string;
  status: RunStatus;
  lastVisited: number;
};

type GenerationContextType = {
  threadId: string | null;
  idea: string;
  status: RunStatus;
  backendState: GenerationState | null;
  error: string | null;
  startGeneration: (idea: string) => Promise<string>;
  approveRun: () => Promise<GenerationState | null>;
  patchRun: (patch: Record<string, unknown>) => Promise<GenerationState | null>;
  updatePitchDeck: (updater: (deck: Record<string, unknown>) => Record<string, unknown>) => void;
  clearRun: () => void;
  switchToRun: (threadId: string) => Promise<void>;
  getRecentRuns: () => RecentRun[];
};

const GenerationContext = createContext<GenerationContextType>({
  threadId: null,
  idea: '',
  status: 'idle',
  backendState: null,
  error: null,
  startGeneration: async () => '',
  approveRun: async () => null,
  patchRun: async () => null,
  updatePitchDeck: () => {},
  clearRun: () => {},
  switchToRun: async () => {},
  getRecentRuns: () => [],
});

// FastAPI errors arrive as {"detail": "..."} — surface that sentence rather
// than dumping the raw JSON body into the UI.
async function readApiError(response: Response): Promise<string> {
  const raw = await response.text();
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed?.detail === 'string') return parsed.detail;
  } catch {
    /* not JSON — fall through to the raw body */
  }
  return raw || `Request failed (${response.status})`;
}

function parseRunStatus(s: unknown): RunStatus {
  if (s === 'running' || s === 'paused' || s === 'complete' || s === 'failed') return s;
  return 'idle';
}

function loadStoredMap(): StoredGenerationMap {
  const empty: StoredGenerationMap = { runs: {}, activeThreadId: null, recentOrder: [] };
  if (typeof window === 'undefined') return empty;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw);

    if (parsed.runs && typeof parsed.runs === 'object') {
      return {
        runs: parsed.runs as Record<string, RunEntry>,
        activeThreadId: typeof parsed.activeThreadId === 'string' ? parsed.activeThreadId : null,
        recentOrder: Array.isArray(parsed.recentOrder)
          ? (parsed.recentOrder as string[]).slice(0, MAX_RECENT_RUNS)
          : [],
      };
    }

    // Migrate old flat format: { threadId, idea, status, backendState }
    if (typeof parsed.threadId === 'string' && parsed.threadId) {
      const now = Date.now();
      const entry: RunEntry = {
        idea: typeof parsed.idea === 'string' ? parsed.idea : '',
        startup_name: (parsed.backendState?.startup_name as string) ?? '',
        status: parseRunStatus(parsed.status),
        backendState: parsed.backendState ?? null,
        lastVisited: now,
        createdAt: now,
      };
      return {
        runs: { [parsed.threadId]: entry },
        activeThreadId: parsed.threadId,
        recentOrder: [parsed.threadId],
      };
    }

    return empty;
  } catch {
    return empty;
  }
}

function persistMap(map: StoredGenerationMap) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    try {
      const slim: StoredGenerationMap = {
        ...map,
        runs: Object.fromEntries(
          Object.entries(map.runs).map(([id, entry]) => [
            id,
            id === map.activeThreadId ? entry : { ...entry, backendState: null },
          ]),
        ),
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
    } catch {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
          ...map,
          runs: Object.fromEntries(
            Object.entries(map.runs).map(([id, entry]) => [id, { ...entry, backendState: null }]),
          ),
        }));
      } catch { /* storage completely unavailable */ }
    }
  }
}

function normalizeState(data: GenerationState | null, threadId: string | null, idea: string, status: RunStatus): GenerationState | null {
  if (!data) return null;
  return {
    ...data,
    thread_id: data.thread_id ?? threadId ?? undefined,
    idea: data.idea ?? idea,
    status: (data.status as RunStatus | undefined) ?? status,
    completed_steps: Array.isArray(data.completed_steps) ? data.completed_steps : [],
    agent_logs: Array.isArray(data.agent_logs) ? data.agent_logs : [],
    pivots: Array.isArray(data.pivots) ? data.pivots : [],
    human_patch: (data.human_patch as Record<string, unknown>) ?? {},
  };
}

export function GenerationProvider({ children }: { children: React.ReactNode }) {
  const mapRef = useRef<StoredGenerationMap>(loadStoredMap());
  const initialMap = mapRef.current;
  const initialEntry = initialMap.activeThreadId
    ? initialMap.runs[initialMap.activeThreadId] ?? null
    : null;

  const [threadId, setThreadId] = useState<string | null>(initialMap.activeThreadId);
  const [idea, setIdea] = useState(initialEntry?.idea ?? '');
  const [status, setStatus] = useState<RunStatus>(initialEntry?.status ?? 'idle');
  const [backendState, setBackendState] = useState<GenerationState | null>(
    initialEntry
      ? normalizeState(initialEntry.backendState, initialMap.activeThreadId, initialEntry.idea, initialEntry.status)
      : null,
  );
  const [error, setError] = useState<string | null>(initialEntry?.backendState?.error ?? null);
  const streamRef = useRef<EventSource | null>(null);

  const closeStream = () => {
    if (streamRef.current) {
      streamRef.current.close();
      streamRef.current = null;
    }
  };

  const syncToMap = (tid: string | null, nextIdea: string, nextStatus: RunStatus, nextState: GenerationState | null) => {
    const map = mapRef.current;
    if (tid) {
      const existing = map.runs[tid];
      map.runs[tid] = {
        idea: nextIdea,
        startup_name: (nextState?.startup_name as string) ?? existing?.startup_name ?? '',
        status: nextStatus,
        backendState: nextState,
        lastVisited: Date.now(),
        createdAt: existing?.createdAt ?? Date.now(),
      };
      map.activeThreadId = tid;
    }
    persistMap(map);
  };

  const touchRecentOrder = (tid: string) => {
    const map = mapRef.current;
    map.recentOrder = [tid, ...map.recentOrder.filter(id => id !== tid)].slice(0, MAX_RECENT_RUNS);
  };

  const applyState = (nextState: GenerationState | null) => {
    const normalized = normalizeState(nextState, threadId, idea, status);
    setBackendState(normalized);
    setStatus((normalized?.status as RunStatus | undefined) ?? status);
    setError(normalized?.error ?? null);
    syncToMap(threadId, idea, (normalized?.status as RunStatus | undefined) ?? status, normalized);
    return normalized;
  };

  const fetchSnapshot = async (nextThreadId: string) => {
    const response = await fetch(`${API_URL}/api/review/${nextThreadId}`, {
      credentials: 'include',
    });
    const data = await response.json();
    if (data?.found) {
      const nextState = normalizeState(data.state as GenerationState, nextThreadId, data.state?.idea ?? idea, (data.state?.status as RunStatus | undefined) ?? status);
      setBackendState(nextState);
      setStatus((nextState?.status as RunStatus | undefined) ?? status);
      setError(nextState?.error ?? null);
      syncToMap(nextThreadId, data.state?.idea ?? idea, (nextState?.status as RunStatus | undefined) ?? status, nextState);
      return nextState;
    }
    return null;
  };

  const attachStream = (nextThreadId: string) => {
    closeStream();
    const source = new EventSource(`${API_URL}/api/stream/${nextThreadId}`, { withCredentials: true });
    streamRef.current = source;

    source.addEventListener('status', (event) => {
      const payload = JSON.parse((event as MessageEvent).data) as { status?: RunStatus };
      const nextStatus = payload.status ?? 'running';
      setStatus(nextStatus);
      setBackendState((current) => {
        const next = normalizeState({ ...(current ?? {}), status: nextStatus }, nextThreadId, idea, nextStatus);
        syncToMap(nextThreadId, idea, nextStatus, next);
        return next;
      });
    });

    source.addEventListener('log', (event) => {
      const log = JSON.parse((event as MessageEvent).data) as GenerationState['agent_logs'][number];
      setBackendState((current) => {
        const nextLogs = [...((current?.agent_logs ?? []) as NonNullable<GenerationState['agent_logs']>)];
        nextLogs.push(log);
        const next = normalizeState({ ...(current ?? {}), agent_logs: nextLogs }, nextThreadId, idea, status);
        syncToMap(nextThreadId, idea, status, next);
        return next;
      });
    });

    source.addEventListener('step', (event) => {
      const payload = JSON.parse((event as MessageEvent).data) as { node?: string; status?: string };
      setBackendState((current) => {
        const next = normalizeState({ ...(current ?? {}), current_step: payload.node, current_step_status: payload.status }, nextThreadId, idea, 'running');
        syncToMap(nextThreadId, idea, 'running', next);
        return next;
      });
    });

    source.addEventListener('review', (event) => {
      const payload = JSON.parse((event as MessageEvent).data) as { state?: GenerationState };
      const nextState = normalizeState(payload.state ?? null, nextThreadId, idea, 'paused');
      setBackendState(nextState);
      setStatus('paused');
      setError(nextState?.error ?? null);
      syncToMap(nextThreadId, idea, 'paused', nextState);
    });

    source.addEventListener('complete', (event) => {
      const payload = JSON.parse((event as MessageEvent).data) as { state?: GenerationState };
      const nextState = normalizeState(payload.state ?? null, nextThreadId, idea, 'complete');
      setBackendState(nextState);
      setStatus('complete');
      setError(nextState?.error ?? null);
      syncToMap(nextThreadId, idea, 'complete', nextState);
      closeStream();
    });

    source.addEventListener('error', (event) => {
      const message = event instanceof MessageEvent ? String(event.data) : 'Generation stream failed';
      setStatus('failed');
      setError(message);
      setBackendState((current) => {
        const next = normalizeState({ ...(current ?? {}), status: 'failed', error: message }, nextThreadId, idea, 'failed');
        syncToMap(nextThreadId, idea, 'failed', next);
        return next;
      });
      closeStream();
    });

    source.onerror = () => {
      setStatus((current) => (current === 'complete' ? current : 'failed'));
    };
  };

  const startGeneration = async (nextIdea: string) => {
    const cleanedIdea = nextIdea.trim();
    if (!cleanedIdea) {
      throw new Error('Please describe your startup idea before generating.');
    }

    closeStream();
    setError(null);
    setStatus('running');
    setIdea(cleanedIdea);
    setBackendState(null);

    const response = await fetch(`${API_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        idea: cleanedIdea,
        user_id: 'anonymous',
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(body || 'Failed to start generation.');
    }

    const data = await response.json() as { thread_id?: string; state?: GenerationState };
    const nextThreadId = data.thread_id ?? null;
    const nextState = normalizeState(data.state ?? null, nextThreadId, cleanedIdea, 'running');

    setThreadId(nextThreadId);
    setBackendState(nextState);
    setStatus((nextState?.status as RunStatus | undefined) ?? 'running');
    setError(nextState?.error ?? null);

    if (nextThreadId) {
      touchRecentOrder(nextThreadId);
    }
    syncToMap(nextThreadId, cleanedIdea, (nextState?.status as RunStatus | undefined) ?? 'running', nextState);

    if (nextThreadId) {
      attachStream(nextThreadId);
    }

    return nextThreadId ?? '';
  };

  const approveRun = async () => {
    const activeThreadId = threadId ?? (backendState?.thread_id as string | undefined) ?? null;
    if (!activeThreadId) {
      throw new Error('No active generation run found.');
    }

    const response = await fetch(`${API_URL}/api/review/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ thread_id: activeThreadId }),
    });

    if (!response.ok) {
      throw new Error(await readApiError(response));
    }

    const data = await response.json() as { state?: GenerationState };
    return applyState(data.state ?? null);
  };

  const patchRun = async (patch: Record<string, unknown>) => {
    const activeThreadId = threadId ?? (backendState?.thread_id as string | undefined) ?? null;
    if (!activeThreadId) {
      throw new Error('No active generation run found.');
    }

    const response = await fetch(`${API_URL}/api/review/patch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ thread_id: activeThreadId, patch }),
    });

    if (!response.ok) {
      throw new Error(await readApiError(response));
    }

    const data = await response.json() as { state?: GenerationState };
    return applyState(data.state ?? null);
  };

  const updatePitchDeck = (updater: (deck: Record<string, unknown>) => Record<string, unknown>) => {
    setBackendState((current) => {
      const currentDeck = (current?.pitch_deck as Record<string, unknown>) ?? {};
      const nextDeck = updater(currentDeck);
      const next = normalizeState({ ...(current ?? {}), pitch_deck: nextDeck }, threadId, idea, status);
      syncToMap(threadId, idea, status, next);
      return next;
    });
  };

  const clearRun = () => {
    closeStream();
    mapRef.current.activeThreadId = null;
    persistMap(mapRef.current);
    setThreadId(null);
    setIdea('');
    setStatus('idle');
    setBackendState(null);
    setError(null);
  };

  const switchToRun = async (targetThreadId: string) => {
    const map = mapRef.current;
    const entry = map.runs[targetThreadId];
    if (!entry) throw new Error(`Run ${targetThreadId} not found`);

    closeStream();

    const isStale = !entry.backendState ||
      (entry.status === 'running' && Date.now() - entry.lastVisited > STALE_THRESHOLD_MS);

    setThreadId(targetThreadId);
    setIdea(entry.idea);
    setStatus(entry.status);
    setBackendState(normalizeState(entry.backendState, targetThreadId, entry.idea, entry.status));
    setError(entry.backendState?.error ?? null);

    entry.lastVisited = Date.now();
    map.activeThreadId = targetThreadId;
    touchRecentOrder(targetThreadId);
    persistMap(map);

    let currentStatus = entry.status;
    if (isStale) {
      const snapshot = await fetchSnapshot(targetThreadId);
      currentStatus = (snapshot?.status as RunStatus | undefined) ?? entry.status;
    }

    if (currentStatus !== 'complete' && currentStatus !== 'failed' && currentStatus !== 'idle') {
      attachStream(targetThreadId);
    }
  };

  const getRecentRuns = (): RecentRun[] => {
    const map = mapRef.current;
    return map.recentOrder
      .filter(id => id in map.runs)
      .map(id => {
        const entry = map.runs[id];
        return {
          threadId: id,
          idea: entry.idea,
          startup_name: entry.startup_name,
          status: entry.status,
          lastVisited: entry.lastVisited,
        };
      });
  };

  useEffect(() => {
    if (!threadId) {
      return;
    }

    let cancelled = false;
    void (async () => {
      const snapshot = await fetchSnapshot(threadId);
      if (cancelled) return;
      const currentStatus = (snapshot?.status as RunStatus | undefined) ?? status;
      if (currentStatus !== 'complete') {
        attachStream(threadId);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    syncToMap(threadId, idea, status, backendState);
  }, [backendState, idea, status, threadId]);

  useEffect(() => () => closeStream(), []);

  return (
    <GenerationContext.Provider
      value={{
        threadId,
        idea,
        status,
        backendState,
        error,
        startGeneration,
        approveRun,
        patchRun,
        updatePitchDeck,
        clearRun,
        switchToRun,
        getRecentRuns,
      }}
    >
      {children}
    </GenerationContext.Provider>
  );
}

export function useGeneration() {
  return useContext(GenerationContext);
}
