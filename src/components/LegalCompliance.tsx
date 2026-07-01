import { Scale, ShieldAlert, CheckCircle2, Download, ArrowRight, FileText, Briefcase, Building } from 'lucide-react';
import GlobalNavbar from './GlobalNavbar';

export default function LegalCompliance() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F0F0F0] flex flex-col font-sans pb-12">
      <GlobalNavbar />

      <main className="flex-1 w-full max-w-[1400px] mx-auto px-6 py-8">
        <h1 className="text-3xl font-black text-white tracking-tight mb-8">Legal & Compliance — EduReach AI</h1>

        {/* Top 4 Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-[#111118] border-2 border-[#111118] p-5 hover:border-[#6C47FF] transition-colors flex flex-col group">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 className="w-6 h-6 text-[#00D4AA]" />
              <h3 className="font-black text-white uppercase tracking-wide">GDPR</h3>
            </div>
            <div className="mt-auto">
              <span className="px-2 py-1 text-xs font-bold uppercase border border-[#00D4AA]/30 bg-[#00D4AA]/10 text-[#00D4AA] mb-2 inline-block">Compliant</span>
              <p className="text-xs text-[#888899] font-medium leading-relaxed">Data anonymization protocols align with EU standards.</p>
            </div>
          </div>
          
          <div className="bg-[#111118] border-2 border-[#111118] p-5 hover:border-[#6C47FF] transition-colors flex flex-col group">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 className="w-6 h-6 text-[#00D4AA]" />
              <h3 className="font-black text-white uppercase tracking-wide">IT Act 2000</h3>
            </div>
            <div className="mt-auto">
              <span className="px-2 py-1 text-xs font-bold uppercase border border-[#00D4AA]/30 bg-[#00D4AA]/10 text-[#00D4AA] mb-2 inline-block">Compliant</span>
              <p className="text-xs text-[#888899] font-medium leading-relaxed">Section 43A data protection standards met via AES-256.</p>
            </div>
          </div>

          <div className="bg-amber-500/5 border-2 border-amber-500/50 p-5 shadow-[4px_4px_0px_rgba(234,179,8,0.2)] flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <ShieldAlert className="w-6 h-6 text-amber-500" />
              <h3 className="font-black text-amber-500 uppercase tracking-wide">DPDP Act</h3>
            </div>
            <div className="mt-auto">
              <span className="px-2 py-1 text-xs font-bold uppercase border border-amber-500/30 bg-amber-500/10 text-amber-500 mb-2 inline-block">Review Needed</span>
              <p className="text-xs text-[#F0F0F0] font-medium leading-relaxed">Verifiable parental consent mechanism missing for minors under 18.</p>
            </div>
          </div>

          <div className="bg-[#111118] border-2 border-[#111118] p-5 hover:border-[#6C47FF] transition-colors flex flex-col group">
            <div className="flex items-center gap-3 mb-4">
              <Building className="w-6 h-6 text-[#00D4AA]" />
              <h3 className="font-black text-white uppercase tracking-wide">Entity Name</h3>
            </div>
            <div className="mt-auto">
              <span className="px-2 py-1 text-xs font-bold uppercase border border-[#00D4AA]/30 bg-[#00D4AA]/10 text-[#00D4AA] mb-2 inline-block">MCA Verified</span>
              <p className="text-xs text-[#888899] font-medium leading-relaxed">"EduReach AI Pvt Ltd" is available in the MCA database.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 mb-10">
          
          {/* LEFT — Entity Recommendation */}
          <div className="w-full lg:w-1/2 border-2 border-[#111118] bg-[#111118] flex flex-col">
            <div className="p-6 border-b border-[#0A0A0F]">
              <h2 className="text-sm font-black text-white uppercase tracking-widest mb-1">Entity Recommendation</h2>
              <p className="text-[#888899] text-xs">Based on B2B SaaS model and external funding plans.</p>
            </div>
            <div className="p-6 flex flex-col gap-6 flex-1">
              <div className="text-2xl font-black text-[#6C47FF] tracking-tight">Private Limited Company</div>
              
              <div className="flex flex-col gap-3 font-mono text-sm">
                <div className="flex justify-between items-center py-2 border-b border-[#0A0A0F]">
                  <span className="text-[#888899]">Directors Needed:</span>
                  <span className="text-[#F0F0F0] font-bold">Minimum 2</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[#0A0A0F]">
                  <span className="text-[#888899]">Est. Setup Cost:</span>
                  <span className="text-[#F0F0F0] font-bold">₹12,000 - ₹15,000</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[#0A0A0F]">
                  <span className="text-[#888899]">Timeline:</span>
                  <span className="text-[#F0F0F0] font-bold">10-15 Days</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[#0A0A0F]">
                  <span className="text-[#888899]">DIN Status:</span>
                  <span className="text-[#00D4AA] font-bold">Founders Verified ✅</span>
                </div>
              </div>

              <button className="mt-auto w-full py-3 bg-[#6C47FF] text-white font-black text-sm uppercase tracking-wider hover:bg-[#111118] hover:text-[#6C47FF] transition-all shadow-[4px_4px_0px_transparent] hover:shadow-[4px_4px_0px_#6C47FF] border-2 border-[#6C47FF] flex items-center justify-center gap-2">
                Generate Incorporation Checklist <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* RIGHT — Compliance Action Items */}
          <div className="w-full lg:w-1/2 border-2 border-[#111118] bg-[#111118] flex flex-col">
            <div className="p-6 border-b border-[#0A0A0F]">
              <h2 className="text-sm font-black text-white uppercase tracking-widest mb-1">Compliance Action Items</h2>
              <p className="text-[#888899] text-xs">Prioritized legal tasks for launch.</p>
            </div>
            
            <div className="flex flex-col p-6 gap-4 flex-1 overflow-y-auto custom-scrollbar max-h-[400px]">
              
              <div className="flex items-start gap-3 p-4 bg-[#0A0A0F] border border-[#FF4D4F]/30">
                <input type="checkbox" className="mt-1 w-4 h-4 accent-[#6C47FF] bg-transparent border-2 border-[#888899]" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-[#F0F0F0]">1. Implement Verifiable Parental Consent</span>
                    <span className="px-2 py-0.5 bg-[#FF4D4F]/10 text-[#FF4D4F] text-[10px] font-black uppercase">Critical</span>
                  </div>
                  <p className="text-xs text-[#888899] leading-relaxed mb-2">Required under DPDP Act for users under 18. Suggest OTP verification via parent's Aadhaar-linked mobile.</p>
                  <a href="#" className="text-xs font-bold text-[#6C47FF] hover:text-[#00D4AA] transition-colors">Learn more →</a>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-[#0A0A0F] border border-[#111118]">
                <input type="checkbox" className="mt-1 w-4 h-4 accent-[#6C47FF]" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-[#F0F0F0]">2. Draft B2B Master Service Agreement</span>
                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase">Medium</span>
                  </div>
                  <p className="text-xs text-[#888899] leading-relaxed mb-2">Needs specific clauses for school data ownership and uptime SLAs.</p>
                  <a href="#" className="text-xs font-bold text-[#6C47FF] hover:text-[#00D4AA] transition-colors">Learn more →</a>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-[#0A0A0F] border border-[#111118]">
                <input type="checkbox" className="mt-1 w-4 h-4 accent-[#6C47FF]" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-[#F0F0F0]">3. Register Trademark "EduReach AI"</span>
                    <span className="px-2 py-0.5 bg-[#00D4AA]/10 text-[#00D4AA] text-[10px] font-black uppercase">Low</span>
                  </div>
                  <p className="text-xs text-[#888899] leading-relaxed mb-2">File under Class 41 (Education) and Class 42 (SaaS).</p>
                  <a href="#" className="text-xs font-bold text-[#6C47FF] hover:text-[#00D4AA] transition-colors">Learn more →</a>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Downloads Row */}
        <div>
          <h4 className="text-xs font-bold text-[#888899] uppercase tracking-widest mb-4">Document Templates</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'NDA Template', ext: '.docx', icon: FileText },
              { name: 'Terms of Service', ext: '.docx', icon: Scale },
              { name: 'Privacy Policy', ext: '.docx', icon: ShieldAlert },
              { name: 'Inc. Checklist', ext: '.pdf', icon: Briefcase },
            ].map((doc, i) => {
              const Icon = doc.icon;
              return (
                <button key={i} className="bg-[#111118] border-2 border-[#111118] hover:border-[#6C47FF] p-4 flex flex-col items-start gap-3 transition-colors group">
                  <Icon className="w-5 h-5 text-[#888899] group-hover:text-[#6C47FF]" />
                  <div className="text-left">
                    <div className="font-bold text-[#F0F0F0] text-sm">{doc.name}</div>
                    <div className="text-xs text-[#888899] font-mono mt-1">{doc.ext}</div>
                  </div>
                  <Download className="w-4 h-4 text-[#6C47FF] ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              );
            })}
          </div>
        </div>

      </main>
    </div>
  );
}
