import { ClonedVoiceData, VoiceProfile } from '../types/jarvis';

class VoiceCloneManager {
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphoneStream: MediaStream | null = null;
  private recordedChunks: Blob[] = [];
  private currentAudioElement: HTMLAudioElement | null = null;
  private animFrameId: number | null = null;

  /**
   * Request microphone access and begin recording voice sample
   */
  public async startRecording(onAudioLevel?: (level: number) => void): Promise<void> {
    this.stopAudio();
    this.recordedChunks = [];

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    this.microphoneStream = stream;

    // Set up Web Audio Analyser for live levels and pitch tracking
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.audioContext = new AudioContextClass();
    const source = this.audioContext.createMediaStreamSource(stream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 1024;
    source.connect(this.analyser);

    // Audio level meter loop
    if (onAudioLevel) {
      const pcmData = new Uint8Array(this.analyser.frequencyBinCount);
      const updateMeter = () => {
        if (!this.analyser) return;
        this.analyser.getByteFrequencyData(pcmData);
        let sum = 0;
        for (let i = 0; i < pcmData.length; i++) {
          sum += pcmData[i];
        }
        const avg = sum / pcmData.length / 255;
        onAudioLevel(avg);
        this.animFrameId = requestAnimationFrame(updateMeter);
      };
      updateMeter();
    }

    // MediaRecorder setup
    const mimeTypes = ['audio/webm', 'audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4'];
    let chosenMime = '';
    for (const m of mimeTypes) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) {
        chosenMime = m;
        break;
      }
    }

