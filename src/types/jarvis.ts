export type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'executing';

export type AppPermissionKey =
  | 'open_apps'
  | 'youtube_play'
  | 'whatsapp_messaging'
  | 'instagram_follow_msg'
  | 'accessibility_service'
  | 'microphone'
  | 'overlay_display';

export interface AppPermission {
  key: AppPermissionKey;
  title: string;
  description: string;
  icon: string;
  granted: boolean;
  requiredFor: string[];
}

export interface StructuredAction {
  app: string;
  screen: string;
  element: string;
  text?: string;
  recipient?: string;
  additionalMessage?: string;
  action:
    | 'open'
    | 'search'
    | 'compose'
    | 'call'
    | 'play'
    | 'navigate'
    | 'toggle_setting'
    | 'follow'
    | 'follow_and_dm'
    | 'dm'
    | 'none';
  confirmationRequired?: boolean;
  deepLink?: string;
  androidIntent?: string;
  requiredPermission?: AppPermissionKey;
  multiStepSequence?: {
    step: number;
    title: string;
    description: string;
  }[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'jarvis';
  text: string;
  displayText?: string;
  timestamp: number;
  structuredAction?: StructuredAction;
  status?: 'pending' | 'confirmed' | 'executed' | 'cancelled';
  suggestedFollowups?: string[];
  permissionWarning?: AppPermissionKey;
}

export interface ClonedVoiceData {
  sampleAudioUrl?: string;
  calibratedPitch: number;
  calibratedRate: number;
  recordedAt: number;
  pitchHz?: number;
  sampleDurationSec?: number;
  sampleText?: string;
}

export interface VoiceProfile {
  id: string;
  name: string;
  description: string;
  type: 'jarvis' | 'mohit' | 'friday' | 'titan' | 'custom' | 'clone';
  pitch: number;
  rate: number;
  volume: number;
  lang: string;
  voiceURI?: string;
  isCustom?: boolean;
  clonedData?: ClonedVoiceData;
}

export interface AndroidApp {
  id: string;
  name: string;
  packageName: string;
  category: 'social' | 'media' | 'system' | 'tools' | 'communication';
  icon: string;
  deepLinkScheme: string;
  webFallback: string;
  supportedActions: string[];
  sampleCommands: string[];
}

export interface AccessibilityStep {
  step: number;
  label: string;
  targetElement: string;
  targetScreen: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  actionType: 'locate' | 'type' | 'click' | 'intent';
  detail: string;
}

export interface VoiceMatchProfile {
  enrolled: boolean;
  enrolledAt: number;
  expectedPitchHz: number;
  pitchRangeHz: [number, number];
  spectralCentroid?: number;
  wakePhrase: string;
  confidenceThreshold?: number;
  sampleAudioUrl?: string;
  trainingPassesCompleted: number;
}

export interface JarvisSettings {
  userName: string;
  wakeWordEnabled: boolean;
  wakeWord: string;
  selectedVoiceId: string;
  voiceSpeed: number;
  voicePitch: number;
  voiceVolume: number;
  hapticFeedback: boolean;
  soundEffects: boolean;
  accessibilityServiceEnabled: boolean;
  preferredLanguage: 'auto' | 'hi-IN' | 'en-IN' | 'en-US';
  customVoices: VoiceProfile[];
  permissions: Record<AppPermissionKey, boolean>;
  replyInUserVoiceEnabled?: boolean;
  clonedVoice?: ClonedVoiceData;
  voiceMatchEnabled?: boolean;
  voiceMatchProfile?: VoiceMatchProfile;
}
