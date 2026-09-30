import { VoiceProfile } from '../types/jarvis';
import { soundEffects } from './SoundEffects';

export const DEFAULT_VOICES: VoiceProfile[] = [
  {
    id: 'jarvis-default',
    name: 'Default Jarvis Voice',
    description: 'Crisp, distinguished, sophisticated AI butler persona',
    type: 'jarvis',
    pitch: 0.88,
    rate: 0.98,
    volume: 1.0,
    lang: 'en-GB',
  },
  {
    id: 'mohit-voice',
    name: 'Mohit Voice',
    description: 'Personalized warm, clear Indian English & Hindi bilingual tone',
    type: 'mohit',
    pitch: 1.05,
    rate: 1.02,
    volume: 1.0,
    lang: 'en-IN',
  },
  {
    id: 'friday-cyber',
    name: 'Friday AI',
    description: 'Sleek, rapid tactical female synthetic voice',
    type: 'friday',
    pitch: 1.22,
    rate: 1.08,
    volume: 1.0,
    lang: 'en-US',
  },
  {
    id: 'titan-mark7',
    name: 'Titan Mark VII',
    description: 'Deep resonant, heavy armor tactical synthesizer',
    type: 'titan',
    pitch: 0.72,
    rate: 0.92,
    volume: 1.0,
    lang: 'en-US',
  },
];

