import { BarChart3, PieChart, Scale, Presentation, Cpu, RefreshCw } from 'lucide-react';

const features = [
  { name: 'Market Analysis', icon: BarChart3 },
  { name: 'Financial Model', icon: PieChart },
  { name: 'Legal Compliance', icon: Scale },
  { name: 'Pitch Deck', icon: Presentation },
  { name: 'MVP Architecture', icon: Cpu },
  { name: 'Pivot Simulation', icon: RefreshCw },
];

export default function FeatureGrid() {
  return (
    <section className="max-w-4xl mx-auto mt-24 mb-32 px-4 w-full">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <div 
              key={i} 
              className="border-2 border-[#6C47FF] bg-[#12121A] p-5 shadow-[4px_4px_0px_#6C47FF] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#00D4AA] hover:border-[#00D4AA] transition-all flex items-center gap-4 cursor-default group"
            >
              <div className="p-2 border-2 border-white/10 bg-[#0A0A0F] text-white group-hover:text-[#00D4AA] group-hover:border-[#00D4AA] transition-colors">
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-sm md:text-base font-bold text-white group-hover:text-[#00D4AA] transition-colors">
                {f.name}
              </h3>
            </div>
          );
        })}
      </div>
    </section>
  );
}
