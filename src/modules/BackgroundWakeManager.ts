import { speechManager } from './SpeechManager';
import { soundEffects } from './SoundEffects';
import { voiceMatchManager, VerificationResult } from './VoiceMatchManager';
import { VoiceMatchProfile } from '../types/jarvis';

export interface BackgroundWakeState {
  isWakeLockActive: boolean;
  isBackgroundListening: boolean;
  isStandbyActive: boolean;
  voiceMatchEnabled: boolean;
  wakeWord: string;
  lastWakeEvent?: {
    transcript: string;
    remainingCommand: string;
    timestamp: number;
    verified: boolean;
    speaker: string;
    score: number;
    reason: string;
  };
}

type BackgroundStateListener = (state: BackgroundWakeState) => void;

class BackgroundWakeManager {
  private wakeLockSentinel: any = null;
  private isBackgroundListening: boolean = false;
  private isStandbyActive: boolean = false;
  private keepAliveAudioCtx: AudioContext | null = null;
  private keepAliveInterval: number | null = null;
  private listeners: Set<BackgroundStateListener> = new Set();

  private wakeWord: string = 'Hey Jarvis';
  private userName: string = 'Mohit';
  private voiceMatchEnabled: boolean = false;
  private voiceMatchProfile: VoiceMatchProfile | null = null;

  private onWakeCallback: ((command: string, verification: VerificationResult) => void) | null = null;
  private onCommandDetectedCallback: ((text: string) => void) | null = null;
  private lastWakeEvent?: BackgroundWakeState['lastWakeEvent'];

