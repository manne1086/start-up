import { lazy, Suspense } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { AuthProvider } from './auth';
import { NotificationsProvider } from './notifications';
import { RouterProvider } from './router';
import { GenerationProvider } from './generation';
import { useAuth } from './auth';

const Landing = lazy(() => import('./components/Landing'));
const Projects = lazy(() => import('./components/Projects'));
const AgentProgress = lazy(() => import('./components/AgentProgress'));
const HumanReview = lazy(() => import('./components/HumanReview'));
const ResultsDashboard = lazy(() => import('./components/ResultsDashboard'));
const FinancialModel = lazy(() => import('./components/FinancialModel'));
const PivotSimulator = lazy(() => import('./components/PivotSimulator'));
const MarketResearch = lazy(() => import('./components/MarketResearch'));
const LegalCompliance = lazy(() => import('./components/LegalCompliance'));
const PitchDeckEditor = lazy(() => import('./components/PitchDeckEditor'));
const MVPArchitecture = lazy(() => import('./components/MVPArchitecture'));
const HowItWorks = lazy(() => import('./components/HowItWorks'));
const LandingNavbar = lazy(() => import('./components/LandingNavbar'));
const NeuralBrainBackground = lazy(() => import('./components/NeuralBrainBackground'));
const Settings = lazy(() => import('./components/Settings'));
const ErrorState = lazy(() => import('./components/ErrorState'));
const ComponentLibrary = lazy(() => import('./components/ComponentLibrary'));
const Home = lazy(() => import('./components/Home'));
const AuthenticatedHome = lazy(() => import('./components/AuthenticatedHome'));
const IdeaFeed = lazy(() => import('./components/IdeaFeed'));
const IdeaDetail = lazy(() => import('./components/IdeaDetail'));
const UserProfile = lazy(() => import('./components/UserProfile'));

function ComponentLoadingFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#07070C] px-6 text-[#F0F0F0]">
      <div className="flex items-center gap-3 text-sm text-[#888899]" role="status" aria-live="polite">
        <span className="h-2 w-2 animate-pulse rounded-full bg-[#00D4AA]" />
        Loading workspace...
      </div>
    </main>
  );
}

// Thin route wrappers that feed URL params into the community/profile
// components (which take props rather than reading the router directly).
function CommunityRoute() {
  const navigate = useNavigate();
  return <IdeaFeed onOpenIdea={(id) => navigate(`/ideas/${id}`)} />;
}

function IdeaDetailRoute() {
  const { id } = useParams();
  const navigate = useNavigate();
  return (
    <IdeaDetail
      ideaId={id ?? ''}
      onBack={() => navigate('/community')}
      onOpenIdea={(nextId) => navigate(`/ideas/${nextId}`)}
    />
  );
}

function HomeRoute() {
  const { authenticated, loading } = useAuth();
  if (loading) return <Home />;
  return authenticated ? <AuthenticatedHome /> : <Home />;
}

// Landing route — shows the marketing "How VentureForge works" page with a
// slim marketing navbar (not the authenticated app navbar). Available to both
// signed-out and signed-in visitors so the marketing page stays browsable.
// Signed-out visitors get the glowing neural-network background; signed-in
// users see the clean page so the app feels focused when returning.
function LandingRoute() {
  const { authenticated } = useAuth();
  return (
    <>
      {!authenticated && <NeuralBrainBackground />}
      <LandingNavbar />
      <HowItWorks hideNavbar />
    </>
  );
}

function AppContent() {
  return (
    <Suspense fallback={<ComponentLoadingFallback />}>
      <Routes>
        <Route path="/" element={<LandingRoute />} />
        <Route path="/legacy-landing" element={<Landing />} />
        <Route path="/home" element={<HomeRoute />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/progress" element={<AgentProgress />} />
        <Route path="/review" element={<HumanReview />} />
        <Route path="/results" element={<ResultsDashboard />} />
        <Route path="/financials" element={<FinancialModel />} />
        <Route path="/pivot" element={<PivotSimulator />} />
        <Route path="/market" element={<MarketResearch />} />
        <Route path="/legal" element={<LegalCompliance />} />
        <Route path="/pitch" element={<PitchDeckEditor />} />
        <Route path="/mvp" element={<MVPArchitecture />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/error" element={<ErrorState />} />
        <Route path="/components" element={<ComponentLibrary />} />
        <Route path="/community" element={<CommunityRoute />} />
        <Route path="/ideas/:id" element={<IdeaDetailRoute />} />
        <Route path="/users/:username" element={<UserProfile />} />
        <Route path="*" element={<LandingRoute />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <RouterProvider>
      <AuthProvider>
        <NotificationsProvider>
          <GenerationProvider>
            <AppContent />
          </GenerationProvider>
        </NotificationsProvider>
      </AuthProvider>
    </RouterProvider>
  );
}

export default App;
