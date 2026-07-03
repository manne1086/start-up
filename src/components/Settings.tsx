import { useState } from 'react';
import { User, Key, Bell, CreditCard, AlertTriangle, Download, ArrowRight, Eye, EyeOff } from 'lucide-react';
import GlobalNavbar from './GlobalNavbar';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('Profile');
  const [showKey, setShowKey] = useState(false);

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F0F0F0] flex flex-col font-sans pb-12">
      <GlobalNavbar />

      <main className="flex-1 w-full max-w-[1200px] mx-auto px-6 py-8 flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Navigation */}
        <div className="w-full md:w-[240px] shrink-0 flex flex-col gap-2">
          {[
            { name: 'Profile', icon: User },
            { name: 'API Keys', icon: Key },
            { name: 'Notifications', icon: Bell },
            { name: 'Billing', icon: CreditCard },
            { name: 'Danger Zone', icon: AlertTriangle, danger: true },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.name;
            return (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={`flex items-center gap-3 px-4 py-3 font-bold text-sm transition-colors ${
                  isActive 
                    ? (tab.danger ? 'bg-[#FF4D4F]/10 text-[#FF4D4F] border-l-2 border-[#FF4D4F]' : 'bg-[#111118] text-white border-l-2 border-[#6C47FF]')
                    : (tab.danger ? 'text-[#FF4D4F]/70 hover:text-[#FF4D4F] hover:bg-[#FF4D4F]/5 border-l-2 border-transparent' : 'text-[#888899] hover:text-white hover:bg-[#111118] border-l-2 border-transparent')
                }`}
              >
                <Icon className="w-4 h-4" /> {tab.name}
              </button>
            )
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 border-2 border-[#111118] bg-[#111118]">
          
          {activeTab === 'Profile' && (
            <div className="flex flex-col h-full">
              <div className="p-6 border-b border-[#0A0A0F]">
                <h2 className="text-lg font-black text-white uppercase tracking-widest">Profile Settings</h2>
              </div>
              <div className="p-8 flex-1 flex flex-col gap-6">
                <div className="flex items-center gap-6 mb-4">
                  <div className="w-20 h-20 bg-[#0A0A0F] border-2 border-[#6C47FF] flex items-center justify-center">
                    <User className="w-8 h-8 text-[#6C47FF]" />
                  </div>
                  <button className="px-4 py-2 border-2 border-[#111118] text-[#F0F0F0] font-bold text-sm hover:border-white transition-colors">
                    Upload Avatar
                  </button>
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-[#888899] uppercase tracking-widest mb-2">First Name</label>
                    <input type="text" placeholder="Enter first name" className="w-full bg-[#0A0A0F] border border-[#111118] text-[#F0F0F0] px-4 py-2 focus:outline-none focus:border-[#6C47FF] transition-colors" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-[#888899] uppercase tracking-widest mb-2">Last Name</label>
                    <input type="text" placeholder="Enter last name" className="w-full bg-[#0A0A0F] border border-[#111118] text-[#F0F0F0] px-4 py-2 focus:outline-none focus:border-[#6C47FF] transition-colors" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#888899] uppercase tracking-widest mb-2">Email Address</label>
                    <input type="email" placeholder="Account email" className="w-full bg-[#0A0A0F] border border-[#111118] text-[#F0F0F0] px-4 py-2 focus:outline-none focus:border-[#6C47FF] transition-colors" disabled />
                </div>
              </div>
              <div className="p-6 border-t border-[#0A0A0F] flex justify-end">
                <button className="px-6 py-2 bg-[#6C47FF] border-2 border-[#6C47FF] text-white font-bold text-sm hover:bg-[#0A0A0F] hover:text-[#6C47FF] transition-colors shadow-[4px_4px_0px_#00D4AA]">
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'API Keys' && (
            <div className="flex flex-col h-full">
              <div className="p-6 border-b border-[#0A0A0F] flex justify-between items-center">
                <h2 className="text-lg font-black text-white uppercase tracking-widest">API Keys</h2>
                <button className="px-4 py-1.5 bg-[#6C47FF] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#111118] border-2 border-[#6C47FF] transition-colors">
                  Create New Key +
                </button>
              </div>
              <div className="p-6 flex-1 overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="border-b border-[#0A0A0F]">
                    <tr>
                      <th className="pb-3 font-bold text-[#888899] uppercase tracking-wider text-xs">Name</th>
                      <th className="pb-3 font-bold text-[#888899] uppercase tracking-wider text-xs">Key</th>
                      <th className="pb-3 font-bold text-[#888899] uppercase tracking-wider text-xs">Last Used</th>
                      <th className="pb-3 font-bold text-[#888899] uppercase tracking-wider text-xs">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-[#0A0A0F]">
                      <td className="py-4 font-bold text-[#F0F0F0]">Production Sync</td>
                      <td className="py-4">
                        <div className="flex items-center gap-2 font-mono text-[#888899] bg-[#0A0A0F] px-2 py-1 border border-[#111118] w-fit">
                          {showKey ? 'vf_live_placeholder_key' : '••••••••••••••••'}
                          <button onClick={() => setShowKey(!showKey)} className="hover:text-white transition-colors">
                            {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                        </div>
                      </td>
                        <td className="py-4 text-[#888899]">Recently</td>
                      <td className="py-4">
                        <span className="px-2 py-1 bg-[#00D4AA]/10 text-[#00D4AA] text-[10px] font-black uppercase border border-[#00D4AA]/30">Active</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'Billing' && (
            <div className="flex flex-col h-full">
              <div className="p-6 border-b border-[#0A0A0F]">
                <h2 className="text-lg font-black text-white uppercase tracking-widest">Billing & Usage</h2>
              </div>
              <div className="p-8 flex-1 flex flex-col gap-8">
                
                <div className="p-6 border-2 border-[#6C47FF] bg-[#6C47FF]/5 flex flex-col sm:flex-row justify-between items-center gap-6 shadow-[4px_4px_0px_#6C47FF]">
                  <div>
                    <h3 className="text-xl font-black text-white mb-2">Free Plan</h3>
                    <p className="text-sm text-[#888899]">Usage-based access controls are configured by your plan.</p>
                  </div>
                  <button className="w-full sm:w-auto px-6 py-3 bg-[#6C47FF] text-white font-bold text-sm hover:bg-[#111118] border-2 border-[#6C47FF] transition-colors flex items-center justify-center gap-2">
                    Upgrade to Pro <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-[#F0F0F0]">Usage this month</span>
                    <span className="text-sm font-bold text-[#888899]">Tracked from your backend usage</span>
                  </div>
                  <div className="w-full h-2 bg-[#0A0A0F]">
                    <div className="h-full bg-[#00D4AA] w-[66%]"></div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {activeTab === 'Danger Zone' && (
            <div className="flex flex-col h-full">
              <div className="p-6 border-b border-[#0A0A0F]">
                <h2 className="text-lg font-black text-[#FF4D4F] uppercase tracking-widest">Danger Zone</h2>
              </div>
              <div className="p-8 flex-1 flex flex-col gap-6">
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border border-[#111118] bg-[#0A0A0F]">
                  <div>
                    <h4 className="font-bold text-[#F0F0F0] mb-1">Export Data</h4>
                    <p className="text-xs text-[#888899]">Download all your projects, financial models, and research.</p>
                  </div>
                  <button className="px-4 py-2 border-2 border-[#111118] text-[#F0F0F0] font-bold text-xs hover:border-white transition-colors flex items-center gap-2 shrink-0">
                    <Download className="w-3 h-3" /> Export all data
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border border-[#FF4D4F]/30 bg-[#FF4D4F]/5">
                  <div>
                    <h4 className="font-bold text-[#FF4D4F] mb-1">Delete Account</h4>
                    <p className="text-xs text-[#888899]">Permanently delete your account and all generated projects. This cannot be undone.</p>
                  </div>
                  <button className="px-4 py-2 bg-[#FF4D4F] text-white font-bold text-xs hover:bg-[#0A0A0F] border-2 border-[#FF4D4F] transition-colors shrink-0">
                    Delete Account
                  </button>
                </div>

              </div>
            </div>
          )}

        </div>

      </main>
    </div>
  );
}
