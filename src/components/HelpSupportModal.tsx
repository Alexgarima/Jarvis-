import React, { useState } from 'react';
import {
  Mail,
  X,
  Copy,
  Check,
  Send,
  HelpCircle,
  MessageSquare,
  PlayCircle,
  UserPlus,
  ShieldCheck,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { soundEffects } from '../modules/SoundEffects';

interface HelpSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
}

export const HelpSupportModal: React.FC<HelpSupportModalProps> = ({
  isOpen,
  onClose,
  userName = 'Mohit',
}) => {
  const [copied, setCopied] = useState(false);
  const [subject, setSubject] = useState('JARVIS AI Assistant - Help & Support');
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const supportEmail = 'mohitgurjar988729@gmail.com';

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(supportEmail);
    setCopied(true);
    soundEffects.play('confirm');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendEmail = () => {
    soundEffects.play('confirm');
    const mailtoUrl = `mailto:${supportEmail}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(
      `Hello Mohit,\n\n${message || 'I need help with JARVIS AI Assistant.'}\n\nFrom: ${userName}`
    )}`;
    window.open(mailtoUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-sans select-none">
      <div className="w-full max-w-lg bg-[#0c1024] border border-cyan-800/80 rounded-3xl shadow-[0_0_60px_rgba(6,182,212,0.25)] flex flex-col overflow-hidden max-h-[90vh]">
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
              <h2 className="font-bold text-base text-white tracking-wide flex items-center gap-1.5">
                Help & Support
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              </h2>
              <p className="text-[11px] text-cyan-300/80 font-mono">
                Contact Developer & Assistance Hub
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Official Support Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#121738] to-[#0e132e] border border-cyan-700/50 shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-semibold block">
                  Official Support & Developer Contact
                </span>
                <span className="text-sm sm:text-base font-bold text-white break-all select-all font-mono">
                  {supportEmail}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              JARVIS AI Assistant me kisi bhi help, query, app permissions, feature request ya technical issue ke liye directly email bhejein.
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyEmail}
                className="flex-1 py-2 px-3 rounded-xl bg-[#0a0d20] hover:bg-[#151c3d] border border-cyan-900/60 text-xs font-semibold text-cyan-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Email'}</span>
              </button>

              <button
                onClick={handleSendEmail}
                className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Open Gmail / Mail</span>
              </button>
            </div>
          </div>

          {/* Direct Quick Query Form */}
          <div className="p-4 rounded-2xl bg-[#0e122b]/80 border border-cyan-950 space-y-3">
            <span className="text-xs font-bold text-slate-200 tracking-wide block">
              Quick Support Message
            </span>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-[#080b18] border border-cyan-900/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">How can we help you?</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Apna issue ya sawal yaha likhein..."
                rows={3}
                className="w-full bg-[#080b18] border border-cyan-900/60 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <button
              onClick={handleSendEmail}
              className="w-full py-2.5 rounded-xl bg-[#141b40] hover:bg-[#192354] border border-cyan-700/50 text-xs font-semibold text-cyan-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Send Message to {supportEmail}</span>
            </button>
          </div>

          {/* Quick How-To Instructions */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block font-mono">
              Quick Usage Commands
            </span>

            <div className="grid grid-cols-1 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-[#0e122b]/70 border border-slate-800/80 flex items-start gap-2.5">
                <PlayCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white block">YouTube Search & Auto-Play</span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    "YouTube kholo aur BGMI 120 FPS video search karke play karo"
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#0e122b]/70 border border-slate-800/80 flex items-start gap-2.5">
                <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white block">WhatsApp Message</span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    "WhatsApp me Mohit ko search karke message bhejo: Main 10 min me aa raha hoon"
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#0e122b]/70 border border-slate-800/80 flex items-start gap-2.5">
                <UserPlus className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white block">Instagram Follow & DM</span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    "Instagram me @mohit search karo aur follow karo and message bhejo"
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#0e122b]/70 border border-slate-800/80 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white block">Android App Permissions</span>
                  <span className="text-[11px] text-slate-400">
                    App Permissions matrix se YouTube, WhatsApp, aur Instagram ke access toggle karein.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-cyan-950 bg-[#0c1024] flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            Support: mohitgurjar988729@gmail.com
          </span>
          <button
            onClick={() => {
              soundEffects.play('confirm');
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
