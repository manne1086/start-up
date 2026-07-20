import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

type AuthUser = {
  sub: string;
  email: string;
  name: string;
  picture: string;
  username: string | null;
};

type AuthContextType = {
  loading: boolean;
  authenticated: boolean;
  user: AuthUser | null;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  loading: true,
  authenticated: false,
  user: null,
  logout: async () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        credentials: 'include',
      });
      const data = await response.json();
      setAuthenticated(Boolean(data.authenticated));
      setUser(data.authenticated ? (data.user ?? null) : null);
    } catch {
      setAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch { /* ignore */ }
    setAuthenticated(false);
    setUser(null);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const auth = params.get('auth');
    if (auth === 'success' || auth === 'error') {
      window.history.replaceState({}, '', window.location.pathname);
    }
    void refresh();
  }, [refresh]);

  return (
    <AuthContext.Provider value={{ loading, authenticated, user, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
