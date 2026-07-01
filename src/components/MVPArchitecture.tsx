import { Download, ExternalLink, Globe, Database, Server, Key, Box, Cpu, Clock, Users, IndianRupee } from 'lucide-react';
import GlobalNavbar from './GlobalNavbar';

export default function MVPArchitecture() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F0F0F0] flex flex-col font-sans pb-12">
      <GlobalNavbar />

      <main className="flex-1 w-full max-w-[1400px] mx-auto px-6 py-8">
        <h1 className="text-3xl font-black text-white tracking-tight mb-8">MVP Architecture — EduReach AI</h1>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <div className="bg-[#111118] border-2 border-[#111118] p-5 flex flex-col justify-between">
            <div className="text-xs font-bold text-[#888899] uppercase tracking-widest mb-2 flex items-center gap-2"><Box className="w-4 h-4 text-[#6C47FF]"/> Stack</div>
            <div className="text-xl font-black text-white">React + FastAPI</div>
          </div>
          <div className="bg-[#111118] border-2 border-[#111118] p-5 flex flex-col justify-between">
            <div className="text-xs font-bold text-[#888899] uppercase tracking-widest mb-2 flex items-center gap-2"><Clock className="w-4 h-4 text-[#00D4AA]"/> Est. Build</div>
            <div className="text-xl font-black text-white">12 Weeks</div>
          </div>
          <div className="bg-[#111118] border-2 border-[#111118] p-5 flex flex-col justify-between">
            <div className="text-xs font-bold text-[#888899] uppercase tracking-widest mb-2 flex items-center gap-2"><Users className="w-4 h-4 text-[#6C47FF]"/> Team Size</div>
            <div className="text-xl font-black text-white">2 Engineers</div>
          </div>
          <div className="bg-[#111118] border-2 border-[#111118] p-5 flex flex-col justify-between">
            <div className="text-xs font-bold text-[#888899] uppercase tracking-widest mb-2 flex items-center gap-2"><IndianRupee className="w-4 h-4 text-[#00D4AA]"/> Est. Cost</div>
            <div className="text-xl font-black text-[#00D4AA]">₹4.2L / mo</div>
          </div>
        </div>

        {/* Architecture Diagram */}
        <div className="w-full border-2 border-[#111118] bg-[#111118] mb-12">
          <div className="p-5 border-b border-[#0A0A0F] flex justify-between items-center bg-[#0A0A0F]">
            <h2 className="text-sm font-black text-white uppercase tracking-widest">System Architecture</h2>
          </div>
          <div className="p-8 bg-[#0D0D14] flex justify-center items-center font-mono text-sm">
            {/* Fake mermaid / visual diagram */}
            <pre className="text-[#888899] leading-relaxed">
{`graph TD
    Client[React SPA - Vercel] -->|HTTPS/REST| API[FastAPI - Cloud Run]
    Client -->|WebSocket| API
    
    API -->|Read/Write| DB[(PostgreSQL - Supabase)]
    API -->|Session| Cache[(Redis)]
    
    API -->|Auth| Auth[Firebase Auth]
    API -->|AI Tasks| LLM[LangGraph + GPT-4o]
    
    style Client fill:#00D4AA,stroke:#111,color:#000
    style API fill:#6C47FF,stroke:#111,color:#fff
    style DB fill:#111118,stroke:#888,color:#fff
    style LLM fill:#FF4D4F,stroke:#111,color:#fff`}
            </pre>
          </div>
        </div>

        {/* Tech Stack Details */}
        <div className="mb-12">
          <h2 className="text-sm font-black text-white uppercase tracking-widest mb-6">Recommended Technology Stack</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <div className="bg-[#0A0A0F] border border-[#111118] p-6 hover:border-[#6C47FF] transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <Globe className="w-6 h-6 text-[#00D4AA]" />
                <div>
                  <h3 className="font-bold text-white">Frontend</h3>
                  <div className="text-xs text-[#00D4AA] font-mono">React + Vite + Tailwind</div>
                </div>
              </div>
              <p className="text-sm text-[#888899] mb-4">Chosen for rapid UI development and massive talent pool. PWA capabilities needed for offline support.</p>
              <div className="inline-block px-2 py-1 bg-[#111118] text-xs font-bold text-[#F0F0F0] border border-[#111118]">Complexity: Low</div>
            </div>

            <div className="bg-[#0A0A0F] border border-[#111118] p-6 hover:border-[#6C47FF] transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <Server className="w-6 h-6 text-[#6C47FF]" />
                <div>
                  <h3 className="font-bold text-white">Backend</h3>
                  <div className="text-xs text-[#6C47FF] font-mono">Python + FastAPI</div>
                </div>
              </div>
              <p className="text-sm text-[#888899] mb-4">Python is mandatory for AI ecosystem (LangChain/LangGraph). FastAPI gives async performance.</p>
              <div className="inline-block px-2 py-1 bg-[#111118] text-xs font-bold text-[#F0F0F0] border border-[#111118]">Complexity: Medium</div>
            </div>

            <div className="bg-[#0A0A0F] border border-[#111118] p-6 hover:border-[#6C47FF] transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <Database className="w-6 h-6 text-[#F0F0F0]" />
                <div>
                  <h3 className="font-bold text-white">Database</h3>
                  <div className="text-xs text-[#F0F0F0] font-mono">PostgreSQL (Supabase)</div>
                </div>
              </div>
              <p className="text-sm text-[#888899] mb-4">Relational data is best for school/student hierarchies. pgvector extension ready for future RAG features.</p>
              <div className="inline-block px-2 py-1 bg-[#111118] text-xs font-bold text-[#F0F0F0] border border-[#111118]">Complexity: Medium</div>
            </div>

          </div>
        </div>

        {/* Developer Roadmap */}
        <div className="w-full border-2 border-[#111118] bg-[#111118] mb-8">
          <div className="p-5 border-b border-[#0A0A0F] flex justify-between items-center bg-[#0A0A0F]">
            <h2 className="text-sm font-black text-white uppercase tracking-widest">Developer Roadmap</h2>
          </div>
          
          <div className="p-6 overflow-x-auto">
            <div className="flex gap-6 min-w-[800px]">
              
              <div className="flex-1 border-t-2 border-[#111118] pt-4 relative">
                <div className="absolute -top-[11px] left-0 w-5 h-5 rounded-full bg-[#111118] border-4 border-[#0A0A0F]"></div>
                <h4 className="font-bold text-white mb-1">Phase 1: Foundation</h4>
                <div className="text-xs text-[#888899] font-mono mb-4">Week 1-2</div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-sm text-[#F0F0F0]"><input type="checkbox" disabled /> Repo Setup & CI/CD</div>
                  <div className="flex items-center gap-2 text-sm text-[#F0F0F0]"><input type="checkbox" disabled /> DB Schema Design</div>
                  <div className="flex items-center gap-2 text-sm text-[#F0F0F0]"><input type="checkbox" disabled /> Auth Integration</div>
                </div>
              </div>

              <div className="flex-1 border-t-2 border-[#111118] pt-4 relative">
                <div className="absolute -top-[11px] left-0 w-5 h-5 rounded-full bg-[#111118] border-4 border-[#0A0A0F]"></div>
                <h4 className="font-bold text-white mb-1">Phase 2: Core API</h4>
                <div className="text-xs text-[#888899] font-mono mb-4">Week 3-5</div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-sm text-[#F0F0F0]"><input type="checkbox" disabled /> CRUD Endpoints</div>
                  <div className="flex items-center gap-2 text-sm text-[#F0F0F0]"><input type="checkbox" disabled /> RBAC Implementation</div>
                  <div className="flex items-center gap-2 text-sm text-[#F0F0F0]"><input type="checkbox" disabled /> File Upload Service</div>
                </div>
              </div>

              <div className="flex-1 border-t-2 border-[#111118] pt-4 relative">
                <div className="absolute -top-[11px] left-0 w-5 h-5 rounded-full bg-[#111118] border-4 border-[#0A0A0F]"></div>
                <h4 className="font-bold text-white mb-1">Phase 3: Frontend</h4>
                <div className="text-xs text-[#888899] font-mono mb-4">Week 6-9</div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-sm text-[#F0F0F0]"><input type="checkbox" disabled /> UI Components</div>
                  <div className="flex items-center gap-2 text-sm text-[#F0F0F0]"><input type="checkbox" disabled /> State Management</div>
                  <div className="flex items-center gap-2 text-sm text-[#F0F0F0]"><input type="checkbox" disabled /> API Integration</div>
                </div>
              </div>

              <div className="flex-1 border-t-2 border-[#6C47FF] pt-4 relative">
                <div className="absolute -top-[11px] left-0 w-5 h-5 rounded-full bg-[#6C47FF] border-4 border-[#0A0A0F] animate-pulse"></div>
                <h4 className="font-bold text-[#6C47FF] mb-1">Phase 4: AI Engine</h4>
                <div className="text-xs text-[#888899] font-mono mb-4">Week 10-12</div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-sm text-[#F0F0F0]"><input type="checkbox" disabled /> LangGraph Agents</div>
                  <div className="flex items-center gap-2 text-sm text-[#F0F0F0]"><input type="checkbox" disabled /> Streaming Responses</div>
                  <div className="flex items-center gap-2 text-sm text-[#F0F0F0]"><input type="checkbox" disabled /> Beta Testing</div>
                </div>
              </div>

            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button className="px-6 py-3 bg-transparent border-2 border-[#111118] text-[#888899] font-bold text-sm hover:border-[#6C47FF] hover:text-[#6C47FF] transition-colors flex items-center justify-center gap-2">
            <Download className="w-4 h-4" /> Download Roadmap .pdf
          </button>
          <button className="px-6 py-3 bg-[#6C47FF] border-2 border-[#6C47FF] text-white font-bold text-sm hover:bg-[#0A0A0F] hover:text-[#6C47FF] transition-colors flex items-center justify-center gap-2 shadow-[2px_2px_0px_transparent] hover:shadow-[4px_4px_0px_#00D4AA]">
            Export to Notion <ExternalLink className="w-4 h-4" />
          </button>
        </div>

      </main>
    </div>
  );
}
