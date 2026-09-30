import React, { useState, useEffect } from 'react';
import { JarvisSettings, VoiceProfile, ClonedVoiceData, VoiceMatchProfile } from '../types/jarvis';
import { voiceManager } from '../modules/VoiceManager';
import { voiceCloneManager } from '../modules/VoiceCloneManager';
import { voiceMatchManager, VerificationResult } from '../modules/VoiceMatchManager';
import { soundEffects } from '../modules/SoundEffects';
import {
  X,
  Volume2,
  Sliders,
  Plus,
  Play,
  Trash2,
  User,
  ShieldCheck,
  Languages,
  Check,
  Radio,
  Mic,
  Square,
  RotateCcw,
  Sparkles,
  VolumeX,
  AudioLines,
  Flame,
  CheckCircle2,
  Zap,
  Shield,
  Fingerprint,
  Activity,
  AlertTriangle,
  PlayCircle,
  Lock,
} from 'lucide-react';

interface SettingsModalProps {
  settings: JarvisSettings;
  onUpdateSettings: (newSettings: JarvisSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'voice' | 'wakeup' | 'accessibility' | 'user'>('wakeup');
  const [showAddVoice, setShowAddVoice] = useState(false);
  const [newVoiceName, setNewVoiceName] = useState('');
  const [newVoicePitch, setNewVoicePitch] = useState(1.0);
  const [newVoiceRate, setNewVoiceRate] = useState(1.0);
  const [newVoiceType, setNewVoiceType] = useState<'custom' | 'mohit' | 'jarvis'>('custom');
  const [previewingId, setPreviewingId] = useState<string | null>(null);

  // Voice Cloning State
  const [isRecordingSample, setIsRecordingSample] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingAudioLevel, setRecordingAudioLevel] = useState(0);
  const [isPlayingOriginal, setIsPlayingOriginal] = useState(false);
  const [isTestingClonedVoice, setIsTestingClonedVoice] = useState(false);
  const [cloneError, setCloneError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Voice Match Training & Live Testing State
  const [isTrainingVoiceMatch, setIsTrainingVoiceMatch] = useState(false);
  const [trainingPass, setTrainingPass] = useState(1);
  const [trainingPassSamples, setTrainingPassSamples] = useState<
    { pitchHz: number; durationSec: number; audioUrl: string }[]
  >([]);
  const [trainingAudioLevel, setTrainingAudioLevel] = useState(0);
  const [recorderStopper, setRecorderStopper] = useState<
    (() => Promise<{ pitchHz: number; durationSec: number; audioUrl: string }>) | null
  >(null);
  const [isRecordingPass, setIsRecordingPass] = useState(false);
  const [voiceMatchTestResult, setVoiceMatchTestResult] = useState<VerificationResult | null>(null);
  const [isTestingVoiceMatchLive, setIsTestingVoiceMatchLive] = useState(false);
  const [voiceMatchError, setVoiceMatchError] = useState<string | null>(null);

  // Recording Timer
  useEffect(() => {
    let interval: any;
    if (isRecordingSample) {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecordingSample]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      voiceCloneManager.stopAudio();
    };
  }, []);

  const allVoices = voiceManager.getAllProfiles();

  const handleSelectVoice = (voiceId: string) => {
    soundEffects.play('click');
    voiceManager.setVoiceProfile(voiceId);
    onUpdateSettings({
      ...settings,
      selectedVoiceId: voiceId,
    });
  };

  const handlePreviewVoice = async (voice: VoiceProfile) => {
    setPreviewingId(voice.id);
    soundEffects.play('click');
    await voiceManager.previewVoice(voice);
    setPreviewingId(null);
  };

  const handleSaveCustomVoice = () => {
    if (!newVoiceName.trim()) return;
    const added = voiceManager.addCustomVoice({
      name: newVoiceName.trim(),
      description: 'User-configured custom synthetic voice persona',
      type: newVoiceType,
      pitch: newVoicePitch,
      rate: newVoiceRate,
      volume: 1.0,
      lang: 'en-IN',
    });

    onUpdateSettings({
      ...settings,
      selectedVoiceId: added.id,
      customVoices: [...settings.customVoices, added],
    });

    setShowAddVoice(false);
    setNewVoiceName('');
    soundEffects.play('complete');
  };

  const handleDeleteVoice = (id: string) => {
    soundEffects.play('click');
    voiceManager.deleteCustomVoice(id);
    onUpdateSettings({
      ...settings,
      selectedVoiceId:
        settings.selectedVoiceId === id ? 'jarvis-default' : settings.selectedVoiceId,
      customVoices: settings.customVoices.filter((v) => v.id !== id),
    });
  };

  // Voice Cloning Studio Handlers
  const handleStartVoiceRecording = async () => {
    try {
      setCloneError(null);
      soundEffects.play('click');
      await voiceCloneManager.startRecording((level) => {
        setRecordingAudioLevel(level);
      });
      setIsRecordingSample(true);
    } catch (err: any) {
      console.error('Recording start error:', err);
      setCloneError(err.message || 'Microphone access denied. Please grant microphone permission.');
      setIsRecordingSample(false);
    }
  };

