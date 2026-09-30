import React, { useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { authManager } from '../modules/AuthManager';
import { soundEffects } from '../modules/SoundEffects';
import { X, LogOut, CheckCircle, Shield, Sparkles, CloudCheck, AlertCircle } from 'lucide-react';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: FirebaseUser | null;
  onUserChanged: (user: FirebaseUser | null) => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChanged,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    soundEffects.play('click');
    setLoading(true);
    setErrorMsg(null);
    try {
      const user = await authManager.signInWithGoogle();
      onUserChanged(user);
      soundEffects.play('confirm');
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Sign-in popup band kar diya gaya tha. Dobara koshish karein.');
      } else {
        setErrorMsg(err.message || 'Google sign-in me problem aayi.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    soundEffects.play('click');
    setLoading(true);
    try {
      await authManager.signOut();
      onUserChanged(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Sign-out failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0b102b] border border-cyan-500/40 rounded-3xl w-full max-w-md overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.25)] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-cyan-900/40 flex items-center justify-between bg-gradient-to-r from-cyan-950/30 to-indigo-950/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-['Orbitron'] text-base font-bold text-white tracking-wide flex items-center gap-1.5">
                GMAIL & ACCOUNT
              </h2>
              <p className="text-[11px] text-cyan-300/70 font-mono">
                JARVIS Cloud Identity
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
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-rose-200 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {currentUser ? (
            /* Signed In View */
            <div className="space-y-4">
              <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-cyan-950/30 border border-cyan-800/40 shadow-inner">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Google User'}
                    className="w-14 h-14 rounded-full border-2 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.5)] object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-[0_0_12px_rgba(6,182,212,0.5)]">
                    {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-semibold text-white text-sm truncate">
                      {currentUser.displayName || 'Commander'}
                    </h3>
                    <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  </div>
                  <p className="text-xs text-slate-300 font-mono truncate">
                    {currentUser.email}
                  </p>
                  <div className="flex items-center gap-1 mt-1 text-[10px] text-emerald-400 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Firebase Cloud Connected</span>
                  </div>
                </div>
              </div>

              {/* Status details */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs font-mono">
                <div className="flex justify-between items-center text-slate-400">
                  <span>Sign-in Provider</span>
                  <span className="text-cyan-300 font-semibold flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    Google Account
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Data Protection</span>
                  <span className="text-emerald-400">Encrypted</span>
                </div>
              </div>

              {/* Sign Out Button */}
              <button
                onClick={handleSignOut}
                disabled={loading}
                className="w-full py-3 px-4 rounded-2xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/60 text-rose-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>{loading ? 'Signing out...' : 'Sign Out (Logout)'}</span>
              </button>
            </div>
          ) : (
            /* Not Signed In View */
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                <svg className="w-8 h-8" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </div>

              <div>
                <h3 className="font-bold text-white text-base">
                  Sign in with Google (Gmail)
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
                  Apne Gmail account se login karein taaki JARVIS aapki voice history aur personal settings ko secure cloud me sync rakh sake.
                </p>
              </div>

              {/* Official Google Sign-In Button */}
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm flex items-center justify-center gap-3 transition-transform hover:scale-[1.02] shadow-[0_0_20px_rgba(255,255,255,0.2)] cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{loading ? 'Connecting Google...' : 'Continue with Google / Gmail'}</span>
              </button>

              <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-cyan-400 font-mono">
                <Sparkles className="w-3.5 h-3.5" />
                <span>100% Free & Fast 1-Tap Login</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
