import React, { useState, useEffect } from 'react';
import { Phone, PhoneCall, PhoneOff, Volume2, Mic, MicOff, User, X, ShieldAlert } from 'lucide-react';
import { callManager, Contact } from '../modules/CallManager';
import { soundEffects } from '../modules/SoundEffects';

interface CallHUDModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetContactName?: string;
  targetPhoneNumber?: string;
  onCallInitiated?: (number: string) => void;
}

export const CallHUDModal: React.FC<CallHUDModalProps> = ({
  isOpen,
  onClose,
  targetContactName = 'Papa',
  targetPhoneNumber = '+919876543210',
  onCallInitiated,
}) => {
  const [activeNumber, setActiveNumber] = useState<string>(targetPhoneNumber);
  const [activeName, setActiveName] = useState<string>(targetContactName);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isLoudspeaker, setIsLoudspeaker] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'dialer_dispatched'>('connecting');
  const contacts = callManager.getContacts();

  useEffect(() => {
    setActiveNumber(targetPhoneNumber);
    setActiveName(targetContactName);
    setCallDuration(0);
    setCallStatus('connecting');
  }, [targetPhoneNumber, targetContactName, isOpen]);

  useEffect(() => {
    let timer: number;
    if (isOpen) {
      soundEffects.play('activate');
      // Simulate connection timer
      timer = window.setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleExecuteRealDial = () => {
    soundEffects.play('confirm');
    setCallStatus('dialer_dispatched');
    callManager.makeCall(activeNumber);
    onCallInitiated?.(activeNumber);
  };

  const handleSelectContact = (c: Contact) => {
    soundEffects.play('click');
    setActiveName(c.name);
    setActiveNumber(c.phoneNumber);
    setCallStatus('connecting');
    setCallDuration(0);
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="bg-[#070b1e] border-2 border-cyan-500/50 rounded-3xl w-full max-w-md overflow-hidden shadow-[0_0_60px_rgba(6,182,212,0.3)] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-cyan-900/50 flex items-center justify-between bg-gradient-to-r from-cyan-950/40 to-indigo-950/40">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="font-['Orbitron'] text-xs font-bold tracking-widest text-cyan-300">
              JARVIS TELEPHONY INTERFACE
            </span>
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

        {/* Call Visualizer */}
        <div className="p-8 text-center space-y-6">
          {/* Avatar Ring */}
          <div className="relative mx-auto w-28 h-28 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-cyan-400/30 animate-ping opacity-75"></div>
            <div className="absolute -inset-2 rounded-full border border-cyan-500/40 animate-spin duration-1000"></div>
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-cyan-900/80 to-indigo-900/80 border-2 border-cyan-400 flex items-center justify-center text-cyan-200 shadow-[0_0_30px_rgba(6,182,212,0.5)]">
              <User className="w-12 h-12" />
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white font-['Orbitron'] tracking-wide">
              {activeName}
            </h2>
            <p className="text-cyan-300 font-mono text-sm mt-1">{activeNumber}</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-700/50 text-cyan-300 font-mono">
                {callStatus === 'dialer_dispatched'
                  ? 'Dispatched to Phone Dialer'
                  : `Connecting Call... ${formatDuration(callDuration)}`}
              </span>
            </div>
          </div>

          {/* Quick Controls */}
          <div className="flex items-center justify-center gap-4 py-2">
            <button
              onClick={() => {
                soundEffects.play('click');
                setIsMuted(!isMuted);
              }}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                isMuted
                  ? 'bg-rose-950/60 border-rose-500 text-rose-300'
                  : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <button
              onClick={() => {
                soundEffects.play('click');
                setIsLoudspeaker(!isLoudspeaker);
              }}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                isLoudspeaker
                  ? 'bg-cyan-950/60 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title={isLoudspeaker ? 'Loudspeaker ON' : 'Speaker'}
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>

          {/* Main Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleExecuteRealDial}
              className="py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all cursor-pointer"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Launch Dialer</span>
            </button>

            <button
              onClick={() => {
                soundEffects.play('click');
                onClose();
              }}
              className="py-3.5 px-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all cursor-pointer"
            >
              <PhoneOff className="w-4 h-4" />
              <span>End Call</span>
            </button>
          </div>

          {/* Speed Dial Contacts */}
          <div className="border-t border-slate-800/80 pt-4 text-left">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono text-cyan-400/80 uppercase">
                Quick Speed Dial
              </span>
              <span className="text-[10px] text-slate-400">Say &quot;Call [Name]&quot;</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              {contacts.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelectContact(c)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-medium whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                    activeName === c.name
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
