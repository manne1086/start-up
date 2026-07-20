import React, { createContext, useContext } from 'react';
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom';

export type Screen =
  | 'landing'
  | 'home'
  | 'projects'
  | 'progress'
  | 'review'
  | 'results'
  | 'financials'
  | 'pivot'
  | 'market'
  | 'legal'
  | 'pitch'
  | 'mvp'
  | 'how-it-works'
  | 'settings'
  | 'error'
  | 'components';

// The app used to be a fixed enum screen-switcher. It now runs on real URLs
// (react-router), but the enum `navigate(screen)` API is preserved via this
// adapter so existing call sites keep working unchanged. New param routes
// (e.g. /users/:username) use `navigatePath`.
export const SCREEN_TO_PATH: Record<Screen, string> = {
  landing: '/',
  home: '/home',
  projects: '/projects',
  progress: '/progress',
  review: '/review',
  results: '/results',
  financials: '/financials',
  pivot: '/pivot',
  market: '/market',
  legal: '/legal',
  pitch: '/pitch',
  mvp: '/mvp',
  'how-it-works': '/how-it-works',
  settings: '/settings',
  error: '/error',
  components: '/components',
};

const PATH_TO_SCREEN: Record<string, Screen> = Object.fromEntries(
  Object.entries(SCREEN_TO_PATH).map(([screen, path]) => [path, screen as Screen]),
) as Record<string, Screen>;

interface RouterContextType {
  screen: Screen;
  navigate: (screen: Screen) => void;
  navigatePath: (path: string) => void;
}

const RouterContext = createContext<RouterContextType>({
  screen: 'landing',
  navigate: () => {},
  navigatePath: () => {},
});

function InnerRouterProvider({ children }: { children: React.ReactNode }) {
  const rrNavigate = useNavigate();
  const location = useLocation();
  const screen = PATH_TO_SCREEN[location.pathname] ?? 'landing';

  const navigate = (next: Screen) => {
    rrNavigate(SCREEN_TO_PATH[next] ?? '/');
  };
  const navigatePath = (path: string) => {
    rrNavigate(path);
  };

  return (
    <RouterContext.Provider value={{ screen, navigate, navigatePath }}>{children}</RouterContext.Provider>
  );
}

export function RouterProvider({ children }: { children: React.ReactNode }) {
  return (
    <BrowserRouter>
      <InnerRouterProvider>{children}</InnerRouterProvider>
    </BrowserRouter>
  );
}

export const useRouter = () => useContext(RouterContext);
