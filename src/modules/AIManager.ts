import { ChatMessage, StructuredAction } from '../types/jarvis';
import { commandManager } from './CommandManager';

export interface JarvisAIResponse {
  spokenResponse: string;
  displayText: string;
  structuredAction?: StructuredAction;
  suggestedFollowups?: string[];
}

class AIManager {
  public async processCommand(
    prompt: string,
    history: ChatMessage[] = [],
    userName: string = 'Mohit'
  ): Promise<JarvisAIResponse> {
    try {
      const response = await fetch('/api/jarvis/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          userName,
          conversationHistory: history.slice(-6).map((msg) => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }],
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data: JarvisAIResponse = await response.json();
      return this.cleanseResponse(data);
    } catch {
      return this.cleanseResponse(this.localProcessCommand(prompt, userName));
    }
  }

  private cleanseResponse(data: JarvisAIResponse): JarvisAIResponse {
    if (!data) return data;
    const scrub = (str: string): string => {
      if (!str || typeof str !== 'string') return str;
      return str
        .replace(/gemini[- ]*3\.8[- ]*flash/gi, 'JARVIS AI')
        .replace(/gemini[- ]*3\.8/gi, 'JARVIS AI')
        .replace(/gemini[- ]*flash/gi, 'JARVIS AI')
        .replace(/gemini[- ]*pro/gi, 'JARVIS AI')
        .replace(/\bgemini\b/gi, 'JARVIS')
        .replace(/\bgoogle gemini\b/gi, 'JARVIS Neural Core');
    };

    return {
      ...data,
      spokenResponse: scrub(data.spokenResponse),
      displayText: scrub(data.displayText),
      suggestedFollowups: data.suggestedFollowups?.map((s) => scrub(s)),
    };
  }

