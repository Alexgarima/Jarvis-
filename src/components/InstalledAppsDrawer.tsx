import React from 'react';
import { ANDROID_APPS } from '../modules/AppManager';
import { AndroidApp } from '../types/jarvis';
import { soundEffects } from '../modules/SoundEffects';
import {
  X,
  Youtube,
  Instagram,
  MessageCircle,
  Compass,
  Calculator,
  Settings,
  Camera,
  Clock,
  Phone,
  MapPin,
  Play,
  Terminal,
} from 'lucide-react';

interface InstalledAppsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCommand: (cmd: string) => void;
  onOpenApkModal?: () => void;
}

export const InstalledAppsDrawer: React.FC<InstalledAppsDrawerProps> = ({
  isOpen,
  onClose,
  onSelectCommand,
  onOpenApkModal,
}) => {
  if (!isOpen) return null;

  const renderIcon = (name: string) => {
    switch (name) {
      case 'youtube':
        return <Youtube className="w-5 h-5 text-red-400" />;
      case 'instagram':
        return <Instagram className="w-5 h-5 text-pink-400" />;
      case 'message-circle':
        return <MessageCircle className="w-5 h-5 text-emerald-400" />;
      case 'compass':
        return <Compass className="w-5 h-5 text-blue-400" />;
      case 'calculator':
        return <Calculator className="w-5 h-5 text-amber-400" />;
      case 'settings':
        return <Settings className="w-5 h-5 text-slate-300" />;
      case 'camera':
        return <Camera className="w-5 h-5 text-purple-400" />;
      case 'clock':
        return <Clock className="w-5 h-5 text-cyan-400" />;
      case 'phone':
        return <Phone className="w-5 h-5 text-green-400" />;
      case 'map-pin':
        return <MapPin className="w-5 h-5 text-rose-400" />;
      default:
        return <Terminal className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/75 backdrop-blur-sm animate-fade-in font-mono select-none">
      <div className="w-full max-w-md h-full bg-slate-950 border-l border-cyan-900/60 shadow-[-10px_0_40px_rgba(6,182,212,0.2)] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-cyan-900/60 bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-cyan-400/60 shadow-[0_0_10px_rgba(6,182,212,0.4)]">
              <img
                src="/jarvis-logo.jpg"
                alt="JARVIS Logo"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <span className="font-['Orbitron'] font-bold text-sm tracking-wider text-white block">
                JARVIS APPS
              </span>
              <span className="text-[10px] text-cyan-400 font-mono block">Android Automation Subsystems</span>
            </div>
          </div>
          <button
            onClick={() => {
              soundEffects.play('click');
              onClose();
            }}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          <p className="text-[11px] text-slate-400">
            JARVIS controls these installed Android subsystems via Direct Intents, Deep Links, and Accessibility node injection. Tap any test command to execute.
          </p>

          <div className="space-y-3">
            {ANDROID_APPS.map((app) => (
              <div
                key={app.id}
                className="bg-slate-900/80 border border-cyan-950 rounded-xl p-3.5 space-y-2 hover:border-cyan-800/60 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                      {renderIcon(app.icon)}
                    </div>
                    <div>
                      <span className="font-bold text-slate-100 text-sm block">{app.name}</span>
                      <span className="text-[10px] text-cyan-500 font-mono block">
                        {app.packageName}
                      </span>
                    </div>
                  </div>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
                    {app.category}
                  </span>
                </div>

                {/* Sample voice commands */}
                <div className="pt-2 border-t border-slate-800/80 space-y-1">
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">
                    Supported Natural Commands:
                  </span>
                  <div className="flex flex-col gap-1">
                    {app.sampleCommands.map((cmd, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          soundEffects.play('click');
                          onSelectCommand(cmd);
                          onClose();
                        }}
                        className="text-left py-1 px-2 rounded bg-slate-950/70 hover:bg-cyan-950/60 hover:text-cyan-200 text-slate-300 text-[11px] border border-transparent hover:border-cyan-900/40 transition-colors flex items-center justify-between group cursor-pointer"
                      >
                        <span className="truncate">"{cmd}"</span>
                        <Play className="w-2.5 h-2.5 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity fill-current shrink-0 ml-1" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Contact & Support */}
          <div className="p-4 border-t border-cyan-900/60 bg-slate-900/90 shrink-0 space-y-3">
            {onOpenApkModal && (
              <button
                onClick={() => {
                  soundEffects.play('click');
                  onClose();
                  onOpenApkModal();
                }}
                className="w-full py-2 px-3 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-700/60 text-cyan-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>📦 GitHub Releases & APK Guide</span>
              </button>
            )}

            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-[10px] text-slate-400 block font-mono">Need Help or Support?</span>
                <a
                  href="mailto:mohitgurjar988729@gmail.com?subject=JARVIS%20App%20Support"
                  className="text-xs font-semibold text-cyan-300 hover:text-white font-mono break-all"
                >
                  mohitgurjar988729@gmail.com
                </a>
              </div>
              <a
                href="mailto:mohitgurjar988729@gmail.com?subject=JARVIS%20App%20Support"
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shrink-0 transition-colors"
              >
                Contact
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
