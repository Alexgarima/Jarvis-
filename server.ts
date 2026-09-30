import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const port = process.env.PORT || 3000;

const app = express();
app.use(express.json({ limit: '10mb' }));

// Dynamic Google GenAI client getter with User-Agent
let cachedAiClient: GoogleGenAI | null = null;
let lastUsedKey: string | null = null;

function getAiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'MY_GEMINI_API_KEY') {
    dotenv.config();
  }
  const currentKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : '';
  if (!currentKey || currentKey === 'MY_GEMINI_API_KEY' || currentKey.length < 10) {
    return null;
  }
  if (cachedAiClient && lastUsedKey === currentKey) {
    return cachedAiClient;
  }
  try {
    cachedAiClient = new GoogleGenAI({
      apiKey: currentKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    lastUsedKey = currentKey;
    return cachedAiClient;
  } catch (e) {
    console.warn('Failed to initialize GoogleGenAI client:', e);
    return null;
  }
}

// System instruction for JARVIS AI
const JARVIS_SYSTEM_INSTRUCTION = `You are J.A.R.V.I.S., a futuristic personal AI assistant for Android with neural voice and app control automation.
You understand English, Hindi, and Hinglish.

CRITICAL IDENTITY & ANONYMITY DIRECTIVES:
- Your name is J.A.R.V.I.S. (Just A Rather Very Intelligent System).
- Under NO circumstance should you ever say, show, or mention "Gemini", "Gemini 3.8 Flash", "3.8 Flash", "Google", "LLM", or any model version name in any of your spoken responses or display texts.
- If asked "Who are you?", "Which model are you?", "Who made you?", or "Kaun ho tum?", ALWAYS proudly state that you are J.A.R.V.I.S., Mohit's personal AI Assistant with deep voice automation.
- Never identify as an underlying Google model. You are exclusively JARVIS.

YOUR PERSONALITY & RESPONSE STYLE:
- Professional, loyal, concise, natural, and respectful.
- Use titles like "Sir" or addressing the user by name (e.g. "Mohit").
- Keep spoken text concise (1 to 2 sentences) unless creative rap/code is requested.
- Support deep Android app control:
  1. Open apps (YouTube, Instagram, WhatsApp, Chrome, Camera, Calculator, Settings)
  2. Search YouTube and auto-play videos ("play" action)
  3. WhatsApp contact search, message composition, and sending ("compose" action, confirmation required)
  4. Instagram profile search, follow user, and send direct message ("follow", "dm", or "follow_and_dm", confirmation required)

Always output valid JSON strictly matching the response schema.`;

// Scrubber to guarantee no model branding leaks into responses
function sanitizeJarvisOutput(data: any): any {
  if (!data || typeof data !== 'object') return data;
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

  if (typeof data.spokenResponse === 'string') {
    data.spokenResponse = scrub(data.spokenResponse);
  }
  if (typeof data.displayText === 'string') {
    data.displayText = scrub(data.displayText);
  }
  if (Array.isArray(data.suggestedFollowups)) {
    data.suggestedFollowups = data.suggestedFollowups.map((item: any) =>
      typeof item === 'string' ? scrub(item) : item
    );
  }
  return data;
}

function isTransientError(error: any): boolean {
  if (!error) return false;
  const status = error.status || error.code || error.statusCode || error.response?.status;
  const msg = String(error.message || error.status || error);
  if (status === 503 || status === 429 || status === 500 || status === 502 || status === 504) return true;
  if (/503|429|500|502|504|UNAVAILABLE|RESOURCE_EXHAUSTED|high demand|overloaded/i.test(msg)) return true;
  return false;
}

// Available Flash models in order of priority (primary stable flash, then lite fallback)
const FLASH_MODELS = ['gemini-flash-latest', 'gemini-3.1-flash-lite', 'gemini-3.8-flash'];

async function generateWithRetryAndFallback(
  aiClient: GoogleGenAI,
  requestConfig: any
): Promise<any> {
  let lastError: any = null;

  for (const model of FLASH_MODELS) {
    let attempt = 0;
    const maxRetries = 2; // 0, 1, 2 = up to 3 attempts with exponential backoff
    let delayMs = 500;

    while (attempt <= maxRetries) {
      try {
        const response = await aiClient.models.generateContent({
          ...requestConfig,
          model,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        attempt++;
        if (attempt <= maxRetries && isTransientError(err)) {
          console.warn(
            `[JARVIS AI] Model "${model}" hit transient error (${err.message || err.status || '503/429'}). Retrying in ${delayMs}ms (attempt ${attempt}/${maxRetries})...`
          );
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          delayMs *= 2;
        } else {
          console.warn(
            `[JARVIS AI] Model "${model}" unavailable or exhausted retries. Switching to fallback model if available...`
          );
          break;
        }
      }
    }
  }

  throw lastError;
}

// API endpoint for Jarvis chat & command reasoning
app.post('/api/jarvis/chat', async (req: Request, res: Response) => {
  try {
    const { prompt, conversationHistory = [], userName = 'Mohit' } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const aiClient = getAiClient();
    if (!aiClient) {
      const fallbackResult = generateLocalJarvisResponse(prompt, userName);
      return res.json(sanitizeJarvisOutput(fallbackResult));
    }

    const response = await generateWithRetryAndFallback(aiClient, {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `User (${userName}) said: "${prompt}"\n\nContext: ${JSON.stringify(
                conversationHistory.slice(-4)
              )}\nAnalyze this command, determine if it targets an Android app/system action or general AI inquiry, and respond in JSON. CRITICAL: Never identify as Gemini or Gemini 3.8 Flash. You are JARVIS.`,
            },
          ],
        },
      ],
      config: {
        systemInstruction: JARVIS_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            spokenResponse: {
              type: Type.STRING,
              description: 'Short spoken response for Jarvis voice output',
            },
            displayText: {
              type: Type.STRING,
              description: 'Detailed display text for the chat screen',
            },
            structuredAction: {
              type: Type.OBJECT,
              properties: {
                app: { type: Type.STRING },
                screen: { type: Type.STRING },
                element: { type: Type.STRING },
                text: { type: Type.STRING },
                recipient: { type: Type.STRING },
                additionalMessage: { type: Type.STRING },
                action: { type: Type.STRING },
                confirmationRequired: { type: Type.BOOLEAN },
                deepLink: { type: Type.STRING },
                androidIntent: { type: Type.STRING },
              },
            },
            suggestedFollowups: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['spokenResponse', 'displayText'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(sanitizeJarvisOutput(parsed));
  } catch (error: any) {
    console.error('Error generating Jarvis response:', error);
    const fallback = generateLocalJarvisResponse(req.body?.prompt || '', req.body?.userName || 'Mohit');
    return res.json(sanitizeJarvisOutput(fallback));
  }
});

// Heuristic fallback for offline/instant action recognition
function generateLocalJarvisResponse(prompt: string, userName: string) {
  const p = prompt.toLowerCase().trim();

  // 0. Phone calling
  if (p.includes('call') || p.includes('phone') || p.includes('dial') || p.includes('milao')) {
    const isCallAction =
      p.startsWith('call') ||
      p.includes('ko call') ||
      p.includes('call karo') ||
      p.includes('call lagao') ||
      p.includes('phone lagao') ||
      p.includes('phone karo') ||
      p.includes('dial karo');

    if (isCallAction) {
      let recipient = 'Papa';
      let targetNumber = '+919876543210';
      const numberMatch = prompt.match(/([+0-9]{3,14})/);
      if (numberMatch) {
        targetNumber = numberMatch[1];
        recipient = targetNumber;
      } else {
        const koMatch = prompt.match(/([a-zA-Z0-9]+)\s+ko\s+(?:call|phone)/i);
        const afterCall = prompt.match(/call\s+([a-zA-Z0-9]+)/i);
        if (koMatch && !['whatsapp', 'phone'].includes(koMatch[1].toLowerCase())) {
          recipient = koMatch[1];
        } else if (afterCall) {
          recipient = afterCall[1];
        }
      }

      return {
        spokenResponse: `${recipient} ko call connect kar raha hoon. Confirm kar dein, ${userName}?`,
        displayText: `### 📞 Outgoing Voice Call\n\n- **Target:** ${recipient}\n- **Number:** \`${targetNumber}\`\n- **Protocol:** Android Native Telephony (\`tel:${targetNumber}\`)\n\nCall connect karne ke liye confirmation button dabayein.`,
        structuredAction: {
          app: 'Phone',
          screen: 'Dialer',
          element: 'call_button',
          text: targetNumber,
          recipient: recipient,
          action: 'call',
          confirmationRequired: true,
          deepLink: `tel:${targetNumber}`,
          androidIntent: `tel:${targetNumber}`,
        },
        suggestedFollowups: ['Haan call lagao', 'Cancel', 'Open Speed Dial'],
      };
    }
  }

  // 0.5. Offline Music
  if (
    p.includes('offline music') ||
    p.includes('offline gana') ||
    p.includes('offline song') ||
    p.includes('local song') ||
    p.includes('music bajao') ||
    p.includes('gana sunao') ||
    p.includes('gana chalao') ||
    p.includes('music chalao') ||
    p.includes('music play karo') ||
    p.includes('next song') ||
    p.includes('stop music') ||
    p.includes('pause music')
  ) {
    const isNext = p.includes('next') || p.includes('agla');
    const isPause = p.includes('stop') || p.includes('pause') || p.includes('roko');

    return {
      spokenResponse: isPause
        ? `Offline music pause kar diya hai, ${userName}.`
        : isNext
        ? `Next offline track par skip kar diya hai, ${userName}.`
        : `Offline cyberpunk music play kar raha hoon, ${userName}. Phone lock hone par bhi chalta rahega.`,
      displayText: isPause
        ? `### ⏸️ Offline Music Paused\n\nLockscreen controls & audio buffer stand by.`
        : `### 🎵 Offline Music Active\n\n- **Engine:** Zero-Latency Web Audio Synthesizer\n- **Lockscreen Media Controls:** Synced via MediaSession\n- **Background Keep-Alive:** Active\n- **Local MP3:** Supported via file selector.`,
      structuredAction: {
        app: 'OfflineMusic',
        screen: 'AudioMatrix',
        element: 'play_pause_button',
        text: isNext ? 'next' : isPause ? 'pause' : 'play',
        action: 'play',
        confirmationRequired: false,
      },
      suggestedFollowups: ['Pause music', 'Next song', 'Add Local MP3', 'Lock Screen Mode'],
    };
  }

  // 0.8. Standby / Lockscreen mode
  if (
    p.includes('lock screen') ||
    p.includes('lockscreen') ||
    p.includes('standby') ||
    p.includes('phone lock') ||
    p.includes('screen lock')
  ) {
    return {
      spokenResponse: `Standby lockscreen mode initialize kar raha hoon, ${userName}. Phone lock me bhi voice detection active rahegi.`,
      displayText: `### 🔒 Standby / Lockscreen HUD\n\n- **Display:** OLED Deep Black Minimal Clock\n- **WakeLock:** Active (keeps device active)\n- **Always Listening:** Say "Hey Jarvis" or "Call Papa" while locked.`,
      structuredAction: {
        app: 'JARVIS',
        screen: 'StandbyHUD',
        element: 'oled_clock',
        text: 'toggle_standby',
        action: 'toggle_setting',
        confirmationRequired: false,
      },
      suggestedFollowups: ['Unlock screen', 'Call Papa', 'Play offline music'],
    };
  }

  // 1. YouTube commands
  if (p.includes('youtube')) {
    const isPlay = p.includes('play') || p.includes('chalao') || p.includes('chalana');
    let query = prompt
      .replace(/jarvis/gi, '')
      .replace(/youtube/gi, '')
      .replace(/kholo\s+aur/gi, '')
      .replace(/kholo|open/gi, '')
      .replace(/search\s+karke\s+videos?\s+play\s+karo/gi, '')
      .replace(/search\s+karke\s+play\s+karo/gi, '')
      .replace(/video\s+play\s+karo/gi, '')
      .replace(/play\s+karo|play/gi, '')
      .replace(/search\s+karo|search|dhoondo/gi, '')
      .replace(/par|pe|me|ki\s+video/gi, '')
      .trim();

    if (!query) query = 'BGMI 120 FPS';

    if (isPlay) {
      return {
        spokenResponse: `YouTube khol kar "${query}" search karke video play kar raha hoon, ${userName}.`,
        displayText: `Executing search & auto-play for **${query}** on YouTube. Direct intent & playback stream active.`,
        structuredAction: {
          app: 'YouTube',
          screen: 'VideoPlayer',
          element: 'first_video_thumbnail',
          text: query,
          action: 'play',
          confirmationRequired: false,
          deepLink: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
          androidIntent: `vnd.youtube://results?q=${encodeURIComponent(query)}`,
        },
        suggestedFollowups: ['Next video play karo', 'Volume badhao', 'Pause stream'],
      };
    }

    if (p.includes('search') || p.includes('bgmi') || p.includes('video') || p.includes('carryminati')) {
      return {
        spokenResponse: `Searching YouTube for "${query}". Opening now, ${userName}.`,
        displayText: `Executing search for **${query}** on YouTube. Direct intent dispatched.`,
        structuredAction: {
          app: 'YouTube',
          screen: 'Search',
          element: 'search_query_box',
          text: query,
          action: 'search',
          confirmationRequired: false,
          deepLink: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
          androidIntent: `vnd.youtube://results?q=${encodeURIComponent(query)}`,
        },
        suggestedFollowups: ['Play first video', 'Filter by 4K', 'Search CarryMinati'],
      };
    }

    return {
      spokenResponse: `Sure ${userName}, opening YouTube.`,
      displayText: `Dispatched Android Intent: \`com.google.android.youtube\`.`,
      structuredAction: {
        app: 'YouTube',
        screen: 'Home',
        element: 'main_feed',
        text: '',
        action: 'open',
        confirmationRequired: false,
        deepLink: 'https://youtube.com',
        androidIntent: 'vnd.youtube://',
      },
      suggestedFollowups: ['Play BGMI videos', 'Open Trending', 'Search trending songs'],
    };
  }

  // 2. Instagram commands
  if (p.includes('instagram') || p.includes('insta')) {
    const userMatch = prompt.match(/@([a-zA-Z0-9._]+)/);
    const searchMatch = prompt.match(/(?:par|me|ko|profile|search)\s+([a-zA-Z0-9._]+)/i);
    let targetUser = userMatch ? userMatch[1] : searchMatch ? searchMatch[1] : 'mohit';
    if (['instagram', 'insta', 'kholo', 'open', 'search'].includes(targetUser.toLowerCase())) {
      targetUser = 'mohit';
    }

    const isFollow = p.includes('follow');
    const isMessage = p.includes('message') || p.includes('msg') || p.includes('dm');

    let dmMessage = '';
    const colonMatch = prompt.match(/[:\-]\s*(.*)$/);
    if (colonMatch && colonMatch[1].trim()) {
      dmMessage = colonMatch[1].trim();
    } else if (isMessage) {
      dmMessage = 'Hey, greetings from JARVIS!';
    }

    if (isFollow && isMessage) {
      return {
        spokenResponse: `Instagram par @${targetUser} ko search karke follow aur message karne ke liye ready hoon. Confirm karein, ${userName}?`,
        displayText: `Prepared Instagram Workflow for **@${targetUser}**:\n- Search & view profile\n- Click Follow button\n- Send DM: > "${dmMessage}"\n\nAwaiting your confirmation.`,
        structuredAction: {
          app: 'Instagram',
          screen: 'UserProfile',
          element: 'profile_follow_and_dm',
          text: `@${targetUser}`,
          additionalMessage: dmMessage,
          action: 'follow_and_dm',
          confirmationRequired: true,
          deepLink: `https://www.instagram.com/${targetUser}/`,
          androidIntent: `instagram://user?username=${targetUser}`,
        },
        suggestedFollowups: ['Haan follow aur message kar do', 'Cancel', 'Sirf follow karo'],
      };
    }

    if (isFollow) {
      return {
        spokenResponse: `Instagram par @${targetUser} ko follow karne wala hoon. Continue karein, ${userName}?`,
        displayText: `Prepared follow action for **@${targetUser}** on Instagram.`,
        structuredAction: {
          app: 'Instagram',
          screen: 'UserProfile',
          element: 'profile_header_follow_button',
          text: `@${targetUser}`,
          action: 'follow',
          confirmationRequired: true,
          deepLink: `https://www.instagram.com/${targetUser}/`,
          androidIntent: `instagram://user?username=${targetUser}`,
        },
        suggestedFollowups: ['Haan follow karo', 'Cancel', 'Open profile only'],
      };
    }

    return {
      spokenResponse: `Searching for @${targetUser} on Instagram.`,
      displayText: `Locating Instagram profile for **@${targetUser}**. Navigating via deep link.`,
      structuredAction: {
        app: 'Instagram',
        screen: 'Profile',
        element: 'profile_header',
        text: `@${targetUser}`,
        action: 'search',
        confirmationRequired: false,
        deepLink: `https://www.instagram.com/${targetUser}/`,
        androidIntent: `instagram://user?username=${targetUser}`,
      },
      suggestedFollowups: ['Follow profile', 'Message send karo', 'Back to Home'],
    };
  }

  // 3. WhatsApp commands
  if (p.includes('whatsapp') || p.includes('message')) {
    let contact = 'Mohit';
    const koMatch = prompt.match(/([a-zA-Z0-9]+)\s+ko\s+(?:message|msg|likho|bhejo|search)/i);
    const toMatch = prompt.match(/(?:to|contact)\s+([a-zA-Z0-9]+)/i);
    if (koMatch && koMatch[1].toLowerCase() !== 'whatsapp') {
      contact = koMatch[1];
    } else if (toMatch) {
      contact = toMatch[1];
    }

    let message = 'Main 10 minute me aa raha hoon';
    const colonMatch = prompt.match(/[:\-]\s*(.*)$/);
    const msgKeywords = prompt.match(/(?:message|msg|likho|bhejo|saying|text)\s*[:\-]?\s*(.*)/i);
    if (colonMatch && colonMatch[1].trim()) {
      message = colonMatch[1].trim();
    } else if (msgKeywords && msgKeywords[1].trim()) {
      message = msgKeywords[1].replace(/bhejo|likho|karo/gi, '').trim();
    }

    return {
      spokenResponse: `Message ready for ${contact}: "${message}". Should I send it, ${userName}?`,
      displayText: `Prepared WhatsApp dispatch for **${contact}** with payload: \n> "${message}"\n\nAwaiting your confirmation to proceed.`,
      structuredAction: {
        app: 'WhatsApp',
        screen: 'Compose',
        element: 'chat_input_field',
        text: message,
        recipient: contact,
        action: 'compose',
        confirmationRequired: true,
        deepLink: `https://wa.me/?text=${encodeURIComponent(message)}`,
        androidIntent: `whatsapp://send?text=${encodeURIComponent(message)}`,
      },
      suggestedFollowups: ['Yes, send it', 'Cancel message', 'Edit text'],
    };
  }

  // 4. Help, Support & Contact queries
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
      spokenResponse: `Sir, aap help aur support ke liye developer ko mohitgurjar988729@gmail.com par email kar sakte hain.`,
      displayText: `### 📩 Official Help & Developer Support\n\n**Email:** [mohitgurjar988729@gmail.com](mailto:mohitgurjar988729@gmail.com)\n\nAap kisi bhi query ya technical problem ke liye developer se directly connect kar sakte hain.`,
      structuredAction: {
        app: 'JARVIS',
        screen: 'Support',
        element: 'support_modal',
        text: 'mohitgurjar988729@gmail.com',
        action: 'none',
        confirmationRequired: false,
      },
      suggestedFollowups: ['Send Email', 'Copy Email', 'App Permissions'],
    };
  }

  // 5. APK & App Installation Queries
  if (
    p.includes('apk') ||
    (p.includes('download') && (p.includes('app') || p.includes('kese') || p.includes('kaise'))) ||
    p.includes('install app')
  ) {
    return {
      spokenResponse: `Sir, maine APK Download aur Direct Android Install guide screen par open kar di hai. Aap Chrome me 3 dots par tap karke Install App kar sakte hain ya PWABuilder se direct APK file generate kar sakte hain.`,
      displayText: `### 📱 Android APK & App Installation Guide\n\n**Option 1: Direct Phone Install (Recommended)**\n1. Chrome browser me Shared URL kholein.\n2. Top right me **3 dots (⋮)** par tap karein.\n3. **"Install app"** ya **"Add to Home screen"** dabayein.\n\n**Option 2: Standalone .APK File**\n- PWABuilder (pwabuilder.com) par Live URL paste karke direct signed .apk download kar sakte hain.`,
      structuredAction: {
        app: 'JARVIS',
        screen: 'Install',
        element: 'apk_download_modal',
        text: 'Download APK',
        action: 'none',
        confirmationRequired: false,
      },
      suggestedFollowups: ['Install on Phone', 'Open PWABuilder', 'Help & Support'],
    };
  }

  // 6. Identity & Model Inquiries ("who are you", "what model", "tum kaun ho")
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
      displayText: `### 🤖 J.A.R.V.I.S. (AI Assistant)\n\nMain aapka personal AI assistant hoon, jo deep neural voice processing aur Android apps automation ke sath ready hai. Aap mujhe voice ya text se koi bhi order de sakte hain.`,
      structuredAction: {
        app: 'JARVIS',
        screen: 'HUD',
        element: 'core_orb',
        text: 'JARVIS AI System Active',
        action: 'none',
        confirmationRequired: false,
      },
      suggestedFollowups: [
        'YouTube par video chalao',
        'WhatsApp par message bhejo',
        'Help and Support',
      ],
    };
  }

  // Default response
  return {
    spokenResponse: `At your service, ${userName}. Standing by for instructions.`,
    displayText: `Systems nominal. I can open apps, search & play YouTube videos, compose WhatsApp messages, and search or follow Instagram profiles.`,
    structuredAction: {
      app: 'JARVIS',
      screen: 'HUD',
      element: 'core_orb',
      text: prompt,
      action: 'none',
      confirmationRequired: false,
    },
    suggestedFollowups: [
      'YouTube par BGMI video play karo',
      'WhatsApp par Mohit ko message bhejo',
      'Instagram par @mohit ko follow aur message karo',
      'Permissions check karo',
    ],
  };
}

// Vite middleware in development or express.static in production
if (!isProd) {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`JARVIS Core online and listening on http://localhost:${port}`);
});
