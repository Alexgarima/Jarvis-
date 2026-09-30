import { soundEffects } from './SoundEffects';

// Cross-browser SpeechRecognition types
type SpeechRecognitionType = any;

class SpeechManager {
  private recognition: SpeechRecognitionType | null = null;
  private isListeningState: boolean = false;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphoneStream: MediaStream | null = null;
  private animationFrameId: number | null = null;
  private currentLanguage: string = 'en-IN'; // defaults to English (India) which handles Hinglish exceptionally well

  private onResultCallback: ((transcript: string, isFinal: boolean) => void) | null = null;
  private onAudioLevelCallback: ((level: number) => void) | null = null;
  private onStateChangeCallback: ((isListening: boolean) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;

  constructor() {
    this.initRecognition();
  }

  private initRecognition() {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = this.currentLanguage;

      this.recognition.onstart = () => {
        this.isListeningState = true;
        soundEffects.play('listening');
        this.onStateChangeCallback?.(true);
        this.startAudioMeter();
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const activeText = finalTranscript || interimTranscript;
        if (activeText) {
          this.onResultCallback?.(activeText, !!finalTranscript);
        }
      };

      this.recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error);
        this.onErrorCallback?.(event.error);
        this.stopListening();
      };

      this.recognition.onend = () => {
        this.isListeningState = false;
        this.onStateChangeCallback?.(false);
        this.stopAudioMeter();
      };
    }
  }

  public setLanguage(lang: 'auto' | 'hi-IN' | 'en-IN' | 'en-US') {
    this.currentLanguage = lang === 'auto' ? 'en-IN' : lang;
    if (this.recognition) {
      this.recognition.lang = this.currentLanguage;
    }
  }

  public isSupported(): boolean {
    return !!(
      typeof window !== 'undefined' &&
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
    );
  }

  public isListening(): boolean {
    return this.isListeningState;
  }

  public startListening(callbacks: {
    onResult: (transcript: string, isFinal: boolean) => void;
    onAudioLevel?: (level: number) => void;
    onStateChange?: (isListening: boolean) => void;
    onError?: (error: string) => void;
  }) {
    this.onResultCallback = callbacks.onResult;
    this.onAudioLevelCallback = callbacks.onAudioLevel || null;
    this.onStateChangeCallback = callbacks.onStateChange || null;
    this.onErrorCallback = callbacks.onError || null;

    if (!this.recognition) {
      this.initRecognition();
    }

    if (!this.recognition) {
      callbacks.onError?.('Speech recognition is not supported in this browser.');
      return;
    }

    try {
      this.recognition.start();
    } catch (e: any) {
      // If already started, stop and restart
      if (e.name === 'InvalidStateError') {
        this.stopListening();
        setTimeout(() => {
          try {
            this.recognition?.start();
          } catch {
            // Safe ignore
          }
        }, 150);
      }
    }
  }

  public stopListening() {
    if (this.recognition && this.isListeningState) {
      try {
        this.recognition.stop();
      } catch {
        // Safe catch
      }
    }
    this.isListeningState = false;
    this.onStateChangeCallback?.(false);
    this.stopAudioMeter();
  }

  private async startAudioMeter() {
    try {
      if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) return;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx();
      this.microphoneStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });

      const source = this.audioContext.createMediaStreamSource(this.microphoneStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.5;
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        if (!this.isListeningState || !this.analyser) {
          this.onAudioLevelCallback?.(0);
          return;
        }

        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const normalized = Math.min(1, average / 128); // 0 to 1

        this.onAudioLevelCallback?.(normalized);
        this.animationFrameId = requestAnimationFrame(checkVolume);
      };

      this.animationFrameId = requestAnimationFrame(checkVolume);
    } catch (err) {
      // Microphone permissions might be denied or unneeded for basic mock
      console.warn('Audio metering unavailable:', err);
    }
  }

  private stopAudioMeter() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.microphoneStream) {
      this.microphoneStream.getTracks().forEach((track) => track.stop());
      this.microphoneStream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    this.onAudioLevelCallback?.(0);
  }
}

export const speechManager = new SpeechManager();