class VoiceManager {
  private currentProfile: VoiceProfile = DEFAULT_VOICES[0];
  private customProfiles: VoiceProfile[] = [];
  private isSpeakingState: boolean = false;
  private onSpeakingChangeCallbacks: ((speaking: boolean) => void)[] = [];
  private availableVoices: SpeechSynthesisVoice[] = [];
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.loadVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        this.loadVoices();
      };
    }
  }

  private loadVoices() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.availableVoices = window.speechSynthesis.getVoices();
    }
  }

  public getAvailableSystemVoices(): SpeechSynthesisVoice[] {
    if (this.availableVoices.length === 0 && typeof window !== 'undefined') {
      this.loadVoices();
    }
    return this.availableVoices;
  }

  public getAllProfiles(): VoiceProfile[] {
    return [...DEFAULT_VOICES, ...this.customProfiles];
  }

  public setCustomProfiles(profiles: VoiceProfile[]) {
    this.customProfiles = profiles;
  }

  public registerClonedVoice(profile: VoiceProfile) {
    const existingIndex = this.customProfiles.findIndex((p) => p.id === profile.id || p.type === 'clone');
    if (existingIndex >= 0) {
      this.customProfiles[existingIndex] = profile;
    } else {
      this.customProfiles.unshift(profile);
    }
  }

  public getClonedVoice(): VoiceProfile | undefined {
    return this.customProfiles.find((p) => p.type === 'clone');
  }

  public addCustomVoice(profile: Omit<VoiceProfile, 'id' | 'isCustom'>): VoiceProfile {
    const newProfile: VoiceProfile = {
      ...profile,
      id: `custom-${Date.now()}`,
      isCustom: true,
    };
    this.customProfiles.push(newProfile);
    return newProfile;
  }

  public deleteCustomVoice(id: string) {
    this.customProfiles = this.customProfiles.filter((p) => p.id !== id);
    if (this.currentProfile.id === id) {
      this.currentProfile = DEFAULT_VOICES[0];
    }
  }

  public setVoiceProfile(id: string) {
    const found = this.getAllProfiles().find((p) => p.id === id);
    if (found) {
      this.currentProfile = found;
    }
  }

  public getCurrentProfile(): VoiceProfile {
    return this.currentProfile;
  }

  public updateVoiceParameters(params: { pitch?: number; rate?: number; volume?: number }) {
    this.currentProfile = {
      ...this.currentProfile,
      ...params,
    };
  }

  public onSpeakingChange(cb: (speaking: boolean) => void) {
    this.onSpeakingChangeCallbacks.push(cb);
    return () => {
      this.onSpeakingChangeCallbacks = this.onSpeakingChangeCallbacks.filter((c) => c !== cb);
    };
  }

  private notifySpeaking(speaking: boolean) {
    this.isSpeakingState = speaking;
    this.onSpeakingChangeCallbacks.forEach((cb) => cb(speaking));
  }

  public isSpeaking(): boolean {
    return this.isSpeakingState;
  }

  public stop() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.notifySpeaking(false);
      this.currentUtterance = null;
    }
  }

  public async speak(
    text: string,
    override?: { pitch?: number; rate?: number; volume?: number; voiceId?: string }
  ): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        console.warn('SpeechSynthesis not supported on this platform');
        resolve();
        return;
      }

      this.stop();

      // Clean markdown tags or symbols before speaking
      const cleanText = text
        .replace(/[*_#`~>]/g, '')
        .replace(/https?:\/\/\S+/g, 'link')
        .replace(/@([a-zA-Z0-9_]+)/g, 'user $1')
        .slice(0, 450);

      const utterance = new SpeechSynthesisUtterance(cleanText);
      const profile = override?.voiceId
        ? this.getAllProfiles().find((p) => p.id === override.voiceId) || this.currentProfile
        : this.currentProfile;

      utterance.pitch = override?.pitch ?? profile.pitch;
      utterance.rate = override?.rate ?? profile.rate;
      utterance.volume = override?.volume ?? profile.volume;

      // Select best matching voice from browser
      const systemVoices = this.getAvailableSystemVoices();
      if (systemVoices.length > 0) {
        let matchingVoice: SpeechSynthesisVoice | undefined;

        if (profile.type === 'clone' || profile.type === 'mohit') {
          // Look for Indian English / Hindi voice matching user's persona
          matchingVoice =
            systemVoices.find((v) => v.lang.includes('IN') || v.name.toLowerCase().includes('india') || v.lang.includes('hi')) ||
            systemVoices.find((v) => v.name.toLowerCase().includes('rishi') || v.name.toLowerCase().includes('neerja')) ||
            systemVoices.find((v) => v.name.toLowerCase().includes('hindi') || v.lang.startsWith('hi')) ||
            systemVoices.find((v) => v.lang.startsWith('en'));
        } else if (profile.type === 'jarvis') {
          // Look for British or deep male English voice
          matchingVoice =
            systemVoices.find(
              (v) => (v.lang.includes('GB') || v.lang.includes('UK')) && v.name.toLowerCase().includes('male')
            ) ||
            systemVoices.find((v) => v.lang.includes('GB') || v.lang.includes('en-GB')) ||
            systemVoices.find((v) => v.name.toLowerCase().includes('daniel') || v.name.toLowerCase().includes('george'));
        } else if (profile.type === 'friday') {
          // Female voice
          matchingVoice =
            systemVoices.find(
              (v) =>
                (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('samantha') || v.name.toLowerCase().includes('karen')) &&
                v.lang.startsWith('en')
            ) || systemVoices.find((v) => v.lang.startsWith('en'));
        }

        // Fallback to any English or primary voice
        if (!matchingVoice) {
          matchingVoice = systemVoices.find((v) => v.lang.startsWith('en')) || systemVoices[0];
        }

        if (matchingVoice) {
          utterance.voice = matchingVoice;
        }
      }

      utterance.onstart = () => {
        this.notifySpeaking(true);
        soundEffects.play('speaking');
      };

      utterance.onend = () => {
        this.notifySpeaking(false);
        this.currentUtterance = null;
        resolve();
      };

      utterance.onerror = (e) => {
        console.warn('Speech error:', e);
        this.notifySpeaking(false);
        this.currentUtterance = null;
        resolve();
      };

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    });
  }

  public previewVoice(profile: VoiceProfile): Promise<void> {
    const previewPhrases: Record<string, string> = {
      jarvis: 'Good day, Sir. All Jarvis systems are functioning at peak efficiency.',
      mohit: 'Haan Mohit, main bilkul ready hoon. Aap bataiye aaj kya task karna hai?',
      clone: 'Namaste Mohit! Maine aapki awaaz ko absorb kar liya hai. Ab main aapke sabhi sawaalon ke jawab aapki hi voice me doonga.',
      friday: 'Tactical HUD initialized. Standing by for your directive.',
      titan: 'Defense protocols operational. Weapon systems online.',
      custom: 'Custom voice matrix synchronized. Voice synthesis active.',
    };

    const phrase = previewPhrases[profile.type] || previewPhrases.custom;
    return this.speak(phrase, {
      pitch: profile.pitch,
      rate: profile.rate,
      volume: profile.volume,
      voiceId: profile.id,
    });
  }
}

export const voiceManager = new VoiceManager();
