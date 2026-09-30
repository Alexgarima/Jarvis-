import React, { useEffect, useState } from 'react';
import { OrbState } from '../types/jarvis';
import { Mic, Volume2, Sparkles, Loader2 } from 'lucide-react';

interface AIOrbProps {
  state: OrbState;
  audioLevel?: number; // 0 to 1
  onClick?: () => void;
  statusText?: string;
  variant?: 'speaking_chat' | 'home';
}

export const AIOrb: React.FC<AIOrbProps> = ({
  state,
  audioLevel = 0,
  onClick,
  statusText,
  variant = 'speaking_chat',
}) => {
  // Smooth rotation angle and fluid pulse
  const [pulsePhase, setPulsePhase] = useState(0);

  useEffect(() => {
    let animId: number;
    const loop = () => {
      setPulsePhase((prev) => (prev + 0.05) % (Math.PI * 2));
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  const reactiveScale =
    state === 'listening'
      ? 1 + audioLevel * 0.4 + Math.sin(pulsePhase * 2) * 0.05
      : state === 'speaking'
      ? 1.08 + Math.sin(pulsePhase * 3) * 0.06
      : 1 + Math.sin(pulsePhase) * 0.03;

  const sizeClasses =
    variant === 'speaking_chat'
      ? 'w-64 h-64 sm:w-72 sm:h-72'
      : 'w-48 h-48 sm:w-56 sm:h-56';

  return (
    <div className="relative flex flex-col items-center justify-center select-none py-4">
      {/* Outer ambient ethereal backlight (matches Screenshot 1 & 2) */}
      <div
        className="absolute rounded-full pointer-events-none transition-all duration-700 ease-out"
        style={{
          width: variant === 'speaking_chat' ? '360px' : '280px',
          height: variant === 'speaking_chat' ? '360px' : '280px',
          background:
            state === 'thinking'
              ? 'radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, rgba(59, 130, 246, 0.25) 50%, transparent 75%)'
              : state === 'listening'
              ? 'radial-gradient(circle, rgba(6, 182, 212, 0.5) 0%, rgba(236, 72, 153, 0.3) 45%, rgba(59, 130, 246, 0.2) 65%, transparent 80%)'
              : state === 'speaking'
              ? 'radial-gradient(circle, rgba(14, 165, 233, 0.45) 0%, rgba(168, 85, 247, 0.35) 45%, transparent 75%)'
              : 'radial-gradient(circle, rgba(56, 189, 248, 0.3) 0%, rgba(139, 92, 246, 0.2) 45%, transparent 70%)',
          filter: 'blur(55px)',
          opacity: 0.85,
          transform: `scale(${reactiveScale})`,
        }}
      />

      {/* Main Interactive Fluid Sphere Container */}
      <div
        onClick={onClick}
        role="button"
        tabIndex={0}
        aria-label="JARVIS Core Orb - Tap to toggle voice input"
        className={`relative ${sizeClasses} flex items-center justify-center cursor-pointer group focus:outline-none`}
      >
        {/* Luminous Organic Fluid Sphere */}
        <div
          className="absolute inset-0 rounded-full transition-transform duration-300 ease-out"
          style={{
            transform: `scale(${reactiveScale})`,
            boxShadow:
              state === 'listening'
                ? '0 0 50px rgba(6, 182, 212, 0.6), inset 0 0 40px rgba(236, 72, 153, 0.5)'
                : '0 0 40px rgba(56, 189, 248, 0.4), inset 0 0 30px rgba(147, 51, 234, 0.4)',
          }}
        >
          {/* Multi-layered Iridescent Gradient Plasma (inspired by Screenshot 1 Right & 2) */}
          <div
            className={`w-full h-full rounded-full overflow-hidden relative shadow-2xl ${
              state === 'listening'
                ? 'animate-[spin_6s_linear_infinite]'
                : state === 'thinking'
                ? 'animate-[spin_4s_linear_infinite]'
                : 'animate-[spin_16s_linear_infinite]'
            }`}
            style={{
              background:
                'conic-gradient(from 180deg at 50% 50%, #06b6d4 0deg, #3b82f6 72deg, #ec4899 144deg, #a855f7 216deg, #0284c7 288deg, #06b6d4 360deg)',
              filter: 'blur(2px) contrast(1.25) saturate(1.4)',
            }}
          >
            {/* Swirling fluid highlights */}
            <div
              className="absolute inset-2 rounded-full"
              style={{
                background:
                  'radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.85) 0%, rgba(56, 189, 248, 0.6) 25%, rgba(168, 85, 247, 0.7) 60%, rgba(6, 182, 212, 0.9) 100%)',
                mixBlendMode: 'screen',
              }}
            />

            {/* Organic Fluid Shadow & Light Ripples */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  'radial-gradient(circle at 65% 70%, rgba(13, 14, 38, 0.9) 0%, rgba(79, 70, 229, 0.4) 40%, transparent 70%)',
              }}
            />
          </div>

          {/* Fluid Glass Specular Highlights */}
          <div className="absolute top-4 left-6 w-16 h-8 rounded-full bg-white/40 blur-[3px] transform -rotate-45 pointer-events-none" />
          <div className="absolute bottom-5 right-8 w-12 h-6 rounded-full bg-cyan-300/30 blur-[2px] transform rotate-30 pointer-events-none" />

          {/* Subtle Outer Neon Ring Shockwave when active */}
          {state === 'listening' && (
            <div
              className="absolute -inset-3 rounded-full border-2 border-cyan-400/60 animate-ping pointer-events-none"
              style={{ animationDuration: '2.5s' }}
            />
          )}
        </div>

        {/* Center Minimal Icon */}
        <div className="absolute z-10 flex flex-col items-center justify-center text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] pointer-events-none">
          {state === 'thinking' ? (
            <Loader2 className="w-10 h-10 text-white animate-spin drop-shadow-[0_0_12px_rgba(255,255,255,0.9)]" />
          ) : state === 'speaking' ? (
            <Volume2 className="w-10 h-10 text-white animate-pulse drop-shadow-[0_0_12px_rgba(255,255,255,0.9)]" />
          ) : state === 'listening' ? (
            <Mic className="w-10 h-10 text-white animate-bounce drop-shadow-[0_0_12px_rgba(255,255,255,0.9)]" />
          ) : (
            <Sparkles className="w-8 h-8 text-white/90 drop-shadow-[0_0_10px_rgba(255,255,255,0.7)] group-hover:scale-110 transition-transform" />
          )}
        </div>
      </div>
    </div>
  );
};
