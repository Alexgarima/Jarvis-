import React, { useState, useEffect } from 'react';
import { StructuredAction, AccessibilityStep } from '../types/jarvis';
import { accessibilityManager } from '../modules/AccessibilityManager';
import { soundEffects } from '../modules/SoundEffects';
import { X, Play, ShieldCheck, Terminal, ExternalLink, CheckCircle, Loader2 } from 'lucide-react';

interface CommandHUDModalProps {
  action: StructuredAction | null;
  onClose: () => void;
  onExecute: (action: StructuredAction) => void;
}

export const CommandHUDModal: React.FC<CommandHUDModalProps> = ({
  action,
  onClose,
  onExecute,
}) => {
  const [steps, setSteps] = useState<AccessibilityStep[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    if (action) {
      const generated = accessibilityManager.generateStepSequence(action);
      setSteps(generated);
    }
  }, [action]);

  if (!action) return null;

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    soundEffects.play('activate');
    await accessibilityManager.executeSimulatedFlow(action, (updatedSteps) => {
      setSteps(updatedSteps);
    });
    setIsSimulating(false);
    soundEffects.play('complete');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-mono">
      <div className="w-full max-w-xl bg-slate-950 border border-cyan-800/80 rounded-2xl shadow-[0_0_40px_rgba(6,182,212,0.25)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-cyan-900/60 bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-sm tracking-wider text-white">
              ANDROID INTENT & ACCESSIBILITY PIPELINE
            </span>
          </div>
          <button
            onClick={() => {
              soundEffects.play('click');
              onClose();
            }}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Target Profile Card */}
          <div className="bg-slate-900/90 border border-cyan-900/50 rounded-xl p-4">
            <div className="text-[11px] uppercase tracking-wider text-cyan-400 font-semibold mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>COMMAND STRUCTURE (APP + SCREEN + ELEMENT + ACTION)</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-slate-950/80 p-2 rounded border border-cyan-950">
                <span className="text-slate-500 text-[10px] block">APP</span>
                <span className="text-cyan-300 font-bold">{action.app}</span>
              </div>
              <div className="bg-slate-950/80 p-2 rounded border border-cyan-950">
                <span className="text-slate-500 text-[10px] block">SCREEN</span>
                <span className="text-slate-200">{action.screen || 'Main'}</span>
              </div>
              <div className="bg-slate-950/80 p-2 rounded border border-cyan-950">
                <span className="text-slate-500 text-[10px] block">TARGET ELEMENT</span>
                <span className="text-slate-200 truncate block">{action.element || 'None'}</span>
              </div>
              <div className="bg-slate-950/80 p-2 rounded border border-cyan-950">
                <span className="text-slate-500 text-[10px] block">ACTION</span>
                <span className="text-emerald-400 font-bold uppercase">{action.action}</span>
              </div>
            </div>

            {action.text && (
              <div className="mt-2 text-xs bg-slate-950/90 px-3 py-1.5 rounded border border-cyan-950 text-cyan-200">
                <span className="text-slate-500">Payload: </span>"{action.text}"
              </div>
            )}
          </div>

          {/* Fallback Hierarchy Information */}
          <div className="text-[11px] text-slate-400 bg-cyan-950/20 border border-cyan-900/30 rounded-lg p-3">
            <span className="text-cyan-400 font-bold block mb-1">
              NON-ROOT FALLBACK ARCHITECTURE (Requirement 13):
            </span>
            <div className="flex items-center gap-2 text-[10px] text-slate-300 flex-wrap">
              <span className="bg-cyan-900/50 px-2 py-0.5 rounded border border-cyan-700">1. Direct Intent</span>
              <span>→</span>
              <span className="bg-cyan-900/50 px-2 py-0.5 rounded border border-cyan-700">2. Deep Link</span>
              <span>→</span>
              <span className="bg-cyan-900/50 px-2 py-0.5 rounded border border-cyan-700">3. Accessibility Interaction</span>
              <span>→</span>
              <span className="bg-cyan-900/50 px-2 py-0.5 rounded border border-cyan-700">4. Guided Action</span>
            </div>
          </div>

          {/* Step Sequence Inspector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                ACCESSIBILITY NODE TREE EXECUTION
              </span>
              <button
                onClick={handleRunSimulation}
                disabled={isSimulating}
                className="px-2.5 py-1 rounded bg-cyan-900/60 hover:bg-cyan-800 text-cyan-300 text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSimulating ? (
                  <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />
                ) : (
                  <Play className="w-3 h-3 fill-current" />
                )}
                <span>Simulate Node Traversal</span>
              </button>
            </div>

            <div className="space-y-2">
              {steps.map((st) => (
                <div
                  key={st.step}
                  className={`p-3 rounded-xl border text-xs transition-all flex items-start gap-3 ${
                    st.status === 'running'
                      ? 'bg-cyan-950/70 border-cyan-400/80 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                      : st.status === 'completed'
                      ? 'bg-slate-900/80 border-emerald-500/40 text-slate-300'
                      : 'bg-slate-950/60 border-slate-800 text-slate-500'
                  }`}
                >
                  <div className="mt-0.5">
                    {st.status === 'running' ? (
                      <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                    ) : st.status === 'completed' ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-700 flex items-center justify-center text-[9px] text-slate-500">
                        {st.step}
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200">{st.label}</span>
                      <span className="text-[10px] text-cyan-400 uppercase font-mono">
                        {st.actionType}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{st.detail}</p>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-cyan-300/80">
                      <span>Screen: {st.targetScreen}</span>
                      <span>·</span>
                      <span className="font-mono text-cyan-500 truncate max-w-xs">
                        Target: {st.targetElement}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-cyan-900/60 bg-slate-900/80 flex items-center justify-between">
          <button
            onClick={() => {
              soundEffects.play('click');
              onClose();
            }}
            className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Close
          </button>

          <button
            onClick={() => {
              soundEffects.play('complete');
              onExecute(action);
              onClose();
            }}
            className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.4)] flex items-center gap-2 transition-all cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Launch Intent on Device</span>
          </button>
        </div>
      </div>
    </div>
  );
};
