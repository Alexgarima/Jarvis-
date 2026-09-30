import { StructuredAction } from '../types/jarvis';
import { appManager } from './AppManager';
import { callManager } from './CallManager';

class CommandManager {
  public parseNaturalCommand(rawText: string): StructuredAction {
    const text = rawText.trim();
    const lower = text.toLowerCase();

    // 0. Phone Calling: "Call Papa", "Call Mohit", "Papa ko phone lagao", "Phone dial karo 988729xxxx"
    if (
      lower.includes('call') ||
      lower.includes('phone') ||
      lower.includes('dial') ||
      lower.includes('milao')
    ) {
      // Check if user specifically requested a phone call (not WhatsApp call or video call)
      const isCallAction =
        lower.startsWith('call') ||
        lower.includes('ko call') ||
        lower.includes('call karo') ||
        lower.includes('call lagao') ||
        lower.includes('phone lagao') ||
        lower.includes('phone karo') ||
        lower.includes('dial karo') ||
        lower.includes('number dial');

      if (isCallAction) {
        // Extract raw number if exists
        const numberMatch = text.match(/([+0-9]{3,14})/);
        let recipient = '';
        let targetPhone = '';

        if (numberMatch) {
          targetPhone = numberMatch[1];
          recipient = targetPhone;
        } else {
          // Extract contact name: "Call Papa", "Mohit ko call karo"
          const koMatch = text.match(/([a-zA-Z0-9]+)\s+ko\s+(?:call|phone)/i);
          const afterCallMatch = text.match(/call\s+([a-zA-Z0-9]+)/i);
          if (koMatch && !['whatsapp', 'phone'].includes(koMatch[1].toLowerCase())) {
            recipient = koMatch[1];
          } else if (afterCallMatch) {
            recipient = afterCallMatch[1];
          } else {
            recipient = 'Papa';
          }

          // Lookup in CallManager contacts
          const contact = callManager.findContact(recipient);
          if (contact) {
            targetPhone = contact.phoneNumber;
            recipient = contact.name;
          } else {
            targetPhone = '+919876543210';
          }
        }

        const telUrl = `tel:${targetPhone.replace(/[^0-9+]/g, '')}`;

        return {
          app: 'Phone',
          screen: 'Dialer',
          element: 'call_button',
          text: targetPhone,
          recipient: recipient,
          action: 'call',
          confirmationRequired: true,
          deepLink: telUrl,
          androidIntent: `tel:${targetPhone}`,
          requiredPermission: 'open_apps',
          multiStepSequence: [
            { step: 1, title: 'Open Phone Dialer', description: 'Launch Android Telephony / Dialer Service' },
            { step: 2, title: `Target: ${recipient}`, description: `Fetch number: ${targetPhone}` },
            { step: 3, title: 'Trigger Native Dial Intent', description: `Dispatch ${telUrl}` },
            { step: 4, title: 'Connect Voice Call', description: 'Awaiting cellular carrier handshake' },
          ],
        };
      }
    }

    // 0.5. Offline Music: "Offline music play karo", "Music bajao", "Gana sunao", "Local song chalao", "Next song"
    if (
      lower.includes('offline music') ||
      lower.includes('offline gana') ||
      lower.includes('offline song') ||
      lower.includes('local song') ||
      lower.includes('music bajao') ||
      lower.includes('gana sunao') ||
      lower.includes('gana chalao') ||
      lower.includes('music chalao') ||
      lower.includes('music play karo') ||
      lower.includes('next song') ||
      lower.includes('stop music') ||
      lower.includes('pause music')
    ) {
      const isNext = lower.includes('next') || lower.includes('agla');
      const isPause = lower.includes('stop') || lower.includes('pause') || lower.includes('roko');

      return {
        app: 'OfflineMusic',
        screen: 'AudioMatrix',
        element: 'play_pause_button',
        text: isNext ? 'next' : isPause ? 'pause' : 'play',
        action: 'play',
        confirmationRequired: false,
        multiStepSequence: [
          { step: 1, title: 'Initialize Web Audio Matrix', description: 'Zero-latency offline audio buffer' },
          { step: 2, title: 'Activate MediaSession', description: 'Sync lockscreen & notification controls' },
          { step: 3, title: 'Play Offline Cyberpunk Track', description: 'Procedural offline synthesizer stream' },
        ],
      };
    }

    // 0.8. Standby / Lockscreen HUD: "Lock screen", "Standby mode", "Phone lock karo"
    if (
      lower.includes('lock screen') ||
      lower.includes('lockscreen') ||
      lower.includes('standby') ||
      lower.includes('phone lock') ||
      lower.includes('screen lock')
    ) {
      return {
        app: 'JARVIS',
        screen: 'StandbyHUD',
        element: 'oled_clock',
        text: 'toggle_standby',
        action: 'toggle_setting',
        confirmationRequired: false,
      };
    }

    // 1. YouTube: Open vs Search vs Search & Play Video
    if (lower.includes('youtube')) {
      const isPlay =
        lower.includes('play') ||
        lower.includes('chalao') ||
        lower.includes('chalana') ||
        lower.includes('bajao') ||
        lower.includes('video chalao');

      const isSearch =
        isPlay ||
        lower.includes('search') ||
        lower.includes('dhoondo') ||
        lower.includes('karo') ||
        lower.includes('bgmi') ||
        lower.includes('video') ||
        lower.includes('carryminati');

      if (isSearch) {
        let query = text
          .replace(/jarvis/gi, '')
          .replace(/youtube/gi, '')
          .replace(/kholo\s+aur/gi, '')
          .replace(/kholo/gi, '')
          .replace(/open/gi, '')
          .replace(/search\s+karke\s+videos?\s+play\s+karo/gi, '')
          .replace(/search\s+karke\s+play\s+karo/gi, '')
          .replace(/video\s+play\s+karo/gi, '')
          .replace(/play\s+karo|play/gi, '')
          .replace(/search\s+karo|search|dhoondo/gi, '')
          .replace(/par|pe|me/gi, '')
          .replace(/ki\s+video/gi, '')
          .trim();

        if (!query) query = 'BGMI 120 FPS';
        const { intent, deepLink } = appManager.buildActionIntent('youtube', 'search', query);

        // Direct search or auto-play video
        const videoPlayDeepLink = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

        return {
          app: 'YouTube',
          screen: isPlay ? 'VideoPlayer' : 'Search',
          element: isPlay ? 'first_video_thumbnail' : 'search_query_box',
          text: query,
          action: isPlay ? 'play' : 'search',
          confirmationRequired: false,
          deepLink: videoPlayDeepLink,
          androidIntent: isPlay
            ? `vnd.youtube://results?q=${encodeURIComponent(query)}`
            : intent,
          requiredPermission: isPlay ? 'youtube_play' : 'open_apps',
          multiStepSequence: isPlay
            ? [
                { step: 1, title: 'Open YouTube', description: 'Launch com.google.android.youtube' },
                { step: 2, title: 'Focus Search Box', description: 'Locate id/menu_item_search' },
                { step: 3, title: `Query: "${query}"`, description: 'Type search text and submit' },
                { step: 4, title: 'Select Top Video', description: 'Click 1st result in video feed' },
                { step: 5, title: 'Auto-Play Stream', description: 'Begin HD video & audio playback' },
              ]
            : undefined,
        };
      }

      return {
        app: 'YouTube',
        screen: 'Home',
        element: 'main_feed',
        text: '',
        action: 'open',
        confirmationRequired: false,
        deepLink: 'https://youtube.com',
        androidIntent: 'vnd.youtube://',
        requiredPermission: 'open_apps',
      };
    }

    // 2. Instagram: Search, Follow, and DM Message
    if (lower.includes('instagram') || lower.includes('insta')) {
      const userMatch = text.match(/@([a-zA-Z0-9._]+)/);
      const isFollow =
        lower.includes('follow') ||
        lower.includes('follow karo') ||
        lower.includes('unfollow');

      const isMessage =
        lower.includes('message') ||
        lower.includes('msg') ||
        lower.includes('dm') ||
        lower.includes('likho') ||
        lower.includes('bhejo');

      const isSearch =
        lower.includes('search') ||
        lower.includes('profile') ||
        lower.includes('reels') ||
        lower.includes('dhoondo') ||
        userMatch ||
        isFollow ||
        isMessage;

      if (isSearch) {
        let username = '';
        if (userMatch) {
          username = userMatch[1];
        } else {
          const matchUser = text.match(/(?:par|me|ko|profile)\s+([a-zA-Z0-9._]+)/i);
          if (matchUser && !['instagram', 'insta', 'search', 'follow', 'message'].includes(matchUser[1].toLowerCase())) {
            username = matchUser[1];
          } else {
            username = 'mohit';
          }
        }

        // Check if there is a message payload to send
        let dmMessage = '';
        const msgPart = text.match(/(?:message|msg|dm|likho|bhejo)\s*[:\-]?\s*(.*)/i);
        if (msgPart && msgPart[1].trim()) {
          dmMessage = msgPart[1].replace(/bhejo|likho|karo|bhej do/gi, '').trim();
        }
        if (!dmMessage && isMessage) {
          dmMessage = 'Hey, greetings from JARVIS!';
        }

        const deepLink = `https://www.instagram.com/${username}/`;
        const androidIntent = `instagram://user?username=${username}`;

        if (isFollow && isMessage) {
          return {
            app: 'Instagram',
            screen: 'UserProfile',
            element: 'action_bar_follow_and_dm',
            text: `@${username}`,
            additionalMessage: dmMessage,
            action: 'follow_and_dm',
            confirmationRequired: true,
            deepLink,
            androidIntent,
            requiredPermission: 'instagram_follow_msg',
            multiStepSequence: [
              { step: 1, title: 'Open Instagram', description: 'Launch com.instagram.android' },
              { step: 2, title: `Search @${username}`, description: 'Type username in search bar' },
              { step: 3, title: 'Open User Profile', description: 'Load profile header and bio' },
              { step: 4, title: 'Click Follow Button', description: 'Inject click on id/profile_header_follow_button' },
              { step: 5, title: `Send DM: "${dmMessage}"`, description: 'Open Message chat and send text' },
            ],
          };
        }

        if (isFollow) {
          return {
            app: 'Instagram',
            screen: 'UserProfile',
            element: 'profile_header_follow_button',
            text: `@${username}`,
            action: 'follow',
            confirmationRequired: true,
            deepLink,
            androidIntent,
            requiredPermission: 'instagram_follow_msg',
            multiStepSequence: [
              { step: 1, title: 'Open Instagram', description: 'Launch com.instagram.android' },
              { step: 2, title: `Search @${username}`, description: 'Locate user profile in directory' },
              { step: 3, title: 'Click Follow Button', description: 'Follow account with confirmation' },
            ],
          };
        }

        return {
          app: 'Instagram',
          screen: username.startsWith('@') ? 'Profile' : 'Search',
          element: 'profile_header',
          text: `@${username}`,
          action: 'search',
          confirmationRequired: false,
          deepLink,
          androidIntent,
          requiredPermission: 'instagram_follow_msg',
          multiStepSequence: [
            { step: 1, title: 'Open Instagram', description: 'Launch com.instagram.android' },
            { step: 2, title: `Search: @${username}`, description: 'Locate user profile' },
          ],
        };
      }

      return {
        app: 'Instagram',
        screen: 'Feed',
        element: 'feed_container',
        text: '',
        action: 'open',
        confirmationRequired: false,
        deepLink: 'https://instagram.com',
        androidIntent: 'instagram://app',
        requiredPermission: 'open_apps',
      };
    }

    // 3. WhatsApp: Search Contact & Send Message
    if (lower.includes('whatsapp') || lower.includes('message')) {
      let recipient = 'Mohit';
      const koMatch = text.match(/([a-zA-Z0-9]+)\s+ko\s+(?:message|msg|likho|bhejo|search)/i);
      const toMatch = text.match(/(?:to|contact)\s+([a-zA-Z0-9]+)/i);
      if (koMatch && koMatch[1].toLowerCase() !== 'whatsapp') {
        recipient = koMatch[1];
      } else if (toMatch) {
        recipient = toMatch[1];
      }

      let message = 'Main 10 minute me aa raha hoon';
      const colonMatch = text.match(/[:\-]\s*(.*)$/);
      const msgKeywords = text.match(/(?:message|msg|likho|bhejo|saying|text)\s*[:\-]?\s*(.*)/i);
      if (colonMatch && colonMatch[1].trim()) {
        message = colonMatch[1].trim();
      } else if (msgKeywords && msgKeywords[1].trim()) {
        message = msgKeywords[1].replace(/bhejo|likho|karo/gi, '').trim();
      }

      const { intent, deepLink } = appManager.buildActionIntent('whatsapp', 'compose', message);

      return {
        app: 'WhatsApp',
        screen: 'Compose',
        element: 'chat_input_field',
        text: message,
        recipient: recipient,
        action: 'compose',
        confirmationRequired: true,
        deepLink,
        androidIntent: intent,
        requiredPermission: 'whatsapp_messaging',
        multiStepSequence: [
          { step: 1, title: 'Open WhatsApp', description: 'Launch com.whatsapp messenger' },
          { step: 2, title: `Search Contact: "${recipient}"`, description: 'Locate contact in conversation list' },
          { step: 3, title: 'Open Conversation', description: 'Focus encrypted message entry field' },
          { step: 4, title: `Type Message: "${message}"`, description: 'Inject text buffer into chat' },
          { step: 5, title: 'Confirm & Send', description: 'User confirmed transmission' },
        ],
      };
    }

    // 4. Chrome / Google Search
    if (lower.includes('chrome') || lower.includes('google') || lower.includes('search karo')) {
      let query = text
        .replace(/jarvis/gi, '')
        .replace(/chrome|google/gi, '')
        .replace(/kholo\s+aur/gi, '')
        .replace(/kholo|open/gi, '')
        .replace(/search\s+karo|search|dhoondo/gi, '')
        .replace(/par|pe|me/gi, '')
        .trim();

      if (!query) query = 'Vivo V2065 Android 13';
      const { intent, deepLink } = appManager.buildActionIntent('chrome', 'search', query);

      return {
        app: 'Chrome',
        screen: 'Search',
        element: 'omnibox_url_bar',
        text: query,
        action: 'search',
        confirmationRequired: false,
        deepLink,
        androidIntent: intent,
        requiredPermission: 'open_apps',
      };
    }

    // 5. System commands
    if (lower.includes('camera') || lower.includes('photo')) {
      return {
        app: 'Camera',
        screen: 'Viewfinder',
        element: 'shutter_button',
        text: '',
        action: 'open',
        confirmationRequired: false,
        requiredPermission: 'open_apps',
      };
    }

    if (lower.includes('calculator') || lower.includes('hisaab')) {
      return {
        app: 'Calculator',
        screen: 'Keypad',
        element: 'display',
        text: '',
        action: 'open',
        confirmationRequired: false,
        deepLink: 'https://www.google.com/search?q=calculator',
        requiredPermission: 'open_apps',
      };
    }

    if (lower.includes('setting') || lower.includes('bluetooth') || lower.includes('wifi')) {
      return {
        app: 'Settings',
        screen: 'System',
        element: 'preferences_list',
        text: '',
        action: 'open',
        confirmationRequired: false,
        requiredPermission: 'open_apps',
      };
    }

    return {
      app: 'JARVIS',
      screen: 'HUD',
      element: 'ai_orb',
      text: text,
      action: 'none',
      confirmationRequired: false,
    };
  }

  public isConfirmationResponse(text: string): { confirmed: boolean; detected: boolean } {
    const clean = text.toLowerCase().trim();
    const yesTerms = ['yes', 'yeah', 'yep', 'haan', 'ha', 'bhej do', 'send it', 'proceed', 'continue', 'sure', 'kar do', 'theek hai', 'ok', 'follow kar do'];
    const noTerms = ['no', 'nah', 'cancel', 'mat bhejo', 'stop', 'ruko', 'rehne do', 'dont', "don't", 'mat karo'];

    for (const term of yesTerms) {
      if (clean === term || clean.startsWith(term + ' ') || clean.endsWith(' ' + term)) {
        return { confirmed: true, detected: true };
      }
    }

    for (const term of noTerms) {
      if (clean === term || clean.startsWith(term + ' ') || clean.endsWith(' ' + term)) {
        return { confirmed: false, detected: true };
      }
    }

    return { confirmed: false, detected: false };
  }
}

export const commandManager = new CommandManager();
