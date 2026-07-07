import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
const STORAGE_KEY = 'ventureforge:generation';

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

type GenerationContextType = {
  threadId: string | null;
  idea: string;
  status: RunStatus;
  backendState: GenerationState | null;
  error: string | null;
  startGeneration: (idea: string) => Promise<string>;
  approveRun: () => Promise<GenerationState | null>;
  patchRun: (patch: Record<string, unknown>) => Promise<GenerationState | null>;
  clearRun: () => void;
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
  clearRun: () => {},
});

type StoredGeneration = {
  threadId: string | null;
  idea: string;
  status: RunStatus;
  backendState: GenerationState | null;
};

function getStoredGeneration(): StoredGeneration {
  if (typeof window === 'undefined') {
    return { threadId: null, idea: '', status: 'idle', backendState: null };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { threadId: null, idea: '', status: 'idle', backendState: null };
    }

    const parsed = JSON.parse(raw) as Partial<StoredGeneration>;
    return {
      threadId: typeof parsed.threadId === 'string' ? parsed.threadId : null,
      idea: typeof parsed.idea === 'string' ? parsed.idea : '',
      status: parsed.status === 'running' || parsed.status === 'paused' || parsed.status === 'complete' || parsed.status === 'failed'
        ? parsed.status
        : 'idle',
      backendState: parsed.backendState ?? null,
    };
  } catch {
    return { threadId: null, idea: '', status: 'idle', backendState: null };
  }
}

function persistGeneration(next: StoredGeneration) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
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
  const stored = getStoredGeneration();
  const [threadId, setThreadId] = useState<string | null>(stored.threadId);
  const [idea, setIdea] = useState(stored.idea);
  const [status, setStatus] = useState<RunStatus>(stored.status);
  const [backendState, setBackendState] = useState<GenerationState | null>(normalizeState(stored.backendState, stored.threadId, stored.idea, stored.status));
  const [error, setError] = useState<string | null>(stored.backendState?.error ?? null);
  const streamRef = useRef<EventSource | null>(null);

  const closeStream = () => {
    if (streamRef.current) {
      streamRef.current.close();
      streamRef.current = null;
    }
  };

  const syncStored = (nextThreadId: string | null, nextIdea: string, nextStatus: RunStatus, nextState: GenerationState | null) => {
    persistGeneration({
      threadId: nextThreadId,
      idea: nextIdea,
      status: nextStatus,
      backendState: nextState,
    });
  };

  const applyState = (nextState: GenerationState | null) => {
    const normalized = normalizeState(nextState, threadId, idea, status);
    setBackendState(normalized);
    setStatus((normalized?.status as RunStatus | undefined) ?? status);
    setError(normalized?.error ?? null);
    syncStored(threadId, idea, (normalized?.status as RunStatus | undefined) ?? status, normalized);
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
      syncStored(nextThreadId, data.state?.idea ?? idea, (nextState?.status as RunStatus | undefined) ?? status, nextState);
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
        syncStored(nextThreadId, idea, nextStatus, next);
        return next;
      });
    });

    source.addEventListener('log', (event) => {
      const log = JSON.parse((event as MessageEvent).data) as GenerationState['agent_logs'][number];
      setBackendState((current) => {
        const nextLogs = [...((current?.agent_logs ?? []) as NonNullable<GenerationState['agent_logs']>)];
        nextLogs.push(log);
        const next = normalizeState({ ...(current ?? {}), agent_logs: nextLogs }, nextThreadId, idea, status);
        syncStored(nextThreadId, idea, status, next);
        return next;
      });
    });

    source.addEventListener('step', (event) => {
      const payload = JSON.parse((event as MessageEvent).data) as { node?: string; status?: string };
      setBackendState((current) => {
        const next = normalizeState({ ...(current ?? {}), current_step: payload.node, current_step_status: payload.status }, nextThreadId, idea, 'running');
        syncStored(nextThreadId, idea, 'running', next);
        return next;
      });
    });

    source.addEventListener('review', (event) => {
      const payload = JSON.parse((event as MessageEvent).data) as { state?: GenerationState };
      const nextState = normalizeState(payload.state ?? null, nextThreadId, idea, 'paused');
      setBackendState(nextState);
      setStatus('paused');
      setError(nextState?.error ?? null);
      syncStored(nextThreadId, idea, 'paused', nextState);
    });

    source.addEventListener('complete', (event) => {
      const payload = JSON.parse((event as MessageEvent).data) as { state?: GenerationState };
      const nextState = normalizeState(payload.state ?? null, nextThreadId, idea, 'complete');
      setBackendState(nextState);
      setStatus('complete');
      setError(nextState?.error ?? null);
      syncStored(nextThreadId, idea, 'complete', nextState);
      closeStream();
    });

    source.addEventListener('error', (event) => {
      const message = event instanceof MessageEvent ? String(event.data) : 'Generation stream failed';
      setStatus('failed');
      setError(message);
      setBackendState((current) => {
        const next = normalizeState({ ...(current ?? {}), status: 'failed', error: message }, nextThreadId, idea, 'failed');
        syncStored(nextThreadId, idea, 'failed', next);
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
    syncStored(nextThreadId, cleanedIdea, (nextState?.status as RunStatus | undefined) ?? 'running', nextState);

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
      throw new Error(await response.text());
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
      throw new Error(await response.text());
    }

    const data = await response.json() as { state?: GenerationState };
    return applyState(data.state ?? null);
  };

  const clearRun = () => {
    closeStream();
    setThreadId(null);
    setIdea('');
    setStatus('idle');
    setBackendState(null);
    setError(null);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
    }
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
    syncStored(threadId, idea, status, backendState);
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
        clearRun,
      }}
    >
      {children}
    </GenerationContext.Provider>
  );
}

export function useGeneration() {
  return useContext(GenerationContext);
}
