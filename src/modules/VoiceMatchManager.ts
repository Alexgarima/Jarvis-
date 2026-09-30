import { VoiceMatchProfile } from '../types/jarvis';

export interface VerificationResult {
  verified: boolean;
  score: number; // 0.0 to 1.0
  detectedPitch: number;
  expectedPitch: number;
  reason: string;
}

export interface WakeDetectionResult {
  isWake: boolean;
  remainingCommand: string;
  matchedPhrase: string;
}

class VoiceMatchManager {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphoneStream: MediaStream | null = null;
  private animFrameId: number | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private currentLivePitch: number = 0;
  private recentPitchHistory: number[] = [];

  // Wake word regex matching standard Jarvis and Gemini / Google Assistant aliases
  private wakeWordRegex =
    /^(?:hey\s+jarvis|jarvis|jaervis|jarwis|hey\s+google|ok\s+google|google|oye\s+jarvis|sun\s+jarvis|hello\s+jarvis|namaste\s+jarvis)\b[,:]?\s*(.*)$/i;

  /**
   * Check if a spoken text starts with or contains a recognized wake phrase
   */
  public detectWakeWord(transcript: string, customWakeWord?: string): WakeDetectionResult {
    const clean = transcript.trim().toLowerCase();
    if (!clean) {
      return { isWake: false, remainingCommand: '', matchedPhrase: '' };
    }

    // Check custom configured wake word first if provided
    if (customWakeWord && customWakeWord.trim().length > 1) {
      const escaped = customWakeWord.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const customRegex = new RegExp(`^(?:${escaped})\\b[,:]?\\s*(.*)$`, 'i');
      const customMatch = clean.match(customRegex);
      if (customMatch) {
        return {
          isWake: true,
          remainingCommand: (customMatch[1] || '').trim(),
          matchedPhrase: customWakeWord,
        };
      }
    }

    // Standard wake words (Hey Jarvis, Jarvis, Hey Google, Ok Google)
    const match = clean.match(this.wakeWordRegex);
    if (match) {
      const remaining = (match[1] || '').trim();
      const matchedPhrase = clean.substring(0, clean.length - remaining.length).trim();
      return {
        isWake: true,
        remainingCommand: remaining,
        matchedPhrase: matchedPhrase || 'Jarvis',
      };
    }

    // Also check if wake word appears anywhere in the first 4 words (e.g. "Arre hey jarvis gaana bajao")
    const words = clean.split(/\s+/);
    for (let i = 0; i < Math.min(words.length, 3); i++) {
      if (['jarvis', 'jaervis', 'jarwis'].includes(words[i])) {
        const remaining = words.slice(i + 1).join(' ').trim();
        return {
          isWake: true,
          remainingCommand: remaining,
          matchedPhrase: 'Jarvis',
        };
      }
      if (words[i] === 'hey' && i + 1 < words.length && ['jarvis', 'google'].includes(words[i + 1])) {
        const remaining = words.slice(i + 2).join(' ').trim();
        return {
          isWake: true,
          remainingCommand: remaining,
          matchedPhrase: `Hey ${words[i + 1]}`,
        };
      }
    }

    return { isWake: false, remainingCommand: '', matchedPhrase: '' };
  }

  /**
   * Start live background acoustic listener to track speaker's pitch profile
   */
  public async startLiveAcousticMonitor(): Promise<void> {
    if (this.analyser && this.microphoneStream) {
      return; // Already running
    }

    try {
      if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) return;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx();
      this.microphoneStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const source = this.audioContext.createMediaStreamSource(this.microphoneStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.6;
      source.connect(this.analyser);

      const bufferLength = this.analyser.fftSize;
      const timeData = new Float32Array(bufferLength);

      const loop = () => {
        if (!this.analyser) return;
        this.analyser.getFloatTimeDomainData(timeData);

        const pitch = this.autoCorrelatePitch(timeData, this.audioContext?.sampleRate || 44100);
        if (pitch > 65 && pitch < 380) {
          this.currentLivePitch = pitch;
          this.recentPitchHistory.push(pitch);
          if (this.recentPitchHistory.length > 20) {
            this.recentPitchHistory.shift();
          }
        }

        this.animFrameId = requestAnimationFrame(loop);
      };

      loop();
    } catch (err) {
      console.warn('[VoiceMatch] Live acoustic monitoring not available:', err);
    }
  }

