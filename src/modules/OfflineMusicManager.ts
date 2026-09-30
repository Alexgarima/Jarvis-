export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  duration: number; // in seconds
  sourceType: 'synth' | 'local_file';
  audioBlobUrl?: string;
  synthTheme?: 'synthwave' | 'chill_ambient' | 'cyber_pulse' | 'heavy_bass';
}

const PRESET_TRACKS: MusicTrack[] = [
  {
    id: 'track-1',
    title: 'Arc Reactor Pulse',
    artist: 'J.A.R.V.I.S. Core Synth',
    duration: 180,
    sourceType: 'synth',
    synthTheme: 'synthwave',
  },
  {
    id: 'track-2',
    title: 'Mark 85 Cyber Drive',
    artist: 'Stark Industries Audio',
    duration: 210,
    sourceType: 'synth',
    synthTheme: 'cyber_pulse',
  },
  {
    id: 'track-3',
    title: 'Deep Space Nebula Ambient',
    artist: 'J.A.R.V.I.S. Ambient Matrix',
    duration: 240,
    sourceType: 'synth',
    synthTheme: 'chill_ambient',
  },
  {
    id: 'track-4',
    title: 'Titan Armor Overdrive',
    artist: 'Cybernetic War Core',
    duration: 195,
    sourceType: 'synth',
    synthTheme: 'heavy_bass',
  },
];

type MusicListener = (state: {
  isPlaying: boolean;
  currentTrack: MusicTrack | null;
  currentTime: number;
  duration: number;
  volume: number;
}) => void;

class OfflineMusicManager {
  private tracks: MusicTrack[] = [...PRESET_TRACKS];
  private currentTrackIndex: number = 0;
  private isPlaying: boolean = false;
  private currentTime: number = 0;
  private volume: number = 0.8;
  private listeners: Set<MusicListener> = new Set();

  // Web Audio Context for offline synth generation
  private audioCtx: AudioContext | null = null;
  private synthInterval: number | null = null;
  private timerInterval: number | null = null;
  private masterGain: GainNode | null = null;

  // HTMLAudioElement for local user MP3 files
  private audioElement: HTMLAudioElement | null = null;

  constructor() {
    this.setupAudioElement();
    this.setupMediaSession();
  }

  private setupAudioElement() {
    if (typeof window === 'undefined') return;
    this.audioElement = new Audio();
    this.audioElement.volume = this.volume;

    this.audioElement.onended = () => {
      this.next();
    };

    this.audioElement.ontimeupdate = () => {
      if (this.audioElement && this.currentTrack()?.sourceType === 'local_file') {
        this.currentTime = Math.floor(this.audioElement.currentTime);
        this.notify();
      }
    };
  }