  const handleStopAndAbsorbVoice = async () => {
    if (!isRecordingSample) return;
    try {
      soundEffects.play('confirm');
      setIsRecordingSample(false);
      setIsAnalyzing(true);

      const result = await voiceCloneManager.stopRecording();

      const newCloneData: ClonedVoiceData = {
        sampleAudioUrl: result.audioUrl,
        calibratedPitch: result.calibratedPitch,
        calibratedRate: result.calibratedRate,
        pitchHz: result.pitchHz,
        sampleDurationSec: result.durationSec,
        recordedAt: Date.now(),
        sampleText: 'Sample voice calibration sentence',
      };

      const profile = voiceCloneManager.createClonedVoiceProfile(settings.userName, newCloneData);
      voiceManager.registerClonedVoice(profile);

      onUpdateSettings({
        ...settings,
        clonedVoice: newCloneData,
        replyInUserVoiceEnabled: true,
        selectedVoiceId: profile.id,
      });

      setIsAnalyzing(false);
      soundEffects.play('complete');

      // Test speak the newly absorbed cloned voice
      await voiceManager.speak(
        `Namaste ${settings.userName}! Maine aapki awaaz ko absorb kar liya hai. Ab main aapke sabhi sawaalon ke jawab aapki hi voice me doonga!`,
        { voiceId: profile.id, pitch: profile.pitch, rate: profile.rate }
      );
    } catch (err: any) {
      console.error('Voice absorption failed:', err);
      setCloneError(err.message || 'Voice absorption failed. Please try again.');
      setIsAnalyzing(false);
    }
  };

  const handleToggleCloneMode = (enable: boolean) => {
    soundEffects.play('click');
    if (enable) {
      if (settings.clonedVoice) {
        onUpdateSettings({
          ...settings,
          replyInUserVoiceEnabled: true,
          selectedVoiceId: 'cloned-user-voice',
        });
        voiceManager.speak(`Awaaz Clone Mode enabled, ${settings.userName}. Ab se har jawab aapki voice me aayega.`, {
          voiceId: 'cloned-user-voice',
        });
      } else {
        setCloneError('Pehle niche di gayi sentence bol kar apni awaaz ka sample record karein.');
      }
    } else {
      onUpdateSettings({
        ...settings,
        replyInUserVoiceEnabled: false,
        selectedVoiceId: 'jarvis-default',
      });
      voiceManager.speak(`Switched back to standard JARVIS voice persona, Sir.`, {
        voiceId: 'jarvis-default',
      });
    }
  };

  const handlePlayOriginalSample = () => {
    if (!settings.clonedVoice?.sampleAudioUrl) return;
    soundEffects.play('click');
    setIsPlayingOriginal(true);
    voiceCloneManager.playAudio(settings.clonedVoice.sampleAudioUrl, () => {
      setIsPlayingOriginal(false);
    });
  };

  const handleStopOriginalSample = () => {
    voiceCloneManager.stopAudio();
    setIsPlayingOriginal(false);
  };

  const handleTestClonedVoice = async () => {
    soundEffects.play('click');
    setIsTestingClonedVoice(true);
    await voiceManager.speak(
      `Haan ${settings.userName}, main bilkul aapki awaaz me bol raha hoon. Aap mujhse koi bhi sawaal puchiye!`,
      {
        voiceId: 'cloned-user-voice',
        pitch: settings.clonedVoice?.calibratedPitch ?? 1.0,
        rate: settings.clonedVoice?.calibratedRate ?? 1.0,
      }
    );
    setIsTestingClonedVoice(false);
  };

  const handleUpdatePitchTweak = (newPitch: number) => {
    if (!settings.clonedVoice) return;
    const updatedClone: ClonedVoiceData = {
      ...settings.clonedVoice,
      calibratedPitch: Number(newPitch.toFixed(2)),
    };
    const updatedProfile = voiceCloneManager.createClonedVoiceProfile(settings.userName, updatedClone);
    voiceManager.registerClonedVoice(updatedProfile);
    onUpdateSettings({
      ...settings,
      clonedVoice: updatedClone,
    });
  };

  const handleUpdateRateTweak = (newRate: number) => {
    if (!settings.clonedVoice) return;
    const updatedClone: ClonedVoiceData = {
      ...settings.clonedVoice,
      calibratedRate: Number(newRate.toFixed(2)),
    };
    const updatedProfile = voiceCloneManager.createClonedVoiceProfile(settings.userName, updatedClone);
    voiceManager.registerClonedVoice(updatedProfile);
    onUpdateSettings({
      ...settings,
      clonedVoice: updatedClone,
    });
  };

  // Voice Match Handlers
  const handleStartVoiceMatchSetup = async () => {
    try {
      setVoiceMatchError(null);
      setIsTrainingVoiceMatch(true);
      setTrainingPass(1);
      setTrainingPassSamples([]);
      soundEffects.play('click');
    } catch (err: any) {
      setVoiceMatchError(err.message || 'Microphone error');
    }
  };