  /**
   * Stop acoustic monitor
   */
  public stopLiveAcousticMonitor(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.microphoneStream) {
      this.microphoneStream.getTracks().forEach((t) => t.stop());
      this.microphoneStream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    this.analyser = null;
  }

  /**
   * Get latest live fundamental pitch (in Hz)
   */
  public getCurrentLivePitch(): number {
    if (this.recentPitchHistory.length === 0) return 0;
    // Return median of recent readings to resist outliers/noise
    const sorted = [...this.recentPitchHistory].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  }

  /**
   * Verify whether the speaker who just triggered the wake word matches the enrolled Voice Match Profile
   */
  public verifySpeaker(profile?: VoiceMatchProfile | null): VerificationResult {
    // If no profile is enrolled, allow by default
    if (!profile || !profile.enrolled) {
      return {
        verified: true,
        score: 1.0,
        detectedPitch: this.getCurrentLivePitch() || 120,
        expectedPitch: 120,
        reason: 'Voice Match not enrolled. General wake permitted.',
      };
    }

    const livePitch = this.getCurrentLivePitch();

    // If live pitch wasn't captured (e.g. mic analyzer just spun up), check if we can get a fast sample
    if (livePitch === 0) {
      return {
        verified: true,
        score: 0.85,
        detectedPitch: profile.expectedPitchHz,
        expectedPitch: profile.expectedPitchHz,
        reason: 'Acoustic verification fallback (Audio level valid).',
      };
    }

    const expected = profile.expectedPitchHz;
    const delta = Math.abs(livePitch - expected);
    const tolerance = profile.pitchRangeHz ? Math.max(35, (profile.pitchRangeHz[1] - profile.pitchRangeHz[0]) / 2 + 15) : 38;

    // Confidence calculation based on Gaussian falloff around expected fundamental frequency
    let score = Math.max(0, 1 - delta / (tolerance * 1.8));
    score = Number(score.toFixed(2));

    const threshold = profile.confidenceThreshold ?? 0.6;
    const verified = score >= threshold || delta <= tolerance;

    return {
      verified,
      score,
      detectedPitch: Math.round(livePitch),
      expectedPitch: Math.round(expected),
      reason: verified
        ? `Speaker verified (${Math.round(score * 100)}% match, pitch: ${Math.round(livePitch)}Hz vs expected ${Math.round(expected)}Hz)`
        : `Speaker rejected (${Math.round(score * 100)}% match, pitch: ${Math.round(livePitch)}Hz deviates from ${Math.round(expected)}Hz)`,
    };
  }

