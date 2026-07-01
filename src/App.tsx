import { RouterProvider, useRouter } from './router';
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
import Settings from './components/Settings';
import ErrorState from './components/ErrorState';
import ComponentLibrary from './components/ComponentLibrary';

function AppContent() {
  const { screen } = useRouter();

  switch (screen) {
    case 'landing': return <Landing />;
    case 'projects': return <Projects />;
    case 'progress': return <AgentProgress />;
    case 'review': return <HumanReview />;
    case 'results': return <ResultsDashboard />;
    case 'financials': return <FinancialModel />;
    case 'pivot': return <PivotSimulator />;
    case 'market': return <MarketResearch />;
    case 'legal': return <LegalCompliance />;
    case 'pitch': return <PitchDeckEditor />;
    case 'mvp': return <MVPArchitecture />;
    case 'settings': return <Settings />;
    case 'error': return <ErrorState />;
    case 'components': return <ComponentLibrary />;
    default: return <Landing />;
  }
}

function App() {
  return (
    <RouterProvider>
      <GenerationProvider>
        <AppContent />
      </GenerationProvider>
    </RouterProvider>
  );
}

export default App;
