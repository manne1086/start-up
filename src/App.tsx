import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { AuthProvider } from './auth';
import { NotificationsProvider } from './notifications';
import { RouterProvider } from './router';
import { GenerationProvider } from './generation';
import Landing from './components/Landing';
import Projects from './components/Projects';
import AgentProgress from './components/AgentProgress';
import HumanReview from './components/HumanReview';
import ResultsDashboard from './components/ResultsDashboard';
import FinancialModel from './components/FinancialModel';
import PivotSimulator from './components/PivotSimulator';
import MarketResearch from './components/MarketResearch';
import LegalCompliance from './components/LegalCompliance';
import PitchDeckEditor from './components/PitchDeckEditor';
import MVPArchitecture from './components/MVPArchitecture';
import HowItWorks from './components/HowItWorks';
import Settings from './components/Settings';
import ErrorState from './components/ErrorState';
import ComponentLibrary from './components/ComponentLibrary';
import Home from './components/Home';
import AuthenticatedHome from './components/AuthenticatedHome';
import { useAuth } from './auth';
import IdeaFeed from './components/IdeaFeed';
import IdeaDetail from './components/IdeaDetail';
import UserProfile from './components/UserProfile';

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

function AppContent() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
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
      <Route path="*" element={<Landing />} />
    </Routes>
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