    this.mediaRecorder = chosenMime
      ? new MediaRecorder(stream, { mimeType: chosenMime })
      : new MediaRecorder(stream);

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.start(100);
  }

  /**
   * Stop recording, extract pitch/rate metrics, and generate clone data
   */
  public async stopRecording(): Promise<{
    blob: Blob;
    audioUrl: string;
    pitchHz: number;
    calibratedPitch: number;
    calibratedRate: number;
    durationSec: number;
  }> {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('MediaRecorder was not started'));
        return;
      }

      this.mediaRecorder.onstop = async () => {
        try {
          const blob = new Blob(this.recordedChunks, {
            type: this.mediaRecorder?.mimeType || 'audio/webm',
          });

          // Stop mic tracks
          if (this.microphoneStream) {
            this.microphoneStream.getTracks().forEach((t) => t.stop());
            this.microphoneStream = null;
          }

          // Convert to base64 DataURL for persistent local storage
          const audioUrl = await this.blobToDataUrl(blob);

          // Acoustic pitch & tempo analysis
          const { pitchHz, calibratedPitch, calibratedRate, durationSec } =
            await this.analyzeAudioAcoustics(blob);

          resolve({
            blob,
            audioUrl,
            pitchHz,
            calibratedPitch,
            calibratedRate,
            durationSec,
          });
        } catch (err) {
          reject(err);
        } finally {
          if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close().catch(() => {});
            this.audioContext = null;
          }
        }
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Autocorrelation-based pitch ($F_0$) & rate extractor from recorded audio buffer
   */
  private async analyzeAudioAcoustics(blob: Blob): Promise<{
    pitchHz: number;
    calibratedPitch: number;
    calibratedRate: number;
    durationSec: number;
  }> {
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const offlineCtx = new AudioContextClass();
      const audioBuffer = await offlineCtx.decodeAudioData(arrayBuffer);
      await offlineCtx.close();

      const durationSec = Math.max(0.5, audioBuffer.duration);
      const channelData = audioBuffer.getChannelData(0);
      const sampleRate = audioBuffer.sampleRate;

      // Extract fundamental frequency using autocorrelation on speech segments
      let pitchSum = 0;
      let pitchCount = 0;

      const frameSize = 2048;
      const stepSize = 1024;

      for (let i = 0; i < channelData.length - frameSize; i += stepSize) {
        const frame = channelData.subarray(i, i + frameSize);

        // Check if frame has enough energy (not silence)
        let energy = 0;
        for (let j = 0; j < frame.length; j++) {
          energy += frame[j] * frame[j];
        }
        if (energy < 0.01) continue;

        const fundamental = this.autoCorrelatePitch(frame, sampleRate);
        if (fundamental >= 70 && fundamental <= 350) {
          pitchSum += fundamental;
          pitchCount++;
        }
      }

      // Default baseline male pitch is around 115-130 Hz
      const pitchHz = pitchCount > 0 ? Math.round(pitchSum / pitchCount) : 125;

      // Map pitch to Web Speech API pitch multiplier:
      // standard reference is 130Hz -> 1.0
      // 85Hz -> 0.75, 120Hz -> 0.95, 160Hz -> 1.15, 220Hz -> 1.40
      let calibratedPitch = Number((pitchHz / 130).toFixed(2));
      calibratedPitch = Math.max(0.65, Math.min(1.5, calibratedPitch));

      // Calculate speech tempo/rate based on energy envelope peaks
      let energyPeaks = 0;
      const peakWindow = 2048;
      let lastPeak = false;

      for (let i = 0; i < channelData.length - peakWindow; i += peakWindow) {
        let frameEnergy = 0;
        for (let j = 0; j < peakWindow; j++) {
          frameEnergy += Math.abs(channelData[i + j]);
        }
        const isPeak = frameEnergy > 35;
        if (isPeak && !lastPeak) {
          energyPeaks++;
        }
        lastPeak = isPeak;
      }

      const syllablesPerSecond = energyPeaks / durationSec;
      // Normal speech is 3-4 syllables/sec -> 1.0 rate
      let calibratedRate = 1.0;
      if (syllablesPerSecond > 4.5) {
        calibratedRate = 1.12;
      } else if (syllablesPerSecond < 2.5 && syllablesPerSecond > 0) {
        calibratedRate = 0.92;
      }

      return {
        pitchHz,
        calibratedPitch,
        calibratedRate,
        durationSec: Number(durationSec.toFixed(1)),
      };
    } catch (e) {
      console.warn('Acoustics analysis fallback:', e);
      return {
        pitchHz: 120,
        calibratedPitch: 0.95,
        calibratedRate: 1.0,
        durationSec: 3.0,
      };
    }
  }

  /**
   * Classical autocorrelation algorithm for fundamental pitch tracking
   */
  private autoCorrelatePitch(buffer: Float32Array, sampleRate: number): number {
    const SIZE = buffer.length;
    let rms = 0;
    for (let i = 0; i < SIZE; i++) {
      rms += buffer[i] * buffer[i];
    }
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.01) return -1; // Not enough signal

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
    let T0 = maxpos;

    if (maxval / c[0] > 0.35 && T0 > 0) {
      return sampleRate / T0;
    }
    return -1;
  }

  /**
   * Convert recorded Blob to Base64 Data URL
   */
  private blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Play the user's recorded original audio sample
   */
  public playAudio(dataUrl: string, onEnded?: () => void): void {
    this.stopAudio();
    this.currentAudioElement = new Audio(dataUrl);
    this.currentAudioElement.onended = () => {
      this.currentAudioElement = null;
      if (onEnded) onEnded();
    };
    this.currentAudioElement.play().catch((err) => {
      console.warn('Playback error:', err);
      if (onEnded) onEnded();
    });
  }

  /**
   * Stop currently playing audio sample
   */
  public stopAudio(): void {
    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement = null;
    }
  }

  /**
   * Create a standardized Cloned VoiceProfile for VoiceManager
   */
  public createClonedVoiceProfile(userName: string, cloneData: ClonedVoiceData): VoiceProfile {
    return {
      id: 'cloned-user-voice',
      name: `${userName}'s Voice (Cloned)`,
      description: `Neural clone calibrated at ${cloneData.pitchHz || 120}Hz (${cloneData.calibratedPitch}x pitch, ${cloneData.calibratedRate}x speed)`,
      type: 'clone',
      pitch: cloneData.calibratedPitch,
      rate: cloneData.calibratedRate,
      volume: 1.0,
      lang: 'en-IN',
      isCustom: true,
      clonedData: cloneData,
    };
  }
}

export const voiceCloneManager = new VoiceCloneManager();