  private localProcessCommand(prompt: string, userName: string): JarvisAIResponse {
    const action = commandManager.parseNaturalCommand(prompt);
    const p = prompt.toLowerCase();

    // Phone Calling
    if (action.app === 'Phone' || action.action === 'call') {
      const recipient = action.recipient || action.text || 'Papa';
      const number = action.text || '+919876543210';
      return {
        spokenResponse: `${recipient} ko call connect kar raha hoon. Confirm kar dein, ${userName}?`,
        displayText: `### 📞 Outgoing Phone Call\n\n- **Recipient:** ${recipient}\n- **Number:** \`${number}\`\n- **Service:** Android Telephony \`tel:${number}\`\n\nCall connect karne ke liye confirm karein.`,
        structuredAction: action,
        suggestedFollowups: ['Haan call lagao', 'Cancel', 'Loudspeaker on karo'],
      };
    }

    // Offline Music Player
    if (action.app === 'OfflineMusic') {
      if (action.text === 'pause') {
        return {
          spokenResponse: `Offline music pause kar diya hai, ${userName}.`,
          displayText: `### ⏸️ Offline Music Paused\n\nAudio stream stopped. You can resume anytime from the lockscreen controls or by saying "Play music".`,
          structuredAction: action,
          suggestedFollowups: ['Resume music', 'Next song', 'Open Playlist'],
        };
      }
      if (action.text === 'next') {
        return {
          spokenResponse: `Next track par skip kar diya hai, ${userName}.`,
          displayText: `### ⏭️ Next Offline Track Playing\n\nSynchronized with lockscreen MediaSession controls.`,
          structuredAction: action,
          suggestedFollowups: ['Pause music', 'Add Local Songs', 'Volume full karo'],
        };
      }
      return {
        spokenResponse: `Offline cyberpunk music play kar raha hoon, ${userName}. Phone lock hone par bhi background me chalta rahega.`,
        displayText: `### 🎵 Offline Music Engine Active\n\n- **Mode:** Zero-Internet Audio Synthesizer\n- **Background Keep-Alive:** Enabled\n- **Lockscreen Media Controls:** Active\n- **Local Songs Supported:** Select local MP3s anytime.`,
        structuredAction: action,
        suggestedFollowups: ['Pause music', 'Next song', 'Local MP3 add karo', 'Phone lock mode'],
      };
    }

    // Standby / Lockscreen Mode
    if (action.text === 'toggle_standby') {
      return {
        spokenResponse: `Standby lockscreen mode initialize kar raha hoon, ${userName}. Background voice detection active rahegi.`,
        displayText: `### 🔒 Standby / Lockscreen HUD Activated\n\n- **Display:** Deep OLED Minimal Clock\n- **WakeLock:** Active (keeps device ready)\n- **Voice Trigger:** Say "Hey Jarvis" or "Call Papa" anytime while locked.`,
        structuredAction: action,
        suggestedFollowups: ['Unlock screen', 'Call Papa', 'Offline music chalao'],
      };
    }

    // APK, GitHub & App Installation Queries
    if (
      p.includes('apk') ||
      p.includes('github') ||
      p.includes('release') ||
      (p.includes('download') && (p.includes('app') || p.includes('kese') || p.includes('kaise'))) ||
      p.includes('install app')
    ) {
      return {
        spokenResponse: `Sir, maine APK Download aur GitHub Releases guide screen par open kar di hai. Aap GitHub Release page se direct debug APK download kar sakte hain ya Chrome se direct phone me install kar sakte hain.`,
        displayText: `### 📱 Android APK & GitHub Releases Guide\n\n**Option 1: GitHub Releases APK**\n1. GitHub repository ke **Releases** page par jayein.\n2. Latest Release ke **"Assets"** section me se \`.apk\` download karein.\n\n**Option 2: Direct Phone Install (Recommended)**\n1. Chrome browser me Shared URL kholein.\n2. Top right me **3 dots (⋮)** par tap karein.\n3. **"Install app"** dabayein.\n\n**Option 3: PWABuilder**\n- PWABuilder (pwabuilder.com) se direct signed .apk generate karein.`,
        suggestedFollowups: ['Copy Release URL', 'Install on Phone', 'Help & Support'],
      };
    }

    // Identity inquiries ("who are you", "what model", "tum kaun ho")
    if (
      p.includes('who are you') ||
      p.includes('kaun ho') ||
      p.includes('what are you') ||
      p.includes('what model') ||
      p.includes('which model') ||
      p.includes('model kya') ||
      p.includes('gemini') ||
      p.includes('kya naam') ||
      p.includes('your name')
    ) {
      return {
        spokenResponse: `Sir, main J.A.R.V.I.S. hoon—aapka advanced personal AI assistant. Main aapke orders execute karne ke liye taiyar hoon.`,
        displayText: `### 🤖 J.A.R.V.I.S. (AI Assistant)\n\nMain aapka personal AI assistant hoon, jo voice processing aur Android apps automation ke sath ready hai.`,
        suggestedFollowups: ['YouTube par video play karo', 'WhatsApp par message bhejo', 'Help & Support'],
      };
    }

    // YouTube: Search & Play Video
    if (action.app === 'YouTube') {
      if (action.action === 'play') {
        return {
          spokenResponse: `YouTube khol kar "${action.text}" search karke video play kar raha hoon, ${userName}.`,
          displayText: `Dispatched YouTube search & auto-play for **"${action.text}"**.\n- Launching \`com.google.android.youtube\`\n- Injecting query into search bar\n- Auto-starting top video stream`,
          structuredAction: action,
          suggestedFollowups: ['Next video play karo', 'Volume badhao', 'Pause video'],
        };
      }
      if (action.action === 'search') {
        return {
          spokenResponse: `YouTube par "${action.text}" search kar raha hoon, ${userName}.`,
          displayText: `Dispatched YouTube search for **"${action.text}"**. Launching intent handler.`,
          structuredAction: action,
          suggestedFollowups: ['Play first video', 'Filter by 4K', 'Search CarryMinati'],
        };
      }
      return {
        spokenResponse: `Sure, YouTube open kar raha hoon, ${userName}.`,
        displayText: `Target application **YouTube** (\`com.google.android.youtube\`) launched.`,
        structuredAction: action,
        suggestedFollowups: ['BGMI video play karo', 'Open Trending', 'Search songs'],
      };
    }

    // Instagram: Search, Follow, and DM Message
    if (action.app === 'Instagram') {
      if (action.action === 'follow_and_dm') {
        return {
          spokenResponse: `Instagram par ${action.text} ko search karke follow aur message karne ke liye ready hoon. Confirm kar dein, ${userName}?`,
          displayText: `**Instagram Workflow Initiated:**\n1. Search profile: **${action.text}**\n2. Trigger **Follow** action\n3. Compose Direct Message: > "${action.additionalMessage}"\n\nAwaiting your final confirmation to execute.`,
          structuredAction: action,
          suggestedFollowups: ['Haan, follow aur message kar do', 'Cancel', 'Sirf follow karo'],
        };
      }
      if (action.action === 'follow') {
        return {
          spokenResponse: `Instagram par ${action.text} ko follow karne wala hoon. Continue karein, ${userName}?`,
          displayText: `Prepared Instagram Follow request for **${action.text}**. Please confirm to proceed.`,
          structuredAction: action,
          suggestedFollowups: ['Haan follow karo', 'Cancel', 'Send DM instead'],
        };
      }
      if (action.text) {
        return {
          spokenResponse: `Searching for ${action.text} on Instagram, ${userName}.`,
          displayText: `Navigating to Instagram profile **${action.text}**. Accessibility path mapped.`,
          structuredAction: action,
          suggestedFollowups: ['Follow profile', 'Message send karo', 'Search reels'],
        };
      }
      return {
        spokenResponse: `Opening Instagram, ${userName}.`,
        displayText: `Target package \`com.instagram.android\` dispatched.`,
        structuredAction: action,
        suggestedFollowups: ['Search @mohit', 'Search BGMI reels', 'Check explore'],
      };
    }

    // WhatsApp: Search Contact & Send Message
    if (action.app === 'WhatsApp') {
      return {
        spokenResponse: `WhatsApp me ${action.recipient} ke liye message ready hai: "${action.text}". Send kar doon, ${userName}?`,
        displayText: `Prepared WhatsApp message for **${action.recipient}**:\n> "${action.text}"\n\nAwaiting your confirmation to transmit via \`com.whatsapp\`.`,
        structuredAction: action,
        suggestedFollowups: ['Haan send kar do', 'Cancel message', 'Change text'],
      };
    }

    // Chrome
    if (action.app === 'Chrome') {
      return {
        spokenResponse: `Searching Google for "${action.text}".`,
        displayText: `Google Chrome launched with query: **"${action.text}"**.`,
        structuredAction: action,
        suggestedFollowups: ['Latest news', 'Search tech specs', 'Open bookmarks'],
      };
    }

    // Help, Support & Contact Queries
    if (
      p.includes('help') ||
      p.includes('support') ||
      p.includes('contact') ||
      p.includes('email') ||
      p.includes('gmail') ||
      p.includes('developer') ||
      p.includes('madad')
    ) {
      return {
        spokenResponse: `Sir, aap contact aur support ke liye developer ko mohitgurjar988729@gmail.com par email bhej sakte hain.`,
        displayText: `### 📩 Official Help & Developer Support\n\n**Email:** [mohitgurjar988729@gmail.com](mailto:mohitgurjar988729@gmail.com)\n\nAap kisi bhi query, app issue, ya feature request ke liye directly is email par message bhej sakte hain.`,
        suggestedFollowups: ['Open Support Dialog', 'App Permissions check karo', 'Open YouTube'],
      };
    }

    // Knowledge Questions
    if (p.includes('capital') || p.includes('delhi')) {
      return {
        spokenResponse: 'India ki capital New Delhi hai, Sir.',
        displayText: 'India ki official capital **New Delhi** hai. Yeh Rashtrapati Bhavan, Parliament House, aur Supreme Court ka home hai.',
        suggestedFollowups: ['Tell me about New Delhi', 'Population of India', 'Indian space program'],
      };
    }

    return {
      spokenResponse: `At your service, ${userName}. How can I help you today?`,
      displayText: `JARVIS AI Core is synchronized.\n- Open apps\n- Search & auto-play YouTube videos\n- WhatsApp message dispatch\n- Instagram search, follow & DM\n- General AI knowledge`,
      suggestedFollowups: [
        'YouTube par BGMI video play karo',
        'WhatsApp par Mohit ko message bhejo',
        'Instagram me @mohit ko follow aur message karo',
        'App Permissions check karo',
      ],
    };
  }
}

export const aiManager = new AIManager();