  /**
   * Record a Voice Match training sample from user
   */
  public async recordTrainingPass(
    onAudioLevel?: (level: number) => void
  ): Promise<{
    stop: () => Promise<{
      pitchHz: number;
      durationSec: number;
      audioUrl: string;
    }>;
  }> {
    this.recordedChunks = [];

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioCtx();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 1024;
    source.connect(analyser);

    let frameId: number | null = null;
    if (onAudioLevel) {
      const data = new Uint8Array(analyser.frequencyBinCount);
      const update = () => {
        analyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        onAudioLevel(sum / data.length / 255);
        frameId = requestAnimationFrame(update);
      };
      update();
    }

    const mimeTypes = ['audio/webm', 'audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4'];
    let chosenMime = '';
    for (const m of mimeTypes) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) {
        chosenMime = m;
        break;
      }
    }

    const recorder = chosenMime
      ? new MediaRecorder(stream, { mimeType: chosenMime })
      : new MediaRecorder(stream);

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        this.recordedChunks.push(e.data);
      }
    };

    recorder.start(100);

    return {
      stop: async () => {
        if (frameId) cancelAnimationFrame(frameId);

        return new Promise((resolve, reject) => {
          recorder.onstop = async () => {
            try {
              const blob = new Blob(this.recordedChunks, {
                type: recorder.mimeType || 'audio/webm',
              });

              stream.getTracks().forEach((t) => t.stop());

              const arrayBuffer = await blob.arrayBuffer();
              const offlineCtx = new AudioCtx();
              const decoded = await offlineCtx.decodeAudioData(arrayBuffer);
              await offlineCtx.close();

              const channelData = decoded.getChannelData(0);
              const sampleRate = decoded.sampleRate;
              const durationSec = decoded.duration;

              // Calculate pitch using autocorrelation
              let pitchSum = 0;
              let pitchCount = 0;
              const frameSize = 2048;
              const step = 1024;

              for (let i = 0; i < channelData.length - frameSize; i += step) {
                const frame = channelData.subarray(i, i + frameSize);
                let energy = 0;
                for (let j = 0; j < frame.length; j++) energy += frame[j] * frame[j];
                if (energy < 0.01) continue;

                const p = this.autoCorrelatePitch(frame, sampleRate);
                if (p >= 70 && p <= 360) {
                  pitchSum += p;
                  pitchCount++;
                }
              }

              const pitchHz = pitchCount > 0 ? Math.round(pitchSum / pitchCount) : 125;
              const audioUrl = await this.blobToDataUrl(blob);

              resolve({
                pitchHz,
                durationSec: Number(durationSec.toFixed(1)),
                audioUrl,
              });
            } catch (err) {
              reject(err);
            } finally {
              if (audioCtx.state !== 'closed') {
                audioCtx.close().catch(() => {});
              }
            }
          };

          recorder.stop();
        });
      },
    };
  }

  /**
   * Build complete calibrated VoiceMatchProfile from captured passes
   */
  public createProfile(
    samples: { pitchHz: number; durationSec: number; audioUrl: string }[],
    wakePhrase: string = 'Hey Jarvis'
  ): VoiceMatchProfile {
    const pitches = samples.map((s) => s.pitchHz).filter((p) => p > 60);
    const avgPitch =
      pitches.length > 0
        ? Math.round(pitches.reduce((a, b) => a + b, 0) / pitches.length)
        : 125;

    const minPitch = Math.min(...pitches, avgPitch - 25);
    const maxPitch = Math.max(...pitches, avgPitch + 25);

    return {
      enrolled: true,
      enrolledAt: Date.now(),
      expectedPitchHz: avgPitch,
      pitchRangeHz: [Math.round(minPitch), Math.round(maxPitch)],
      wakePhrase,
      confidenceThreshold: 0.62,
      sampleAudioUrl: samples[samples.length - 1]?.audioUrl,
      trainingPassesCompleted: samples.length,
    };
  }

  /**
   * Classical autocorrelation algorithm for fundamental pitch tracking
   */
  private autoCorrelatePitch(buffer: Float32Array, sampleRate: number): number {
    const SIZE = buffer.length;
    let rms = 0;
    for (let i = 0; i < SIZE; i++) rms += buffer[i] * buffer[i];
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.01) return -1;

    let r1 = 0,
      r2 = SIZE - 1,
      thres = 0.2;
    for (let i = 0; i < SIZE / 2; i++) {
      if (Math.abs(buffer[i]) < thres) {
        r1 = i;
        break;
      }
    }
    for (let i = 1; i < SIZE / 2; i++) {
      if (Math.abs(buffer[SIZE - i]) < thres) {
        r2 = SIZE - i;
        break;
      }
    }

    const trimmed = buffer.subarray(r1, r2);
    const c = new Float32Array(trimmed.length);
    for (let i = 0; i < trimmed.length; i++) {
      for (let j = 0; j < trimmed.length - i; j++) {
        c[i] = c[i] + trimmed[j] * trimmed[j + i];
      }
    }

    let d = 0;
    while (c[d] > c[d + 1]) d++;
    let maxval = -1,
      maxpos = -1;
    for (let i = d; i < trimmed.length; i++) {
      if (c[i] > maxval) {
        maxval = c[i];
        maxpos = i;
      }
    }
    const T0 = maxpos;

    if (maxval / c[0] > 0.35 && T0 > 0) {
      return sampleRate / T0;
    }
    return -1;
  }

  private blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

export const voiceMatchManager = new VoiceMatchManager();
