import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  FolderPlus,
  Music,
  Disc3,
  X,
  Sparkles,
  Lock,
  Radio,
} from 'lucide-react';
import { offlineMusicManager, MusicTrack } from '../modules/OfflineMusicManager';
import { soundEffects } from '../modules/SoundEffects';

interface OfflineMusicPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OfflineMusicPlayerModal: React.FC<OfflineMusicPlayerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [musicState, setMusicState] = useState(offlineMusicManager.getState());
  const [tracks, setTracks] = useState<MusicTrack[]>(offlineMusicManager.getTracks());
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = offlineMusicManager.subscribe((state) => {
      setMusicState(state);
      setTracks(offlineMusicManager.getTracks());
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

  const handlePlayToggle = () => {
    soundEffects.play('click');
    offlineMusicManager.togglePlay();
  };

  const handleNext = () => {
    soundEffects.play('click');
    offlineMusicManager.next();
  };

  const handlePrev = () => {
    soundEffects.play('click');
    offlineMusicManager.previous();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      soundEffects.play('confirm');
      offlineMusicManager.addLocalFiles(e.target.files);
      setTracks(offlineMusicManager.getTracks());
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#080d24] border border-cyan-500/40 rounded-3xl w-full max-w-lg overflow-hidden shadow-[0_0_60px_rgba(6,182,212,0.25)] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-cyan-900/40 flex items-center justify-between bg-gradient-to-r from-cyan-950/40 to-indigo-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h2 className="font-['Orbitron'] text-base font-bold text-white tracking-wide flex items-center gap-1.5">
                OFFLINE MUSIC MATRIX
              </h2>
              <p className="text-[11px] text-cyan-300/70 font-mono">
                Zero-Internet Audio + Lockscreen Controls
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundEffects.play('click');
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Lock Screen Support Banner */}
          <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-700/40 flex items-center gap-2.5 text-xs text-cyan-200 font-mono">
            <Lock className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              Phone lock hone par bhi music chalta rahega aur Android lock screen par Play/Pause controls milenge!
            </span>
          </div>

          {/* Current Playing Track Card */}
          <div className="p-5 rounded-2xl bg-[#0e1438] border border-cyan-500/30 text-center relative overflow-hidden">
            <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-[10px] text-cyan-300 font-mono">
              <Sparkles className="w-3 h-3 text-cyan-300" />
              <span>100% Offline</span>
            </div>

            {/* Spinning Disc / Visualizer */}
            <div className="relative mx-auto w-24 h-24 my-2 flex items-center justify-center">
              <div
                className={`w-20 h-20 rounded-full border-2 border-cyan-400/50 bg-gradient-to-tr from-cyan-950 to-indigo-950 flex items-center justify-center shadow-[0_0_25px_rgba(6,182,212,0.4)] ${
                  musicState.isPlaying ? 'animate-spin duration-3000' : ''
                }`}
              >
                <Disc3 className="w-10 h-10 text-cyan-300" />
              </div>
            </div>

            <h3 className="text-lg font-bold text-white font-['Orbitron'] truncate mt-1">
              {musicState.currentTrack?.title || 'No Track Selected'}
            </h3>
            <p className="text-xs text-cyan-300/80 font-mono truncate">
              {musicState.currentTrack?.artist || 'J.A.R.V.I.S. Audio'}
            </p>

            {/* Progress Bar */}
            <div className="mt-4 space-y-1">
              <input
                type="range"
                min={0}
                max={musicState.duration || 100}
                value={musicState.currentTime}
                onChange={(e) => offlineMusicManager.seek(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>{formatTime(musicState.currentTime)}</span>
                <span>{formatTime(musicState.duration)}</span>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-4 mt-3">
              <button
                onClick={handlePrev}
                className="p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Previous Track"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                onClick={handlePlayToggle}
                className="p-4 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all hover:scale-105 cursor-pointer"
                title={musicState.isPlaying ? 'Pause' : 'Play'}
              >
                {musicState.isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6 ml-0.5" />
                )}
              </button>

              <button
                onClick={handleNext}
                className="p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Next Track"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800">
            <Volume2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={musicState.volume}
              onChange={(e) => offlineMusicManager.setVolume(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <span className="text-xs font-mono text-slate-400 w-9 text-right">
              {Math.round(musicState.volume * 100)}%
            </span>
          </div>

          {/* Add Local Device Files Button */}
          <div className="flex items-center justify-between pt-1">
            <span className="font-['Orbitron'] text-xs font-bold text-white tracking-wider">
              PLAYLIST ({tracks.length})
            </span>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900/80 border border-cyan-500/50 text-cyan-300 text-xs font-mono transition-all cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>Add Local MP3</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="audio/*"
              multiple
              className="hidden"
            />
          </div>

          {/* Track List */}
          <div className="max-h-48 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
            {tracks.map((t) => {
              const isCurrent = musicState.currentTrack?.id === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => {
                    soundEffects.play('click');
                    offlineMusicManager.playTrack(t.id);
                  }}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-cyan-950/50 border-cyan-400/60 text-white shadow-inner'
                      : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/70 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isCurrent
                          ? 'bg-cyan-500 text-slate-950'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Music className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-medium truncate">{t.title}</p>
                      <p className="text-[10px] text-slate-400 font-mono truncate">
                        {t.artist} • {t.sourceType === 'synth' ? 'Synth' : 'Local File'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 shrink-0 ml-2">
                    {formatTime(t.duration)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
