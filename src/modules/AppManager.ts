import { AndroidApp } from '../types/jarvis';

export const ANDROID_APPS: AndroidApp[] = [
  {
    id: 'youtube',
    name: 'YouTube',
    packageName: 'com.google.android.youtube',
    category: 'media',
    icon: 'youtube',
    deepLinkScheme: 'vnd.youtube://',
    webFallback: 'https://youtube.com',
    supportedActions: ['open', 'search', 'play'],
    sampleCommands: [
      'YouTube kholo',
      'YouTube par BGMI 120 FPS search karo',
      'CarryMinati ki video search karo',
      'Play latest tech reviews',
    ],
  },
  {
    id: 'instagram',
    name: 'Instagram',
    packageName: 'com.instagram.android',
    category: 'social',
    icon: 'instagram',
    deepLinkScheme: 'instagram://',
    webFallback: 'https://instagram.com',
    supportedActions: ['open', 'search', 'profile', 'reels'],
    sampleCommands: [
      'Instagram kholo',
      'Instagram me @username search karo',
      'Instagram me BGMI reels search karo',
      '@mohit ki profile open karo',
    ],
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    packageName: 'com.whatsapp',
    category: 'communication',
    icon: 'message-circle',
    deepLinkScheme: 'whatsapp://',
    webFallback: 'https://web.whatsapp.com',
    supportedActions: ['open', 'compose', 'send_message', 'call'],
    sampleCommands: [
      'WhatsApp kholo',
      'WhatsApp par Mohit ko message likho: Main 10 minute me aa raha hoon',
      'Papa ko WhatsApp message bhejo',
    ],
  },
  {
    id: 'chrome',
    name: 'Google Chrome',
    packageName: 'com.android.chrome',
    category: 'tools',
    icon: 'compass',
    deepLinkScheme: 'googlechrome://',
    webFallback: 'https://google.com',
    supportedActions: ['open', 'search', 'navigate'],
    sampleCommands: [
      'Chrome kholo',
      'Chrome kholo aur Vivo V2065 Android 13 search karo',
      'Google par BGMI sensitivity search karo',
    ],
  },
  {
    id: 'calculator',
    name: 'Calculator',
    packageName: 'com.google.android.calculator',
    category: 'tools',
    icon: 'calculator',
    deepLinkScheme: 'calculator://',
    webFallback: 'https://www.google.com/search?q=calculator',
    supportedActions: ['open', 'calculate'],
    sampleCommands: ['Calculator kholo', '500 * 24 calculate karo'],
  },
  {
    id: 'settings',
    name: 'System Settings',
    packageName: 'com.android.settings',
    category: 'system',
    icon: 'settings',
    deepLinkScheme: 'intent:#Intent;action=android.settings.SETTINGS;end',
    webFallback: '',
    supportedActions: ['open', 'toggle_wifi', 'toggle_bluetooth', 'accessibility'],
    sampleCommands: [
      'Settings kholo',
      'Bluetooth settings kholo',
      'Accessibility service open karo',
    ],
  },
  {
    id: 'camera',
    name: 'Camera',
    packageName: 'com.android.camera',
    category: 'media',
    icon: 'camera',
    deepLinkScheme: 'intent:#Intent;action=android.media.action.STILL_IMAGE_CAMERA;end',
    webFallback: '',
    supportedActions: ['open', 'take_photo', 'take_video'],
    sampleCommands: ['Camera kholo', 'Take a quick photo'],
  },
  {
    id: 'clock',
    name: 'Clock & Alarms',
    packageName: 'com.google.android.deskclock',
    category: 'tools',
    icon: 'clock',
    deepLinkScheme: 'intent:#Intent;action=android.intent.action.SHOW_ALARMS;end',
    webFallback: '',
    supportedActions: ['open', 'set_alarm', 'set_timer'],
    sampleCommands: ['Time kya hua?', 'Kal subah 7 baje ka alarm lagao'],
  },
  {
    id: 'phone',
    name: 'Phone Dialer',
    packageName: 'com.google.android.dialer',
    category: 'communication',
    icon: 'phone',
    deepLinkScheme: 'tel:',
    webFallback: '',
    supportedActions: ['open', 'call'],
    sampleCommands: ['Phone dialer kholo', 'Mohit ko call lagao'],
  },
  {
    id: 'maps',
    name: 'Google Maps',
    packageName: 'com.google.android.apps.maps',
    category: 'tools',
    icon: 'map-pin',
    deepLinkScheme: 'geo:0,0?q=',
    webFallback: 'https://maps.google.com',
    supportedActions: ['open', 'navigate', 'search'],
    sampleCommands: ['Google Maps kholo', 'Nearest petrol pump navigate karo'],
  },
];

class AppManager {
  private apps: AndroidApp[] = ANDROID_APPS;

  public getInstalledApps(): AndroidApp[] {
    return this.apps;
  }

  public findAppByName(name: string): AndroidApp | undefined {
    const clean = name.toLowerCase().trim();
    return this.apps.find(
      (app) =>
        app.name.toLowerCase().includes(clean) ||
        clean.includes(app.id) ||
        (app.id === 'chrome' && clean.includes('google')) ||
        (app.id === 'phone' && (clean.includes('call') || clean.includes('dialer')))
    );
  }

  public buildActionIntent(appId: string, action: string, query?: string): { intent: string; deepLink: string } {
    const app = this.apps.find((a) => a.id === appId);
    if (!app) {
      return {
        intent: `android.intent.action.VIEW`,
        deepLink: `https://www.google.com/search?q=${encodeURIComponent(query || appId)}`,
      };
    }

    switch (app.id) {
      case 'youtube':
        if (action === 'search' && query) {
          return {
            intent: `vnd.youtube://results?q=${encodeURIComponent(query)}`,
            deepLink: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
          };
        }
        return {
          intent: `vnd.youtube://`,
          deepLink: `https://youtube.com`,
        };

      case 'instagram':
        if (query) {
          const username = query.replace('@', '').trim();
          return {
            intent: `instagram://user?username=${encodeURIComponent(username)}`,
            deepLink: `https://www.instagram.com/${encodeURIComponent(username)}/`,
          };
        }
        return {
          intent: `instagram://app`,
          deepLink: `https://instagram.com`,
        };

      case 'whatsapp':
        if (query) {
          return {
            intent: `whatsapp://send?text=${encodeURIComponent(query)}`,
            deepLink: `https://wa.me/?text=${encodeURIComponent(query)}`,
          };
        }
        return {
          intent: `whatsapp://app`,
          deepLink: `https://web.whatsapp.com`,
        };

      case 'chrome':
        if (query) {
          return {
            intent: `googlechrome://navigate?url=${encodeURIComponent(`https://www.google.com/search?q=${query}`)}`,
            deepLink: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
          };
        }
        return {
          intent: `googlechrome://`,
          deepLink: `https://google.com`,
        };

      case 'phone':
        return {
          intent: `tel:${query || ''}`,
          deepLink: `tel:${query || ''}`,
        };

      case 'maps':
        return {
          intent: `geo:0,0?q=${encodeURIComponent(query || '')}`,
          deepLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query || '')}`,
        };

      default:
        return {
          intent: app.deepLinkScheme,
          deepLink: app.webFallback || '#',
        };
    }
  }
}

export const appManager = new AppManager();