  private setupMediaSession() {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.setActionHandler('play', () => this.play());
      navigator.mediaSession.setActionHandler('pause', () => this.pause());
      navigator.mediaSession.setActionHandler('nexttrack', () => this.next());
      navigator.mediaSession.setActionHandler('previoustrack', () => this.previous());
      navigator.mediaSession.setActionHandler('stop', () => this.stop());
    } catch (e) {
      console.warn('MediaSession handler error:', e);
    }
  }

  private updateMediaSessionMetadata(track: MusicTrack) {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: 'JARVIS Offline Audio Matrix',
        artwork: [
          {
            src: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=512&auto=format&fit=crop',
            sizes: '512x512',
            type: 'image/jpeg',
          },
        ],
      });
      navigator.mediaSession.playbackState = this.isPlaying ? 'playing' : 'paused';
    } catch (e) {
      console.warn('Could not update MediaSession:', e);
    }
  }

  public subscribe(cb: MusicListener): () => void {
    this.listeners.add(cb);
    cb(this.getState());
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify() {
    const state = this.getState();
    for (const listener of this.listeners) {
      try {
        listener(state);
      } catch (err) {
        console.warn('Music listener error:', err);
      }
    }
  }

  public getState() {
    const track = this.currentTrack();
    return {
      isPlaying: this.isPlaying,
      currentTrack: track,
      currentTime: this.currentTime,
      duration: track ? track.duration : 0,
      volume: this.volume,
    };
  }

  public getTracks(): MusicTrack[] {
    return this.tracks;
  }

  public currentTrack(): MusicTrack | null {
    if (this.tracks.length === 0) return null;
    return this.tracks[this.currentTrackIndex] || this.tracks[0];
  }

  public addLocalFiles(files: FileList | File[]) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('audio/')) continue;

      const blobUrl = URL.createObjectURL(file);
      const cleanTitle = file.name.replace(/\.[^/.]+$/, '');
      const newTrack: MusicTrack = {
        id: `local_${Date.now()}_${i}`,
        title: cleanTitle,
        artist: 'Local Device Audio',
        duration: 200,
        sourceType: 'local_file',
        audioBlobUrl: blobUrl,
      };

      this.tracks.unshift(newTrack);
    }
    this.notify();
  }

  public playTrack(trackId: string) {
    const idx = this.tracks.findIndex((t) => t.id === trackId);
    if (idx !== -1) {
      this.currentTrackIndex = idx;
      this.currentTime = 0;
      this.play();
    }
  }

  public async play() {
    const track = this.currentTrack();
    if (!track) return;

    this.isPlaying = true;
    this.updateMediaSessionMetadata(track);

    if (track.sourceType === 'local_file' && track.audioBlobUrl) {
      this.stopSynth();
      if (this.audioElement) {
        this.audioElement.src = track.audioBlobUrl;
        this.audioElement.currentTime = this.currentTime;
        this.audioElement.volume = this.volume;
        try {
          await this.audioElement.play();
        } catch (e) {
          console.warn('Local audio play error:', e);
        }
      }
    } else {
      // Offline Synth Playback
      if (this.audioElement) {
        this.audioElement.pause();
      }
      this.startSynth(track.synthTheme || 'synthwave');
    }

    this.startTimer();
    this.notify();
  }

  public pause() {
    this.isPlaying = false;
    if (this.audioElement) {
      this.audioElement.pause();
    }
    this.stopSynth();
    this.stopTimer();

    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'paused';
    }
    this.notify();
  }

  public togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  public stop() {
    this.pause();
    this.currentTime = 0;
    this.notify();
  }

  public next() {
    if (this.tracks.length === 0) return;
    this.currentTrackIndex = (this.currentTrackIndex + 1) % this.tracks.length;
    this.currentTime = 0;
    this.stopSynth();
    if (this.isPlaying) {
      this.play();
    } else {
      this.notify();
    }
  }

  public previous() {
    if (this.tracks.length === 0) return;
    this.currentTrackIndex = (this.currentTrackIndex - 1 + this.tracks.length) % this.tracks.length;
    this.currentTime = 0;
    this.stopSynth();
    if (this.isPlaying) {
      this.play();
    } else {
      this.notify();
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.audioElement) {
      this.audioElement.volume = this.volume;
    }
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setValueAtTime(this.volume * 0.15, this.audioCtx.currentTime);
    }
    this.notify();
  }

  public seek(seconds: number) {
    const track = this.currentTrack();
    if (!track) return;
    this.currentTime = Math.max(0, Math.min(track.duration, seconds));
    if (track.sourceType === 'local_file' && this.audioElement) {
      this.audioElement.currentTime = this.currentTime;
    }
    this.notify();
  }

  // --- Offline Procedural Cyberpunk Synth Music Engine ---
  private initAudioCtx() {
    if (typeof window === 'undefined') return;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
        this.masterGain = this.audioCtx.createGain();
        this.masterGain.gain.setValueAtTime(this.volume * 0.15, this.audioCtx.currentTime);
        this.masterGain.connect(this.audioCtx.destination);
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  private startSynth(theme: string) {
    this.initAudioCtx();
    if (!this.audioCtx || !this.masterGain) return;

    this.stopSynth();

    // Scale of frequencies (Futuristic Minor Pentatonic)
    const chords = [
      [110, 130.81, 164.81, 220], // A Minor
      [98, 123.47, 146.83, 196],  // G
      [87.31, 110, 130.81, 174.61],// F
      [82.41, 103.83, 123.47, 164.81], // E
    ];

    let chordIndex = 0;
    let step = 0;

    const playBeatNote = () => {
      if (!this.audioCtx || !this.masterGain || !this.isPlaying) return;

      const now = this.audioCtx.currentTime;
      const currentChord = chords[chordIndex % chords.length];

      // Bass note
      const oscBass = this.audioCtx.createOscillator();
      const gainBass = this.audioCtx.createGain();
      oscBass.type = theme === 'heavy_bass' ? 'sawtooth' : 'triangle';
      oscBass.frequency.setValueAtTime(currentChord[0] * (theme === 'chill_ambient' ? 0.5 : 1), now);

      gainBass.gain.setValueAtTime(this.volume * 0.2, now);
      gainBass.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      oscBass.connect(gainBass);
      gainBass.connect(this.masterGain);
      oscBass.start(now);
      oscBass.stop(now + 0.36);

      // Lead arpeggio note
      if (step % 2 === 0) {
        const oscLead = this.audioCtx.createOscillator();
        const gainLead = this.audioCtx.createGain();
        const noteFreq = currentChord[(step / 2) % currentChord.length] * 2;
        oscLead.type = 'sine';
        oscLead.frequency.setValueAtTime(noteFreq, now);

        gainLead.gain.setValueAtTime(this.volume * 0.12, now);
        gainLead.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        oscLead.connect(gainLead);
        gainLead.connect(this.masterGain);
        oscLead.start(now);
        oscLead.stop(now + 0.41);
      }

      // Soft percussion tick
      if (theme !== 'chill_ambient' && (step === 1 || step === 3)) {
        const oscNoise = this.audioCtx.createOscillator();
        const gainNoise = this.audioCtx.createGain();
        oscNoise.type = 'square';
        oscNoise.frequency.setValueAtTime(40, now);
        gainNoise.gain.setValueAtTime(this.volume * 0.15, now);
        gainNoise.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        oscNoise.connect(gainNoise);
        gainNoise.connect(this.masterGain);
        oscNoise.start(now);
        oscNoise.stop(now + 0.12);
      }

      step = (step + 1) % 8;
      if (step === 0) {
        chordIndex = (chordIndex + 1) % chords.length;
      }
    };

    const intervalMs = theme === 'chill_ambient' ? 650 : theme === 'heavy_bass' ? 380 : 420;
    this.synthInterval = window.setInterval(playBeatNote, intervalMs);
    playBeatNote();
  }

  private stopSynth() {
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
  }

  private startTimer() {
    this.stopTimer();
    this.timerInterval = window.setInterval(() => {
      const track = this.currentTrack();
      if (!track) return;

      this.currentTime += 1;
      if (this.currentTime >= track.duration) {
        this.next();
      } else {
        this.notify();
      }
    }, 1000);
  }

  private stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
}

export const offlineMusicManager = new OfflineMusicManager();
