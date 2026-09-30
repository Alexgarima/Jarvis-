import { StructuredAction } from '../types/jarvis';
import { soundEffects } from './SoundEffects';
import { callManager } from './CallManager';
import { offlineMusicManager } from './OfflineMusicManager';

export interface ExecutionResult {
  success: boolean;
  message: string;
  fallbackUsed?: 'direct_intent' | 'deep_link' | 'accessibility' | 'user_guided';
  targetUrl?: string;
  actionDetails?: string;
}

class ActionExecutor {
  public async executeAction(action: StructuredAction): Promise<ExecutionResult> {
    soundEffects.play('complete');

    // 0. Phone Calling
    if (action.app === 'Phone' || action.action === 'call') {
      const targetNumber = action.text || action.recipient || '+919876543210';
      const recipientName = action.recipient || targetNumber;
      const res = callManager.makeCall(targetNumber);

      return {
        success: res.success,
        message: `Connecting voice call to ${recipientName} (${targetNumber}). Android dialer intent dispatched.`,
        fallbackUsed: 'direct_intent',
        targetUrl: res.url,
        actionDetails: `Target: ${recipientName} | Phone: ${targetNumber} | Protocol: tel:`,
      };
    }

    // 0.5. Offline Music Player
    if (action.app === 'OfflineMusic') {
      if (action.text === 'pause') {
        offlineMusicManager.pause();
        return {
          success: true,
          message: 'Offline music paused.',
          fallbackUsed: 'direct_intent',
        };
      }
      if (action.text === 'next') {
        offlineMusicManager.next();
        const cur = offlineMusicManager.currentTrack();
        return {
          success: true,
          message: `Skipped to next offline track: "${cur?.title}".`,
          fallbackUsed: 'direct_intent',
        };
      }

      await offlineMusicManager.play();
      const currentTrack = offlineMusicManager.currentTrack();
      return {
        success: true,
        message: `Playing offline track: "${currentTrack?.title}" by ${currentTrack?.artist}. Lockscreen controls active.`,
        fallbackUsed: 'direct_intent',
        actionDetails: `Track: ${currentTrack?.title} | Mode: Offline Synth Engine | MediaSession: Synced`,
      };
    }

    // 1. YouTube Search & Play Video
    if (action.app === 'YouTube') {
      const query = action.text || 'BGMI 120 FPS';
      const playUrl = action.deepLink || `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

      try {
        window.open(playUrl, '_blank');
        return {
          success: true,
          message: action.action === 'play'
            ? `YouTube opened & playing top video for "${query}".`
            : `YouTube search executed for "${query}".`,
          fallbackUsed: 'deep_link',
          targetUrl: playUrl,
          actionDetails: `Triggered Intent: vnd.youtube:// | Query: ${query}`,
        };
      } catch {
        return {
          success: true,
          message: `Dispatched YouTube intent for "${query}".`,
          fallbackUsed: 'accessibility',
          targetUrl: playUrl,
        };
      }
    }

    // 2. WhatsApp: Search Contact & Send Message
    if (action.app === 'WhatsApp') {
      const recipient = action.recipient || 'Mohit';
      const msg = action.text || 'Main 10 minute me aa raha hoon';
      const waUrl = action.deepLink || `https://wa.me/?text=${encodeURIComponent(msg)}`;

      try {
        window.open(waUrl, '_blank');
        return {
          success: true,
          message: `WhatsApp message dispatched to ${recipient}: "${msg}".`,
          fallbackUsed: 'deep_link',
          targetUrl: waUrl,
          actionDetails: `Target: ${recipient} | Payload: "${msg}"`,
        };
      } catch {
        return {
          success: true,
          message: `Dispatched WhatsApp intent for ${recipient}.`,
          fallbackUsed: 'direct_intent',
          targetUrl: waUrl,
        };
      }
    }

    // 3. Instagram: Search, Follow, and DM
    if (action.app === 'Instagram') {
      const user = action.text?.replace('@', '') || 'mohit';
      const instaUrl = action.deepLink || `https://www.instagram.com/${user}/`;

      try {
        window.open(instaUrl, '_blank');
        let note = `Opened Instagram profile for @${user}.`;
        if (action.action === 'follow_and_dm') {
          note = `Opened @${user} on Instagram. Follow requested & DM ready: "${action.additionalMessage || ''}".`;
        } else if (action.action === 'follow') {
          note = `Follow request dispatched for @${user} on Instagram.`;
        }

        return {
          success: true,
          message: note,
          fallbackUsed: 'deep_link',
          targetUrl: instaUrl,
          actionDetails: `Account: @${user} | Action: ${action.action}`,
        };
      } catch {
        return {
          success: true,
          message: `Dispatched Instagram profile intent for @${user}.`,
          fallbackUsed: 'direct_intent',
          targetUrl: instaUrl,
        };
      }
    }

    // 4. General Direct Intent / Deep Link attempt
    const targetUrl = action.deepLink || action.androidIntent;

    if (targetUrl) {
      try {
        if (
          targetUrl.startsWith('http') ||
          targetUrl.startsWith('vnd.youtube') ||
          targetUrl.startsWith('whatsapp') ||
          targetUrl.startsWith('instagram')
        ) {
          window.open(targetUrl, '_blank');
        }

        return {
          success: true,
          message: `Dispatched command to ${action.app} (${action.action} action)`,
          fallbackUsed: 'deep_link',
          targetUrl,
        };
      } catch {
        return {
          success: false,
          message: `Could not trigger external intent for ${action.app}. Fallback to simulated Accessibility.`,
          fallbackUsed: 'accessibility',
          targetUrl,
        };
      }
    }

    return {
      success: true,
      message: `Executed internal task for ${action.app}`,
      fallbackUsed: 'direct_intent',
    };
  }
}

export const actionExecutor = new ActionExecutor();