  constructor() {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', async () => {
        if (document.visibilityState === 'visible' && this.isWakeLockActive()) {
          // Re-acquire screen wake lock if tab is refocused
          await this.requestWakeLock();
        }
      });
    }
  }

  public configure(options: {
    wakeWord?: string;
    userName?: string;
    voiceMatchEnabled?: boolean;
    voiceMatchProfile?: VoiceMatchProfile | null;
  }) {
    if (options.wakeWord !== undefined) this.wakeWord = options.wakeWord;
    if (options.userName !== undefined) this.userName = options.userName;
    if (options.voiceMatchEnabled !== undefined) this.voiceMatchEnabled = options.voiceMatchEnabled;
    if (options.voiceMatchProfile !== undefined) this.voiceMatchProfile = options.voiceMatchProfile;
    this.notify();
  }

  public subscribe(cb: BackgroundStateListener): () => void {
    this.listeners.add(cb);
    cb(this.getState());
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify() {
    const s = this.getState();
    this.listeners.forEach((l) => l(s));
  }

  public getState(): BackgroundWakeState {
    return {
      isWakeLockActive: !!this.wakeLockSentinel,
      isBackgroundListening: this.isBackgroundListening,
      isStandbyActive: this.isStandbyActive,
      voiceMatchEnabled: this.voiceMatchEnabled,
      wakeWord: this.wakeWord,
      lastWakeEvent: this.lastWakeEvent,
    };
  }

  public isWakeLockActive(): boolean {
    return !!this.wakeLockSentinel;
  }

  public async requestWakeLock(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      try {
        this.wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
        this.wakeLockSentinel.addEventListener('release', () => {
          this.wakeLockSentinel = null;
          this.notify();
        });
        this.startKeepAliveAudio();
        this.notify();
        return true;
      } catch (err) {
        console.warn('Screen WakeLock error:', err);
        return false;
      }
    }
    return false;
  }

  public releaseWakeLock() {
    if (this.wakeLockSentinel) {
      try {
        this.wakeLockSentinel.release();
      } catch {
        // Safe catch
      }
      this.wakeLockSentinel = null;
    }
    this.stopKeepAliveAudio();
    this.notify();
  }

  public toggleWakeLock(): Promise<boolean> {
    if (this.wakeLockSentinel) {
      this.releaseWakeLock();
      return Promise.resolve(false);
    }
    return this.requestWakeLock();
  }

  public setStandbyActive(active: boolean) {
    this.isStandbyActive = active;
    if (active) {
      this.requestWakeLock();
      this.startBackgroundListening();
    }
    this.notify();
  }

  public setOnWakeCallback(cb: (command: string, verification: VerificationResult) => void) {
    this.onWakeCallback = cb;
  }

  public startBackgroundListening(onCommand?: (text: string) => void) {
    if (onCommand) {
      this.onCommandDetectedCallback = onCommand;
    }
    this.isBackgroundListening = true;
    this.startKeepAliveAudio();
    voiceMatchManager.startLiveAcousticMonitor();
    this.runContinuousListeningLoop();
    this.notify();
  }

  public stopBackgroundListening() {
    this.isBackgroundListening = false;
    speechManager.stopListening();
    voiceMatchManager.stopLiveAcousticMonitor();
    this.notify();
  }

  private runContinuousListeningLoop() {
    if (!this.isBackgroundListening) return;

    if (!speechManager.isListening()) {
      speechManager.startListening({
        onResult: (transcript, isFinal) => {
          const trimmed = transcript.trim();
          if (!trimmed) return;

          // Check wake word detection
          const wakeResult = voiceMatchManager.detectWakeWord(trimmed, this.wakeWord);

          if (wakeResult.isWake) {
            // Check voice biometric match if Voice Match Lock is enabled
            const verification = voiceMatchManager.verifySpeaker(this.voiceMatchProfile);

            if (this.voiceMatchEnabled && this.voiceMatchProfile?.enrolled && !verification.verified) {
              console.warn(
                `[JARVIS Wakeup] Voice Match Lock active: Wake rejected because speaker frequency does not match ${this.userName}. (${verification.reason})`
              );
              this.lastWakeEvent = {
                transcript: trimmed,
                remainingCommand: wakeResult.remainingCommand,
                timestamp: Date.now(),
                verified: false,
                speaker: 'Unknown Voice (Mismatch)',
                score: verification.score,
                reason: verification.reason,
              };
              this.notify();
              return; // Reject unauthorized speaker!
            }

            // Verification passed or general wake
            soundEffects.play('activate');
            this.lastWakeEvent = {
              transcript: trimmed,
              remainingCommand: wakeResult.remainingCommand,
              timestamp: Date.now(),
              verified: true,
              speaker: this.userName,
              score: verification.score,
              reason: verification.reason,
            };
            this.notify();

            // Trigger wake callback
            if (this.onWakeCallback) {
              this.onWakeCallback(wakeResult.remainingCommand, verification);
            } else if (this.onCommandDetectedCallback) {
              this.onCommandDetectedCallback(wakeResult.remainingCommand || trimmed);
            }
          } else if (isFinal && this.isStandbyActive && this.onCommandDetectedCallback) {
            // In standby mode, also allow raw direct commands
            soundEffects.play('confirm');
            this.onCommandDetectedCallback(trimmed);
          }
        },
        onStateChange: (listening) => {
          if (!listening && this.isBackgroundListening) {
            setTimeout(() => {
              if (this.isBackgroundListening) {
                this.runContinuousListeningLoop();
              }
            }, 500);
          }
        },
        onError: () => {
          if (this.isBackgroundListening) {
            setTimeout(() => {
              if (this.isBackgroundListening) {
                this.runContinuousListeningLoop();
              }
            }, 1000);
          }
        },
      });
    }
  }

  // Audio Keep-Alive: Plays an imperceptible silent tick every 15s to prevent mobile browser audio engine suspension
  private startKeepAliveAudio() {
    if (typeof window === 'undefined') return;
    if (!this.keepAliveAudioCtx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.keepAliveAudioCtx = new AudioCtx();
      }
    }

    if (!this.keepAliveInterval && this.keepAliveAudioCtx) {
      this.keepAliveInterval = window.setInterval(() => {
        if (!this.keepAliveAudioCtx) return;
        try {
          if (this.keepAliveAudioCtx.state === 'suspended') {
            this.keepAliveAudioCtx.resume();
          }
          const osc = this.keepAliveAudioCtx.createOscillator();
          const gain = this.keepAliveAudioCtx.createGain();
          gain.gain.value = 0.00001; // Inaudible
          osc.connect(gain);
          gain.connect(this.keepAliveAudioCtx.destination);
          osc.start();
          osc.stop(this.keepAliveAudioCtx.currentTime + 0.05);
        } catch {
          // ignore
        }
      }, 15000);
    }
  }

  private stopKeepAliveAudio() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
  }
}

export const backgroundWakeManager = new BackgroundWakeManager();