  const handleStartPassRecording = async () => {
    try {
      setVoiceMatchError(null);
      soundEffects.play('listening');
      const recorder = await voiceMatchManager.recordTrainingPass((level) => {
        setTrainingAudioLevel(level);
      });
      setRecorderStopper(() => recorder.stop);
      setIsRecordingPass(true);
    } catch (err: any) {
      setVoiceMatchError(err.message || 'Microphone access denied. Please grant mic permission.');
      setIsRecordingPass(false);
    }
  };

  const handleFinishPassRecording = async () => {
    if (!recorderStopper) return;
    try {
      soundEffects.play('confirm');
      setIsRecordingPass(false);
      const sample = await recorderStopper();
      const updatedSamples = [...trainingPassSamples, sample];
      setTrainingPassSamples(updatedSamples);
      setRecorderStopper(null);

      if (trainingPass >= 2) {
        // Completed 2 training passes
        const profile = voiceMatchManager.createProfile(updatedSamples, settings.wakeWord || 'Hey Jarvis');
        onUpdateSettings({
          ...settings,
          wakeWordEnabled: true,
          voiceMatchEnabled: true,
          voiceMatchProfile: profile,
        });
        setIsTrainingVoiceMatch(false);
        soundEffects.play('complete');
        await voiceManager.speak(
          `Voice Match enrollment complete, ${settings.userName}! Ab JARVIS sirf aapki awaaz se verify hokar background me active hoga.`
        );
      } else {
        setTrainingPass((prev) => prev + 1);
        soundEffects.play('click');
      }
    } catch (err: any) {
      setVoiceMatchError(err.message || 'Pass recording failed');
      setIsRecordingPass(false);
    }
  };

