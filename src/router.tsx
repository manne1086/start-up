import React, { createContext, useContext, useState } from 'react';

export type Screen = 'landing' | 'home' | 'projects' | 'progress' | 'review' | 'results' | 'financials' | 'pivot' | 'market' | 'legal' | 'pitch' | 'mvp' | 'settings' | 'error' | 'components';

interface RouterContextType {
  screen: Screen;
  navigate: (screen: Screen) => void;
}

const RouterContext = createContext<RouterContextType>({ screen: 'landing', navigate: () => {} });

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const [screen, setScreen] = useState<Screen>('landing');
  return <RouterContext.Provider value={{ screen, navigate: setScreen }}>{children}</RouterContext.Provider>;
}

export const useRouter = () => useContext(RouterContext);
