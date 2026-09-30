import React, { useEffect, useState } from 'react';
import { OrbState, StructuredAction } from '../types/jarvis';
import { AIOrb } from './AIOrb';
import { soundEffects } from '../modules/SoundEffects';
import {
  ChevronLeft,
  User,
  X,
  Mic,
  Send,
  PlayCircle,
  MessageSquare,
  UserPlus,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

interface SpeakingChatViewProps {
  orbState: OrbState;
  audioLevel: number;
  statusText: string;
  transcriptText: string;
  activeAction?: StructuredAction | null;
  onToggleListening: () => void;
  onClose: () => void;
  onSendTextPrompt: (text: string) => void;
  onExecuteAction: (action: StructuredAction) => void;
  onInspectAction: (action: StructuredAction) => void;
  onRequestPermissions: () => void;
}

export const SpeakingChatView: React.FC<SpeakingChatViewProps> = ({
  orbState,
  audioLevel,
  statusText,
  transcriptText,
  activeAction,
  onToggleListening,
  onClose,
  onSendTextPrompt,
  onExecuteAction,
  onInspectAction,
  onRequestPermissions,
}) => {
  const [seconds, setSeconds] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-40 bg-[#080b18] text-white flex flex-col justify-between p-6 select-none animate-fade-in font-sans">
      {/* Top Bar (Matches Screenshot 1 Right) */}
      <header className="flex items-center justify-between pt-2">
        <button
          onClick={() => {
            soundEffects.play('click');
            onClose();
          }}
          className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
          aria-label="Back to Main Screen"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full overflow-hidden border border-cyan-400/60 shadow-[0_0_10px_rgba(6,182,212,0.4)]">
            <img
              src="/jarvis-logo.jpg"
              alt="JARVIS"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <span className="text-sm font-semibold tracking-wide text-slate-200">
            Speaking AI Chat
          </span>
        </div>

        <button
          onClick={onRequestPermissions}
          className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 p-0.5 shadow-md cursor-pointer flex items-center justify-center"
          title="App Permissions"
        >
          <div className="w-full h-full rounded-full bg-[#0d122b] flex items-center justify-center text-cyan-300">
            <User className="w-5 h-5" />
          </div>
        </button>
      </header>

      {/* Main Center Content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center my-auto px-4 max-w-lg mx-auto w-full">
        {/* Assistant Title Headline (Matches Screenshot 1 Right) */}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2 leading-tight">
          {transcriptText ? (
            <span className="text-cyan-300">"{transcriptText}"</span>
          ) : (
            statusText || 'I Am Your AI Assistant, How Can I Help You?'
          )}
        </h1>

        {/* Fluid Iridescent Glowing AI Orb */}
        <div className="my-6">
          <AIOrb
            state={orbState}
            audioLevel={audioLevel}
            onClick={onToggleListening}
            variant="speaking_chat"
          />
        </div>

        {/* Live Audio Equalizer Waveform & Timer (Matches Screenshot 1 Right) */}
        <div className="flex flex-col items-center gap-2 mt-2">
          <span className="text-xs font-mono text-cyan-400/90 font-medium">
            {formatTimer(seconds)}
          </span>

          <div className="flex items-center gap-1 h-6">
            {[4, 8, 14, 22, 16, 26, 18, 12, 6, 16, 24, 18, 10, 5].map((h, i) => {
              const dynamicHeight =
                orbState === 'listening'
                  ? Math.max(4, Math.min(26, h * (1 + audioLevel * 1.5)))
                  : orbState === 'speaking'
                  ? Math.max(4, h * 0.9)
                  : 4;

              return (
                <div
                  key={i}
                  className="w-1 bg-gradient-to-t from-cyan-500 to-indigo-400 rounded-full transition-all duration-150"
                  style={{ height: `${dynamicHeight}px` }}
                />
              );
            })}
          </div>
        </div>

        {/* Active Action Card (if action triggered) */}
        {activeAction && activeAction.app !== 'JARVIS' && (
          <div className="mt-4 w-full bg-[#111738]/90 border border-cyan-800/60 rounded-2xl p-4 shadow-lg text-left animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase font-bold text-cyan-400 flex items-center gap-1.5">
                {activeAction.app === 'YouTube' && <PlayCircle className="w-4 h-4 text-red-400" />}
                {activeAction.app === 'WhatsApp' && <MessageSquare className="w-4 h-4 text-emerald-400" />}
                {activeAction.app === 'Instagram' && <UserPlus className="w-4 h-4 text-pink-400" />}
                <span>
                  {activeAction.app} ({activeAction.action.toUpperCase()})
                </span>
              </span>

              {activeAction.confirmationRequired && (
                <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" />
                  CONFIRMATION REQUIRED
                </span>
              )}
            </div>

            <p className="text-xs text-slate-200">
              {activeAction.text && <span className="font-semibold text-white">Target: "{activeAction.text}" </span>}
              {activeAction.additionalMessage && (
                <span className="block text-slate-400 mt-1 italic">Message: "{activeAction.additionalMessage}"</span>
              )}
            </p>

            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => {
                  soundEffects.play('click');
                  onInspectAction(activeAction);
                }}
                className="flex-1 py-1.5 px-3 rounded-xl bg-slate-900 border border-cyan-900/60 text-xs text-cyan-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Inspect Automation</span>
              </button>

              <button
                onClick={() => {
                  soundEffects.play('confirm');
                  onExecuteAction(activeAction);
                }}
                className="flex-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Execute Now</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Floating Control Buttons (Matches Screenshot 1 Right: ✕ , Glowing Mic, ➔) */}
      <footer className="w-full flex items-center justify-center gap-10 pb-6 pt-4 max-w-sm mx-auto">
        {/* Cancel / Close Button */}
        <button
          onClick={() => {
            soundEffects.play('click');
            onClose();
          }}
          className="w-13 h-13 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          title="Cancel"
          aria-label="Cancel"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Center Prominent Glowing Gradient Microphone Button */}
        <div className="relative flex items-center justify-center">
          {/* Outer glowing aura */}
          <div
            className={`absolute -inset-3 rounded-full transition-all duration-500 ${
              orbState === 'listening'
                ? 'bg-cyan-500/30 blur-xl scale-125'
                : 'bg-cyan-600/20 blur-lg'
            }`}
          />

          <button
            onClick={onToggleListening}
            className={`relative w-20 h-20 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-300 cursor-pointer ${
              orbState === 'listening'
                ? 'bg-gradient-to-tr from-cyan-400 via-sky-400 to-blue-500 shadow-[0_0_40px_rgba(6,182,212,0.8)] scale-105'
                : 'bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 shadow-[0_0_30px_rgba(14,165,233,0.5)] hover:scale-105'
            }`}
            title="Toggle Microphone"
            aria-label="Toggle Microphone"
          >
            <Mic className="w-8 h-8 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]" />
          </button>
        </div>

        {/* Action / Send Prompt Button */}
        <button
          onClick={() => {
            soundEffects.play('click');
            onSendTextPrompt(transcriptText || statusText);
          }}
          className="w-13 h-13 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          title="Send / Submit"
          aria-label="Submit Command"
        >
          <Send className="w-5 h-5 -rotate-12 translate-x-0.5" />
        </button>
      </footer>
    </div>
  );
};
