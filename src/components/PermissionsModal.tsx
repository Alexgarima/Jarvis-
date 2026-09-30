import React from 'react';
import { AppPermissionKey } from '../types/jarvis';
import { permissionManager } from '../modules/PermissionManager';
import { soundEffects } from '../modules/SoundEffects';
import {
  ShieldCheck,
  X,
  CheckCircle2,
  AlertTriangle,
  Play,
  ExternalLink,
  MessageSquare,
  UserPlus,
  PlayCircle,
  Mic,
  Layers,
  Sparkles,
} from 'lucide-react';

interface PermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPermissionChange: () => void;
}

export const PermissionsModal: React.FC<PermissionsModalProps> = ({
  isOpen,
  onClose,
  onPermissionChange,
}) => {
  if (!isOpen) return null;

  const permissions = permissionManager.getAll();

  const handleToggle = (key: AppPermissionKey, currentVal: boolean) => {
    permissionManager.setPermission(key, !currentVal);
    onPermissionChange();
  };

  const handleGrantAll = () => {
    permissions.forEach((p) => {
      permissionManager.setPermission(p.key, true);
    });
    soundEffects.play('complete');
    onPermissionChange();
  };

  const getIcon = (key: AppPermissionKey) => {
    switch (key) {
      case 'open_apps':
        return <ExternalLink className="w-5 h-5 text-cyan-400" />;
      case 'youtube_play':
        return <PlayCircle className="w-5 h-5 text-red-400" />;
      case 'whatsapp_messaging':
        return <MessageSquare className="w-5 h-5 text-emerald-400" />;
      case 'instagram_follow_msg':
        return <UserPlus className="w-5 h-5 text-pink-400" />;
      case 'accessibility_service':
        return <ShieldCheck className="w-5 h-5 text-indigo-400" />;
      case 'microphone':
        return <Mic className="w-5 h-5 text-cyan-400" />;
      case 'overlay_display':
        return <Layers className="w-5 h-5 text-amber-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-sans select-none">
      <div className="w-full max-w-lg bg-[#0c1024] border border-cyan-800/60 rounded-3xl shadow-[0_0_60px_rgba(6,182,212,0.25)] flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-cyan-950 bg-gradient-to-r from-[#0f1430] via-[#121940] to-[#0f1430] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full overflow-hidden border border-cyan-400/60 shadow-[0_0_10px_rgba(6,182,212,0.4)]">
              <img
                src="/jarvis-logo.jpg"
                alt="JARVIS"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h2 className="font-bold text-base text-white tracking-wide">
                App Permissions & Automation
              </h2>
              <p className="text-[11px] text-cyan-300/80 font-mono">
                Android System & Deep Automation Access
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundEffects.play('click');
              onClose();
            }}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="px-6 py-3 bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-indigo-950/40 border-b border-cyan-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Non-Root Android Automation Compliance</span>
          </div>
          <button
            onClick={handleGrantAll}
            className="text-[11px] font-semibold text-cyan-300 hover:text-white bg-cyan-900/40 hover:bg-cyan-800/60 px-2.5 py-1 rounded-lg border border-cyan-700/50 transition-colors cursor-pointer"
          >
            Grant All
          </button>
        </div>

        {/* Permissions List */}
        <div className="p-6 overflow-y-auto space-y-3.5 flex-1">
          {permissions.map((perm) => (
            <div
              key={perm.key}
              className={`p-4 rounded-2xl border transition-all ${
                perm.granted
                  ? 'bg-[#101533]/90 border-cyan-900/50 shadow-sm'
                  : 'bg-[#0e122b]/50 border-slate-800/80 opacity-80'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-[#171f45] border border-cyan-900/40 mt-0.5">
                    {getIcon(perm.key)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-white tracking-wide">
                        {perm.title}
                      </h3>
                      {perm.granted ? (
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-400 border border-amber-800/60">
                          REQUIRED
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {perm.description}
                    </p>

                    {/* Features list */}
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {perm.requiredFor.map((feat, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] bg-slate-900/80 text-cyan-300/80 px-2 py-0.5 rounded-md border border-cyan-950"
                        >
                          {feat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Toggle Switch */}
                <button
                  onClick={() => handleToggle(perm.key, perm.granted)}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 mt-1 ${
                    perm.granted ? 'bg-cyan-500' : 'bg-slate-700'
                  }`}
                  role="switch"
                  aria-checked={perm.granted}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform transform shadow-md ${
                      perm.granted ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-cyan-950 bg-[#0c1024] flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono">
            {permissions.filter((p) => p.granted).length} of {permissions.length} Permissions Active
          </span>
          <button
            onClick={() => {
              soundEffects.play('confirm');
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all cursor-pointer"
          >
            Done & Save
          </button>
        </div>
      </div>
    </div>
  );
};
