import React from 'react';
import { StructuredAction } from '../types/jarvis';
import { ShieldAlert, Check, X, MessageSquare, Phone, UserPlus, PlayCircle, Send } from 'lucide-react';
import { soundEffects } from '../modules/SoundEffects';

interface ConfirmationModalProps {
  action: StructuredAction | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  action,
  onConfirm,
  onCancel,
}) => {
  if (!action) return null;

  const getActionIcon = () => {
    switch (action.action) {
      case 'compose':
        return <MessageSquare className="w-6 h-6 text-emerald-400" />;
      case 'follow_and_dm':
      case 'follow':
        return <UserPlus className="w-6 h-6 text-pink-400" />;
      case 'call':
        return <Phone className="w-6 h-6 text-blue-400" />;
      case 'play':
        return <PlayCircle className="w-6 h-6 text-red-400" />;
      default:
        return <ShieldAlert className="w-6 h-6 text-amber-400" />;
    }
  };

  const getActionTitle = () => {
    if (action.action === 'follow_and_dm') return 'Instagram Follow & DM';
    if (action.action === 'follow') return 'Instagram Follow Request';
    if (action.action === 'compose') return 'WhatsApp Message Send';
    return `${action.app} ${action.action.toUpperCase()}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-sans select-none">
      <div className="w-full max-w-md bg-[#0c1024] border-2 border-amber-500/70 rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.25)] flex flex-col overflow-hidden">
        {/* Header Alert Bar */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-950/80 via-amber-900/50 to-[#0c1024] border-b border-amber-600/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-400 animate-pulse" />
            <span className="font-bold text-sm tracking-wide text-amber-200">
              Action Confirmation Required
            </span>
          </div>
          <button
            onClick={() => {
              soundEffects.play('click');
              onCancel();
            }}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-[#141b3f] border border-amber-500/30 flex items-center justify-center shadow-inner">
              {getActionIcon()}
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-semibold">
                Target Application: {action.app}
              </span>
              <span className="text-lg font-bold text-white tracking-wide">
                {getActionTitle()}
              </span>
            </div>
          </div>

          {/* Action Details */}
          <div className="bg-[#101533] border border-cyan-900/40 rounded-2xl p-4 space-y-2.5 text-xs">
            {action.recipient && (
              <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                <span className="text-slate-400 font-medium">Recipient / Contact:</span>
                <span className="text-cyan-300 font-bold text-sm">{action.recipient}</span>
              </div>
            )}
            {action.text && (
              <div className="py-1">
                <span className="text-slate-400 font-medium block mb-1">
                  {action.action.includes('follow') ? 'Target Profile:' : 'Message Content:'}
                </span>
                <div className="bg-[#090c1f] p-3 rounded-xl border border-cyan-950 text-slate-100 font-mono text-xs">
                  {action.text}
                </div>
              </div>
            )}
            {action.additionalMessage && (
              <div className="py-1">
                <span className="text-slate-400 font-medium block mb-1">DM Message:</span>
                <div className="bg-[#090c1f] p-3 rounded-xl border border-cyan-950 text-cyan-200 font-mono text-xs italic">
                  "{action.additionalMessage}"
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-amber-200/90 text-center leading-relaxed">
            Sir, should I proceed with executing this action? You can say <span className="font-bold text-white">"Yes"</span> or tap proceed.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#0a0d20] border-t border-slate-800/80 flex items-center gap-3">
          <button
            onClick={() => {
              soundEffects.play('click');
              onCancel();
            }}
            className="flex-1 py-3 rounded-2xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-rose-400" />
            <span>Cancel</span>
          </button>

          <button
            onClick={() => {
              soundEffects.play('confirm');
              onConfirm();
            }}
            className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Yes, Proceed</span>
          </button>
        </div>
      </div>
    </div>
  );
};
