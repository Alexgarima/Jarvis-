import { AppPermission, AppPermissionKey } from '../types/jarvis';
import { soundEffects } from './SoundEffects';

export const INITIAL_PERMISSIONS: AppPermission[] = [
  {
    key: 'open_apps',
    title: 'Open Applications & Launch Intents',
    description: 'Allows JARVIS to launch installed packages like YouTube, WhatsApp, and Instagram.',
    icon: 'external-link',
    granted: true,
    requiredFor: ['Open YouTube', 'Open Instagram', 'Open WhatsApp', 'Open Chrome', 'Open Camera'],
  },
  {
    key: 'youtube_play',
    title: 'YouTube Video Search & Auto-Play',
    description: 'Permits searching keywords on YouTube and directly launching video playback streams.',
    icon: 'play-circle',
    granted: true,
    requiredFor: ['Search & Play BGMI videos', 'Play CarryMinati on YouTube', 'Music playback'],
  },
  {
    key: 'whatsapp_messaging',
    title: 'WhatsApp Contact Search & Message Dispatch',
    description: 'Enables querying contact list, typing message payloads, and opening chat conversations.',
    icon: 'message-square',
    granted: true,
    requiredFor: ['WhatsApp message to Mohit', 'Send location or text to contacts'],
  },
  {
    key: 'instagram_follow_msg',
    title: 'Instagram Profile Search, Follow & DM',
    description: 'Enables locating user accounts, triggering the Follow button, and sending direct messages.',
    icon: 'user-plus',
    granted: true,
    requiredFor: ['Search @username', 'Follow Instagram profile', 'Send Instagram DM'],
  },
  {
    key: 'accessibility_service',
    title: 'Android Accessibility Service Automation',
    description: 'Allows deep screen inspection to identify search bars, click buttons, and inject keystrokes without root.',
    icon: 'shield-check',
    granted: true,
    requiredFor: ['Automated UI navigation', 'Clicking buttons inside apps', 'Auto-typing text'],
  },
  {
    key: 'microphone',
    title: 'Microphone & Speech Recognition',
    description: 'Allows voice commands in Hindi, English, and Hinglish via Web Speech / Android mic.',
    icon: 'mic',
    granted: true,
    requiredFor: ['Voice input', 'Continuous listening', 'Speech-to-text'],
  },
  {
    key: 'overlay_display',
    title: 'Display Over Other Apps (Floating HUD)',
    description: 'Permits JARVIS voice orb and command actions to run floating on top of third-party apps.',
    icon: 'layers',
    granted: false,
    requiredFor: ['Floating orb over YouTube', 'In-app automation assistant'],
  },
];

class PermissionManager {
  private permissions: Map<AppPermissionKey, boolean> = new Map();

  constructor() {
    INITIAL_PERMISSIONS.forEach((p) => {
      this.permissions.set(p.key, p.granted);
    });
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('jarvis_permissions_v2');
      if (stored) {
        const parsed = JSON.parse(stored);
        Object.keys(parsed).forEach((k) => {
          this.permissions.set(k as AppPermissionKey, Boolean(parsed[k]));
        });
      }
    } catch {}
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;
    try {
      const obj: Record<string, boolean> = {};
      this.permissions.forEach((val, key) => {
        obj[key] = val;
      });
      localStorage.setItem('jarvis_permissions_v2', JSON.stringify(obj));
    } catch {}
  }

  public isGranted(key: AppPermissionKey): boolean {
    return this.permissions.get(key) ?? false;
  }

  public setPermission(key: AppPermissionKey, granted: boolean) {
    this.permissions.set(key, granted);
    this.saveToStorage();
    if (granted) {
      soundEffects.play('confirm');
    } else {
      soundEffects.play('click');
    }
  }

  public getAll(): AppPermission[] {
    return INITIAL_PERMISSIONS.map((p) => ({
      ...p,
      granted: this.permissions.get(p.key) ?? p.granted,
    }));
  }

  public getPermissionsMap(): Record<AppPermissionKey, boolean> {
    const obj: any = {};
    INITIAL_PERMISSIONS.forEach((p) => {
      obj[p.key] = this.permissions.get(p.key) ?? p.granted;
    });
    return obj;
  }
}

export const permissionManager = new PermissionManager();
