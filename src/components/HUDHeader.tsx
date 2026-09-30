import React from 'react';
import { Grid, Trash2 } from 'lucide-react';
import { soundEffects } from '../modules/SoundEffects';

interface HUDHeaderProps {
  onOpenApps: () => void;
  onClearHistory: () => void;
  voiceName: string;
  accessibilityActive: boolean;
}

export const HUDHeader: React.FC<HUDHeaderProps> = ({
  onOpenApps,
  onClearHistory,
  voiceName,
}) => {
  return (
    <header className="w-full border-b border-cyan-950/60 bg-slate-950/70 backdrop-blur-md px-4 py-2.5 flex items-center justify-between text-xs font-mono text-cyan-400 select-none z-20">
      {/* Left: Branding */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
          <h1 className="font-['Orbitron'] font-bold text-base tracking-wider text-white">
            JARVIS
          </h1>
        </div>
      </div>

      {/* Right: Voice Persona Tag, Apps Drawer & Clear History */}
      <div className="flex items-center gap-3 text-[11px]">
        {/* Voice Persona Tag */}
        <div className="hidden sm:flex items-center gap-1 text-slate-400 bg-slate-900/90 border border-cyan-900/40 px-2 py-1 rounded">
          <span className="text-cyan-400 font-semibold">{voiceName}</span>
        </div>

        {/* Apps Drawer Button */}
        <button
          onClick={() => {
            soundEffects.play('click');
            onOpenApps();
          }}
          className="flex items-center gap-1 px-2.5 py-1 rounded border border-cyan-800/60 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/50 hover:text-white transition-colors cursor-pointer"
          title="Open Installed Android Apps Catalog"
        >
          <Grid className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[10px] uppercase tracking-wider font-semibold">APPS</span>
        </button>

        {/* Clear Chat Button */}
        <button
          onClick={() => {
            soundEffects.play('click');
            onClearHistory();
          }}
          className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors cursor-pointer"
          title="Clear Conversation History"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
