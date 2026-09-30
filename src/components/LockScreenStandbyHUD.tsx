import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  Mic,
  PhoneCall,
  Play,
  Pause,
  SkipForward,
  Shield,
  Battery,
  Wifi,
  Sparkles,
} from 'lucide-react';
import { backgroundWakeManager } from '../modules/BackgroundWakeManager';
import { offlineMusicManager } from '../modules/OfflineMusicManager';
import { soundEffects } from '../modules/SoundEffects';

interface LockScreenStandbyHUDProps {
  isOpen: boolean;
  onUnlock: () => void;
  onCallRequested: () => void;
  onMusicRequested: () => void;
  onVoiceCommand: (text: string) => void;
}

export const LockScreenStandbyHUD: React.FC<LockScreenStandbyHUDProps> = ({
  isOpen,
  onUnlock,
  onCallRequested,
  onMusicRequested,
  onVoiceCommand,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');
  const [musicState, setMusicState] = useState(offlineMusicManager.getState());
  const [lastHeard, setLastHeard] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setDateStr(
        now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const unsub = offlineMusicManager.subscribe((state) => {
      setMusicState(state);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (isOpen) {
      backgroundWakeManager.requestWakeLock();
      backgroundWakeManager.startBackgroundListening((cmd) => {
        setLastHeard(cmd);
        onVoiceCommand(cmd);
      });
    }
  }, [isOpen, onVoiceCommand]);

  if (!isOpen) return null;

  const handleUnlockClick = () => {
    soundEffects.play('confirm');
    onUnlock();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#02040a] text-white flex flex-col justify-between p-6 select-none animate-in fade-in duration-300">
      {/* Top Status Bar */}
      <div className="flex items-center justify-between text-xs font-mono text-cyan-400/80 px-2 pt-2">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-cyan-400" />
          <span>J.A.R.V.I.S. LOCKED STANDBY</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            WAKELOCK ACTIVE
          </span>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Battery className="w-4 h-4 text-emerald-400" />
            <Wifi className="w-3.5 h-3.5 text-cyan-400" />
          </div>
        </div>
      </div>

      {/* Center Clock & Arc Reactor */}
      <div className="text-center my-auto space-y-6">
        {/* Holographic Glowing Clock */}
        <div>
          <h1 className="text-6xl sm:text-7xl font-bold font-['Orbitron'] tracking-wider bg-gradient-to-b from-white via-cyan-100 to-cyan-400/80 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(6,182,212,0.6)]">
            {timeStr}
          </h1>
          <p className="text-cyan-300/80 font-mono text-sm tracking-wide mt-2">
            {dateStr}
          </p>
        </div>

        {/* Pulsing Arc Reactor Sphere */}
        <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-cyan-400/20 animate-ping opacity-50"></div>
          <div className="absolute -inset-3 rounded-full border border-cyan-500/30 animate-spin duration-3000"></div>
          <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-cyan-950 via-[#071330] to-indigo-950 border-2 border-cyan-400/60 flex flex-col items-center justify-center shadow-[0_0_40px_rgba(6,182,212,0.4)]">
            <Mic className="w-8 h-8 text-cyan-300 animate-pulse" />
            <span className="text-[9px] font-mono text-cyan-400 mt-1 uppercase tracking-wider">
              Listening
            </span>
          </div>
        </div>

        {/* Voice Trigger Hint */}
        <div className="max-w-sm mx-auto p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-700/40 text-center">
          <p className="text-xs text-cyan-200 font-mono flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Voice Active: Say &quot;Call Papa&quot; or &quot;Offline Music Play&quot;</span>
          </p>
          {lastHeard && (
            <p className="text-[11px] text-emerald-400 font-mono mt-1 truncate">
              Heard: &quot;{lastHeard}&quot;
            </p>
          )}
        </div>

        {/* Lockscreen Media Player Widget */}
        {musicState.isPlaying && (
          <div className="max-w-xs mx-auto p-3 rounded-2xl bg-[#0c1230]/80 border border-cyan-500/40 flex items-center justify-between shadow-[0_0_20px_rgba(6,182,212,0.2)]">
            <div className="truncate text-left pr-2">
              <p className="text-xs font-semibold text-white truncate">
                {musicState.currentTrack?.title}
              </p>
              <p className="text-[10px] text-cyan-300/80 font-mono truncate">
                {musicState.currentTrack?.artist}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  soundEffects.play('click');
                  offlineMusicManager.togglePlay();
                }}
                className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center cursor-pointer"
              >
                {musicState.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>
              <button
                onClick={() => {
                  soundEffects.play('click');
                  offlineMusicManager.next();
                }}
                className="w-8 h-8 rounded-full bg-cyan-500/10 text-cyan-300 flex items-center justify-center cursor-pointer"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Actions Bar */}
      <div className="flex items-center justify-between px-4 pb-4">
        {/* Quick Phone Call Button */}
        <button
          onClick={() => {
            soundEffects.play('click');
            onCallRequested();
          }}
          className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono transition-all cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.2)]"
        >
          <PhoneCall className="w-4 h-4" />
          <span>Call Papa</span>
        </button>

        {/* Music Player Button */}
        <button
          onClick={() => {
            soundEffects.play('click');
            onMusicRequested();
          }}
          className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-500/40 text-indigo-300 text-xs font-mono transition-all cursor-pointer shadow-[0_0_15px_rgba(99,102,241,0.2)]"
        >
          <Play className="w-4 h-4" />
          <span>Offline Music</span>
        </button>

        {/* Unlock Button */}
        <button
          onClick={handleUnlockClick}
          className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400 text-cyan-300 text-xs font-mono transition-all cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.3)]"
        >
          <Unlock className="w-4 h-4" />
          <span>Unlock HUD</span>
        </button>
      </div>
    </div>
  );
};
