import { memo } from 'react';
import { Camera, Maximize2, Minus, Plus, RotateCcw, Focus, FileImage } from 'lucide-react';

export default memo(function ArchitectureToolbar({
  onReset,
  onCenter,
  onZoomIn,
  onZoomOut,
}: {
  onReset: () => void;
  onCenter: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}) {
  const items = [
    { label: 'Reset Layout', icon: RotateCcw, action: onReset },
    { label: 'Center Graph', icon: Focus, action: onCenter },
    { label: 'Zoom In', icon: Plus, action: onZoomIn },
    { label: 'Zoom Out', icon: Minus, action: onZoomOut },
    { label: 'Export PNG', icon: Camera, action: () => window.print() },
    { label: 'Export SVG', icon: FileImage, action: () => window.print() },
  ];

  return (
    <div className="flex min-w-max flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-[#0D0D14]/90 p-2">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.label}
            type="button"
            onClick={item.action}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#111118] px-3 py-2 text-xs font-bold text-[#888899] transition-colors hover:border-[#6C47FF] hover:text-white"
          >
            <Icon className="h-3.5 w-3.5" />
            {item.label}
          </button>
        );
      })}
    </div>
  );
});