  const handleTestLiveVoiceMatch = async () => {
    try {
      setVoiceMatchError(null);
      soundEffects.play('listening');
      setIsTestingVoiceMatchLive(true);
      setVoiceMatchTestResult(null);

      await voiceMatchManager.startLiveAcousticMonitor();

      setTimeout(() => {
        const result = voiceMatchManager.verifySpeaker(settings.voiceMatchProfile);
        setVoiceMatchTestResult(result);
        setIsTestingVoiceMatchLive(false);

        if (result.verified) {
          soundEffects.play('activate');
        } else {
          soundEffects.play('warning');
        }
      }, 3500);
    } catch (err: any) {
      setVoiceMatchError(err.message || 'Live test failed');
      setIsTestingVoiceMatchLive(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-mono select-none">
      <div className="w-full max-w-2xl bg-slate-950 border border-cyan-800/80 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-cyan-900/60 bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-cyan-400/60 shadow-[0_0_10px_rgba(6,182,212,0.4)]">
              <img
                src="/jarvis-logo.jpg"
                alt="JARVIS Logo"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <span className="font-['Orbitron'] font-bold text-base tracking-wider text-white block">
                JARVIS CONTROL MATRIX
              </span>
              <span className="text-[10px] text-cyan-400 font-mono block">Personal AI Subsystem Settings</span>
            </div>
          </div>
          <button
            onClick={() => {
              soundEffects.play('click');
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-cyan-950 bg-slate-950/80 px-6 pt-2 gap-2 text-xs overflow-x-auto">
          <button
            onClick={() => {
              soundEffects.play('click');
              setActiveTab('wakeup');
            }}
            className={`pb-2.5 px-3 font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'wakeup'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Background Wakeup & Voice Match</span>
            {settings.wakeWordEnabled && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            )}
          </button>
          <button
            onClick={() => {
              soundEffects.play('click');
              setActiveTab('voice');
            }}
            className={`pb-2.5 px-3 font-semibold transition-all border-b-2 cursor-pointer shrink-0 ${
              activeTab === 'voice'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Voice Synthesizer & Clone
          </button>
          <button
            onClick={() => {
              soundEffects.play('click');
              setActiveTab('accessibility');
            }}
            className={`pb-2.5 px-3 font-semibold transition-all border-b-2 cursor-pointer shrink-0 ${
              activeTab === 'accessibility'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Accessibility & Automation
          </button>
          <button
            onClick={() => {
              soundEffects.play('click');
              setActiveTab('user');
            }}
            className={`pb-2.5 px-3 font-semibold transition-all border-b-2 cursor-pointer shrink-0 ${
              activeTab === 'user'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            User Persona & Device
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {activeTab === 'voice' && (
            <div className="space-y-6">
              {/* Voice Cloning Studio Section (Apni Voice Me Jawab Sunein) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-cyan-950/50 via-slate-900/90 to-indigo-950/40 border border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.15)] relative overflow-hidden">
                {/* Background glow effect */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

                {/* Header with Switch */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cyan-900/50">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shrink-0">
                      <Sparkles className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-['Orbitron'] font-bold text-sm tracking-wide text-white">
                          Awaaz Clone Mode (Voice Mirror)
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-400/60 text-cyan-300 uppercase">
                          Neural Voice Absorption
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        Apni awaaz me bolein—JARVIS use absorb karke aapke har sawaal ka jawab <strong className="text-cyan-300">aapki hi voice</strong> me dega.
                      </p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                    <span className="text-[11px] font-semibold text-slate-300">
                      {settings.replyInUserVoiceEnabled ? (
                        <span className="text-cyan-300 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                          Reply in My Voice: ON
                        </span>
                      ) : (
                        <span className="text-slate-400">Reply in My Voice: OFF</span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleCloneMode(!settings.replyInUserVoiceEnabled)}
                      className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                        settings.replyInUserVoiceEnabled ? 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'bg-slate-800 border border-slate-700'
                      }`}
                      aria-label="Toggle Reply in User Voice"
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          settings.replyInUserVoiceEnabled ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Error Banner */}
                {cloneError && (
                  <div className="mt-3 p-2.5 rounded-lg bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-center justify-between">
                    <span>{cloneError}</span>
                    <button
                      onClick={() => setCloneError(null)}
                      className="text-rose-400 hover:text-white ml-2 text-xs font-bold"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {/* Body: State 1 - Analyzing */}
                {isAnalyzing ? (
                  <div className="py-6 flex flex-col items-center justify-center space-y-2">
                    <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-cyan-300 font-mono">
                      Awaaz absorb aur analyze ho rahi hai... (Extracting pitch & frequency spectrum)
                    </p>
                  </div>
                ) : isRecordingSample ? (
                  /* Body: State 2 - Recording in Progress */
                  <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-rose-500/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                        <span className="text-xs font-bold text-rose-300 font-mono tracking-wider">
                          RECORDING SAMPLE... 00:0{recordingSeconds}s
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">Mic active</span>
                    </div>

                    {/* Sentence to speak */}
                    <div className="p-3 rounded-lg bg-slate-900 border border-cyan-900/60 text-center">
                      <p className="text-xs text-white font-medium italic">
                        "JARVIS, meri awaaz ko absorb karo aur mere sabhi sawaalon ke jawab meri hi voice me do."
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        (Ya boliye: "Hello JARVIS, calibrate my voice frequencies to answer in my voice.")
                      </p>
                    </div>

                    {/* Live Waveform Indicator */}
                    <div className="flex items-center justify-center gap-1.5 h-10 py-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => {
                        const height = Math.max(
                          15,
                          Math.min(100, Math.sin(i * 0.5 + recordingSeconds) * 40 + recordingAudioLevel * 120 + 30)
                        );
                        return (
                          <div
                            key={i}
                            className="w-1.5 rounded-full bg-gradient-to-t from-cyan-500 to-sky-300 transition-all duration-75"
                            style={{ height: `${height}%` }}
                          />
                        );
                      })}
                    </div>

                    {/* Stop & Absorb Button */}
                    <button
                      onClick={handleStopAndAbsorbVoice}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-transform hover:scale-[1.01]"
                    >
                      <Square className="w-4 h-4 fill-white" />
                      <span>Stop & Absorb Voice (Awaaz Absorb Karein)</span>
                    </button>
                  </div>
                ) : settings.clonedVoice ? (
                  /* Body: State 3 - Cloned Voice Ready */
                  <div className="mt-4 space-y-3">
                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        <div>
                          <span className="text-xs font-bold text-emerald-300 font-mono block">
                            Awaaz Profile Calibrated & Active
                          </span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            Base Pitch: {settings.clonedVoice.pitchHz || 125} Hz · Modulation: {settings.clonedVoice.calibratedPitch}x · Speed: {settings.clonedVoice.calibratedRate}x
                          </span>
                        </div>
                      </div>

                      {/* Quick Play & Test Actions */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Play Original Sample */}
                        <button
                          onClick={isPlayingOriginal ? handleStopOriginalSample : handlePlayOriginalSample}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-colors cursor-pointer border border-slate-700"
                          title="Aapne jo voice record ki thi use sunein"
                        >
                          {isPlayingOriginal ? (
                            <>
                              <VolumeX className="w-3.5 h-3.5 text-amber-400" />
                              <span>Stop Audio</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
                              <span>Original Audio Suno</span>
                            </>
                          )}
                        </button>

                        {/* Test Cloned Output Voice */}
                        <button
                          onClick={handleTestClonedVoice}
                          disabled={isTestingClonedVoice}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-mono transition-all cursor-pointer shadow-sm"
                          title="JARVIS aapki voice me bolkar dikhayega"
                        >
                          <Mic className="w-3.5 h-3.5" />
                          <span>{isTestingClonedVoice ? 'Testing Voice...' : 'Cloned Voice Me Jawab Suno'}</span>
                        </button>

                        {/* Re-record Button */}
                        <button
                          onClick={handleStartVoiceRecording}
                          className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs transition-colors cursor-pointer border border-slate-800"
                          title="Dobara apni voice record karein"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Re-record</span>
                        </button>
                      </div>
                    </div>

                    {/* Fine-Tuning Pitch & Speed Sliders */}
                    <div className="p-3 rounded-xl bg-slate-950/50 border border-cyan-950 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                          <span>Awaaz Pitch (Heavy / Sharp):</span>
                          <span className="text-cyan-300 font-mono font-bold">
                            {settings.clonedVoice.calibratedPitch}x
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.6"
                          max="1.5"
                          step="0.02"
                          value={settings.clonedVoice.calibratedPitch}
                          onChange={(e) => handleUpdatePitchTweak(parseFloat(e.target.value))}
                          className="w-full accent-cyan-400 cursor-pointer"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                          <span>Bolne Ki Speed (Rate):</span>
                          <span className="text-cyan-300 font-mono font-bold">
                            {settings.clonedVoice.calibratedRate}x
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.7"
                          max="1.4"
                          step="0.02"
                          value={settings.clonedVoice.calibratedRate}
                          onChange={(e) => handleUpdateRateTweak(parseFloat(e.target.value))}
                          className="w-full accent-cyan-400 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Body: State 4 - No voice sample recorded yet */
                  <div className="mt-4 p-4 rounded-xl bg-slate-950/60 border border-dashed border-cyan-800/60 space-y-3">
                    <div>
                      <span className="text-xs font-bold text-cyan-300 block mb-1">
                        Step 1: Apni Awaaz Ka 5-Second Sample Record Karein
                      </span>
                      <p className="text-[11px] text-slate-400">
                        Niche diye gaye button par click karke ye sentence mic me boliye taaki JARVIS aapki voice frequency ko capture aur absorb kar sake:
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-900/60 text-slate-200 text-xs italic">
                      "JARVIS, meri awaaz ko absorb karo aur mere sabhi sawaalon ke jawab meri hi awaaz me do."
                    </div>

                    <button
                      onClick={handleStartVoiceRecording}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.3)] cursor-pointer transition-all hover:scale-[1.01]"
                    >
                      <Mic className="w-4 h-4" />
                      <span>Start Voice Recording (Apni Awaaz Record Karein)</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Voice Profiles List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                      Voice Persona Catalog
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Modular neural voice engine powered by VoiceManager class
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      soundEffects.play('click');
                      setShowAddVoice(!showAddVoice);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950 border border-cyan-700/60 text-cyan-300 hover:bg-cyan-900 transition-colors cursor-pointer text-xs font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Custom Voice</span>
                  </button>
                </div>

                {/* Add Custom Voice Drawer */}
                {showAddVoice && (
                  <div className="mb-4 p-4 rounded-xl bg-slate-900 border border-cyan-800/60 space-y-3">
                    <span className="font-bold text-cyan-300 text-xs uppercase block">
                      Create New Custom Voice Persona
                    </span>
                    <div className="space-y-1">
                      <label className="text-slate-400 text-[11px]">Voice Persona Name:</label>
                      <input
                        type="text"
                        placeholder="e.g. Mohit Alternate, Friday Tactical"
                        value={newVoiceName}
                        onChange={(e) => setNewVoiceName(e.target.value)}
                        className="w-full bg-slate-950 border border-cyan-900 rounded p-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                          <span>Pitch Modulation:</span>
                          <span className="text-cyan-300">{newVoicePitch}x</span>
                        </div>
                        <input
                          type="range"
                          min="0.5"
                          max="1.5"
                          step="0.05"
                          value={newVoicePitch}
                          onChange={(e) => setNewVoicePitch(parseFloat(e.target.value))}
                          className="w-full accent-cyan-400"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                          <span>Speed / Rate:</span>
                          <span className="text-cyan-300">{newVoiceRate}x</span>
                        </div>
                        <input
                          type="range"
                          min="0.6"
                          max="1.6"
                          step="0.05"
                          value={newVoiceRate}
                          onChange={(e) => setNewVoiceRate(parseFloat(e.target.value))}
                          className="w-full accent-cyan-400"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => setShowAddVoice(false)}
                        className="px-3 py-1.5 rounded text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveCustomVoice}
                        className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                      >
                        Save Voice Profile
                      </button>
                    </div>
                  </div>
                )}

                {/* Profiles Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {allVoices.map((voice) => {
                    const isSelected = settings.selectedVoiceId === voice.id;
                    const isPreviewing = previewingId === voice.id;

                    return (
                      <div
                        key={voice.id}
                        onClick={() => handleSelectVoice(voice.id)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-cyan-950/80 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
                            : 'bg-slate-900/70 border-slate-800 hover:border-cyan-900/60'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-100 flex items-center gap-1.5">
                              {voice.name}
                              {voice.id === 'mohit-voice' && (
                                <span className="text-[9px] bg-emerald-950 border border-emerald-700 text-emerald-400 px-1 rounded">
                                  USER VOICE
                                </span>
                              )}
                            </span>
                            {isSelected && (
                              <Check className="w-4 h-4 text-cyan-400" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                            {voice.description}
                          </p>
                        </div>

                        <div className="mt-3 pt-2 border-t border-cyan-950/80 flex items-center justify-between">
                          <span className="text-[10px] text-slate-500 font-mono">
                            Pitch: {voice.pitch} · Rate: {voice.rate}
                          </span>
                          <div className="flex items-center gap-1">
                            {voice.isCustom && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteVoice(voice.id);
                                }}
                                className="p-1 rounded text-slate-400 hover:text-rose-400"
                                title="Delete Custom Voice"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePreviewVoice(voice);
                              }}
                              className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-900/40 hover:bg-cyan-800 text-cyan-300 text-[10px] transition-colors"
                            >
                              <Play className="w-2.5 h-2.5 fill-current" />
                              <span>{isPreviewing ? 'Testing...' : 'Voice Preview'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Real-time Voice Modulation Sliders */}
              <div className="bg-slate-900/80 border border-cyan-900/50 rounded-xl p-4 space-y-4">
                <span className="font-bold text-slate-200 text-xs uppercase tracking-wider block">
                  Fine Tuning Controls
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Voice Speed:</span>
                      <span className="text-cyan-400 font-mono">{settings.voiceSpeed}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="1.8"
                      step="0.05"
                      value={settings.voiceSpeed}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        voiceManager.updateVoiceParameters({ rate: val });
                        onUpdateSettings({ ...settings, voiceSpeed: val });
                      }}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Pitch:</span>
                      <span className="text-cyan-400 font-mono">{settings.voicePitch}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="1.8"
                      step="0.05"
                      value={settings.voicePitch}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        voiceManager.updateVoiceParameters({ pitch: val });
                        onUpdateSettings({ ...settings, voicePitch: val });
                      }}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Volume:</span>
                      <span className="text-cyan-400 font-mono">{Math.round(settings.voiceVolume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={settings.voiceVolume}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        voiceManager.updateVoiceParameters({ volume: val });
                        onUpdateSettings({ ...settings, voiceVolume: val });
                      }}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'wakeup' && (
            <div className="space-y-6">
              {/* Card 1: Gemini-Style Background Wakeup */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-900/90 to-cyan-950/40 border border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.15)] relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-900/40">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shrink-0">
                      <Zap className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-['Orbitron'] font-bold text-sm tracking-wide text-white">
                          Background Wakeup (Always-On Trigger)
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-950 border border-amber-500/60 text-amber-300 uppercase">
                          Gemini Style
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        Gemini aur Google Assistant ki tarah background me <strong className="text-amber-300">"{settings.wakeWord || 'Hey Jarvis'}"</strong> bolte hi app turant active ho jayega.
                      </p>
                    </div>
                  </div>

                  {/* Toggle */}
                  <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                    <span className="text-[11px] font-semibold text-slate-300">
                      {settings.wakeWordEnabled ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          Wakeup: ACTIVE
                        </span>
                      ) : (
                        <span className="text-slate-400">Wakeup: OFF</span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        soundEffects.play('click');
                        onUpdateSettings({
                          ...settings,
                          wakeWordEnabled: !settings.wakeWordEnabled,
                        });
                      }}
                      className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                        settings.wakeWordEnabled
                          ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                          : 'bg-slate-800 border border-slate-700'
                      }`}
                      aria-label="Toggle Background Wakeup"
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          settings.wakeWordEnabled ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Wake Word Selection */}
                <div className="mt-4 space-y-2">
                  <span className="text-[11px] font-bold text-slate-300 block">
                    Choose Your Wake Phrase (Active Hotword):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {['Hey Jarvis', 'Jarvis', 'Hey Google', 'Ok Google'].map((phrase) => {
                      const isSelected = (settings.wakeWord || 'Hey Jarvis').toLowerCase() === phrase.toLowerCase();
                      return (
                        <button
                          key={phrase}
                          type="button"
                          onClick={() => {
                            soundEffects.play('click');
                            onUpdateSettings({ ...settings, wakeWord: phrase });
                          }}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-950/80 border-amber-400 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          "{phrase}"
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Background Keep-Alive Specs */}
                <div className="mt-4 p-3 rounded-xl bg-slate-950/70 border border-amber-900/30 text-[10px] text-slate-400 space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                    <Activity className="w-3.5 h-3.5" />
                    <span>Background Continuous Audio Daemon:</span>
                  </div>
                  <p>
                    ✓ Mobile Screen WakeLock API prevents sleep · Inaudible Web Audio oscillator keep-alive active · Supports continuous Standby mode & lockscreen wake.
                  </p>
                </div>
              </div>

              {/* Card 2: Voice Match Security (Only My Voice) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-cyan-950/50 via-slate-900/90 to-blue-950/40 border border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.15)] relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cyan-900/50">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shrink-0">
                      <Fingerprint className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-['Orbitron'] font-bold text-sm tracking-wide text-white">
                          Voice Match Lock (Only My Voice)
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-400/60 text-cyan-300 uppercase">
                          Biometric Voice Print
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        Sirf <strong className="text-cyan-300">aapki awaaz</strong> se match hone par hi JARVIS wake up hoga. Kisi aur ki awaaz me activate nahi hoga!
                      </p>
                    </div>
                  </div>

                  {/* Toggle */}
                  <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                    <span className="text-[11px] font-semibold text-slate-300">
                      {settings.voiceMatchEnabled ? (
                        <span className="text-cyan-300 flex items-center gap-1">
                          <Shield className="w-3.5 h-3.5 text-cyan-400" />
                          Voice Match: ON
                        </span>
                      ) : (
                        <span className="text-slate-400">Voice Match: OFF</span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        soundEffects.play('click');
                        if (!settings.voiceMatchEnabled && !settings.voiceMatchProfile?.enrolled) {
                          handleStartVoiceMatchSetup();
                        } else {
                          onUpdateSettings({
                            ...settings,
                            voiceMatchEnabled: !settings.voiceMatchEnabled,
                          });
                        }
                      }}
                      className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                        settings.voiceMatchEnabled
                          ? 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                          : 'bg-slate-800 border border-slate-700'
                      }`}
                      aria-label="Toggle Voice Match"
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          settings.voiceMatchEnabled ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {voiceMatchError && (
                  <div className="mt-3 p-2.5 rounded-lg bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-center justify-between">
                    <span>{voiceMatchError}</span>
                    <button
                      onClick={() => setVoiceMatchError(null)}
                      className="text-rose-400 hover:text-white ml-2 text-xs font-bold"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {/* Training Flow in progress */}
                {isTrainingVoiceMatch ? (
                  <div className="mt-4 p-4 rounded-xl bg-slate-950/90 border border-cyan-500/60 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                        <span className="font-bold text-cyan-300 font-mono text-xs">
                          VOICE MATCH TRAINING: PASS {trainingPass} OF 2
                        </span>
                      </div>
                      <button
                        onClick={() => setIsTrainingVoiceMatch(false)}
                        className="text-[10px] text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-900 border border-cyan-900/60 text-center space-y-1">
                      <p className="text-xs text-white font-medium">
                        Kripya mic ke paas saaf awaaz me bolein:
                      </p>
                      <p className="text-base text-cyan-300 font-bold font-mono tracking-wider italic">
                        "{settings.wakeWord || 'Hey Jarvis'}"
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Pass {trainingPass}: Voice frequency and fundamental pitch calibration
                      </p>
                    </div>

                    {/* Waveform / Level Meter */}
                    {isRecordingPass && (
                      <div className="flex items-center justify-center gap-1.5 h-8 py-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => {
                          const height = Math.max(
                            20,
                            Math.min(100, Math.sin(i * 0.6) * 30 + trainingAudioLevel * 140 + 30)
                          );
                          return (
                            <div
                              key={i}
                              className="w-1.5 rounded-full bg-cyan-400 transition-all duration-75"
                              style={{ height: `${height}%` }}
                            />
                          );
                        })}
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      {!isRecordingPass ? (
                        <button
                          type="button"
                          onClick={handleStartPassRecording}
                          className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all hover:scale-[1.01]"
                        >
                          <Mic className="w-4 h-4" />
                          <span>Start Speaking (Pass {trainingPass})</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleFinishPassRecording}
                          className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all hover:scale-[1.01]"
                        >
                          <Square className="w-4 h-4 fill-white" />
                          <span>Done Speaking / Next</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : settings.voiceMatchProfile?.enrolled ? (
                  /* Enrolled State */
                  <div className="mt-4 space-y-3">
                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-cyan-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        <div>
                          <span className="text-xs font-bold text-emerald-300 font-mono block">
                            Voice Print Enrolled: {settings.userName}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            Target Pitch: {settings.voiceMatchProfile.expectedPitchHz} Hz · Hotword: "{settings.voiceMatchProfile.wakePhrase}"
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Live Test Button */}
                        <button
                          type="button"
                          onClick={handleTestLiveVoiceMatch}
                          disabled={isTestingVoiceMatchLive}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-mono transition-all cursor-pointer shadow-sm"
                        >
                          <Mic className="w-3.5 h-3.5" />
                          <span>{isTestingVoiceMatchLive ? 'Listening...' : 'Test Voice Match Live'}</span>
                        </button>

                        {/* Retrain Button */}
                        <button
                          type="button"
                          onClick={handleStartVoiceMatchSetup}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs transition-colors cursor-pointer border border-slate-800"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Retrain</span>
                        </button>
                      </div>
                    </div>

                    {/* Test Result Card */}
                    {isTestingVoiceMatchLive && (
                      <div className="p-3 rounded-xl bg-slate-900/90 border border-cyan-500 animate-pulse text-center">
                        <span className="text-xs text-cyan-300 font-mono font-bold">
                          🎙️ Mic is listening... Abhi boliye: "{settings.wakeWord || 'Hey Jarvis'}"
                        </span>
                      </div>
                    )}

                    {voiceMatchTestResult && !isTestingVoiceMatchLive && (
                      <div
                        className={`p-3 rounded-xl border text-xs font-mono ${
                          voiceMatchTestResult.verified
                            ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-200'
                            : 'bg-rose-950/70 border-rose-500/60 text-rose-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold">
                            {voiceMatchTestResult.verified
                              ? '✓ VOICE MATCH VERIFIED: ACCESS GRANTED'
                              : '✗ VOICE MISMATCH: WAKE REJECTED'}
                          </span>
                          <span className="font-bold">
                            Match Score: {Math.round(voiceMatchTestResult.score * 100)}%
                          </span>
                        </div>
                        <p className="text-[11px] opacity-90">{voiceMatchTestResult.reason}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Not enrolled yet */
                  <div className="mt-4 p-4 rounded-xl bg-slate-950/60 border border-dashed border-cyan-800/60 space-y-3">
                    <div>
                      <span className="text-xs font-bold text-cyan-300 block mb-1">
                        Voice Match Setup (Sirf Aapki Awaaz Ki Pehchan)
                      </span>
                      <p className="text-[11px] text-slate-400">
                        Niche diye gaye button par click karke 2 baar "{settings.wakeWord || 'Hey Jarvis'}" bolein taaki JARVIS aapki awaaz ki frequency ko biometric lock kar sake.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleStartVoiceMatchSetup}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.3)] cursor-pointer transition-all hover:scale-[1.01]"
                    >
                      <Fingerprint className="w-4 h-4" />
                      <span>Start Voice Match Setup (Apni Awaaz Train Karein)</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'accessibility' && (
            <div className="space-y-4">
              <div className="bg-slate-900/80 border border-cyan-900/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-200">Android Accessibility Service</h3>
                    <p className="text-[11px] text-slate-400">
                      Enables deep UI screen element traversal, click injection, and auto typing
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.accessibilityServiceEnabled}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        accessibilityServiceEnabled: e.target.checked,
                      })
                    }
                    className="w-5 h-5 accent-cyan-500 cursor-pointer"
                  />
                </div>
                <div className="text-[11px] text-slate-400 bg-slate-950 p-2.5 rounded border border-slate-800">
                  <span className="text-emerald-400 font-bold block mb-1">
                    ✓ NON-ROOT COMPLIANT
                  </span>
                  JARVIS operates strictly within standard Android APIs (Intents, Deep Links, and AccessibilityNodes). No root or dangerous system partition modifications required.
                </div>
              </div>

              <div className="bg-slate-900/80 border border-cyan-900/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-200">Holographic Sound Effects</h3>
                    <p className="text-[11px] text-slate-400">
                      Web Audio synthesized HUD chimes and reactor beeps
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.soundEffects}
                    onChange={(e) => {
                      soundEffects.setEnabled(e.target.checked);
                      onUpdateSettings({ ...settings, soundEffects: e.target.checked });
                    }}
                    className="w-5 h-5 accent-cyan-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'user' && (
            <div className="space-y-4">
              <div className="bg-slate-900/80 border border-cyan-900/50 rounded-xl p-4 space-y-3">
                <span className="font-bold text-slate-200 text-xs uppercase tracking-wider block">
                  User Identification
                </span>
                <div className="space-y-1">
                  <label className="text-slate-400 text-[11px]">Address User As:</label>
                  <input
                    type="text"
                    value={settings.userName}
                    onChange={(e) => onUpdateSettings({ ...settings, userName: e.target.value })}
                    className="w-full bg-slate-950 border border-cyan-900 rounded p-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    placeholder="e.g. Mohit, Sir, Boss"
                  />
                </div>
              </div>

              <div className="bg-slate-900/80 border border-cyan-900/50 rounded-xl p-4 space-y-3">
                <span className="font-bold text-slate-200 text-xs uppercase tracking-wider block">
                  Language Processing Mode
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'en-IN', label: 'Hinglish & Indian English (Recommended)' },
                    { id: 'hi-IN', label: 'Hindi (हिंदी)' },
                    { id: 'en-US', label: 'English (US)' },
                    { id: 'auto', label: 'Automatic Detection' },
                  ].map((lang) => (
                    <button
                      key={lang.id}
                      onClick={() =>
                        onUpdateSettings({ ...settings, preferredLanguage: lang.id as any })
                      }
                      className={`p-2.5 rounded border text-left cursor-pointer transition-colors ${
                        settings.preferredLanguage === lang.id
                          ? 'bg-cyan-950 border-cyan-400 text-cyan-300 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Developer Contact, Help & Support */}
              <div className="bg-slate-900/90 border border-cyan-700/60 rounded-xl p-4 space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 text-xs uppercase tracking-wider block">
                    Contact, Help & Support
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                    DEVELOPER
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-cyan-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Developer Support Email:</span>
                    <a
                      href="mailto:mohitgurjar988729@gmail.com?subject=JARVIS%20AI%20Support"
                      className="text-xs font-bold text-cyan-300 hover:text-white font-mono break-all"
                    >
                      mohitgurjar988729@gmail.com
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText('mohitgurjar988729@gmail.com');
                        soundEffects.play('confirm');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-[11px] font-semibold text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                    >
                      Copy Email
                    </button>
                    <a
                      href="mailto:mohitgurjar988729@gmail.com?subject=JARVIS%20AI%20Support"
                      className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-[11px] font-semibold text-white transition-colors cursor-pointer"
                    >
                      Email Me
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-cyan-900/60 bg-slate-900/90 flex justify-end">
          <button
            onClick={() => {
              soundEffects.play('confirm');
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all cursor-pointer"
          >
            Apply & Synchronize
          </button>
        </div>
      </div>
    </div>
  );
};
