import React, { useState, useEffect, useRef } from 'react';
import {
  OrbState,
  ChatMessage,
  StructuredAction,
  JarvisSettings,
  AppPermissionKey,
  VoiceMatchProfile,
} from './types/jarvis';
import { AIOrb } from './components/AIOrb';
import { SpeakingChatView } from './components/SpeakingChatView';
import { CommandHUDModal } from './components/CommandHUDModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { SettingsModal } from './components/SettingsModal';
import { PermissionsModal } from './components/PermissionsModal';
import { HelpSupportModal } from './components/HelpSupportModal';
import { DownloadApkModal } from './components/DownloadApkModal';
import { InstalledAppsDrawer } from './components/InstalledAppsDrawer';
import { AccountModal } from './components/AccountModal';
import { CallHUDModal } from './components/CallHUDModal';
import { OfflineMusicPlayerModal } from './components/OfflineMusicPlayerModal';
import { LockScreenStandbyHUD } from './components/LockScreenStandbyHUD';
import { ContactsModal } from './components/ContactsModal';
import { authManager } from './modules/AuthManager';
import { callManager, Contact } from './modules/CallManager';
import { offlineMusicManager } from './modules/OfflineMusicManager';
import { backgroundWakeManager } from './modules/BackgroundWakeManager';
import { voiceCloneManager } from './modules/VoiceCloneManager';
import { User as FirebaseUser } from 'firebase/auth';
import { voiceManager } from './modules/VoiceManager';
import { speechManager } from './modules/SpeechManager';
import { aiManager } from './modules/AIManager';
import { actionExecutor } from './modules/ActionExecutor';
import { commandManager } from './modules/CommandManager';
import { chatHistoryManager } from './modules/ChatHistoryManager';
import { permissionManager } from './modules/PermissionManager';
import { soundEffects } from './modules/SoundEffects';
import {
  Menu,
  User,
  Plus,
  Mic,
  Send,
  Sparkles,
  ShieldCheck,
  PlayCircle,
  MessageSquare,
  UserPlus,
  ExternalLink,
  ChevronRight,
  Bot,
  CheckCircle2,
  Trash2,
  Radio,
  Mail,
  HelpCircle,
  Phone,
  Music,
  Lock,
  Zap,
  Fingerprint,
} from 'lucide-react';

const INITIAL_SETTINGS: JarvisSettings = {
  userName: 'Mohit',
  wakeWordEnabled: true,
  wakeWord: 'Hey Jarvis',
  selectedVoiceId: 'jarvis-default',
  voiceSpeed: 1.0,
  voicePitch: 0.9,
  voiceVolume: 1.0,
  hapticFeedback: true,
  soundEffects: true,
  accessibilityServiceEnabled: true,
  preferredLanguage: 'en-IN',
  customVoices: [],
  permissions: permissionManager.getPermissionsMap(),
  replyInUserVoiceEnabled: false,
  voiceMatchEnabled: true,
};

export default function App() {
  const [settings, setSettings] = useState<JarvisSettings>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('jarvis_settings_v2');
        if (stored) return { ...INITIAL_SETTINGS, ...JSON.parse(stored) };
      } catch {}
    }
    return INITIAL_SETTINGS;
  });

  const [orbState, setOrbState] = useState<OrbState>('idle');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [statusText, setStatusText] = useState<string>('How can I help you today?');
  const [transcriptText, setTranscriptText] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [textInput, setTextInput] = useState<string>('');

  // View state: 'home' | 'speaking_chat'
  const [currentView, setCurrentView] = useState<'home' | 'speaking_chat'>('home');

  // Modals & Drawers
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState<boolean>(false);
  const [isAppsDrawerOpen, setIsAppsDrawerOpen] = useState<boolean>(false);
  const [isAccountOpen, setIsAccountOpen] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(authManager.getUser());
  const [isCallHUDOpen, setIsCallHUDOpen] = useState<boolean>(false);
  const [activeCallTarget, setActiveCallTarget] = useState<{ name: string; number: string }>({
    name: 'Papa',
    number: '+919876543210',
  });
  const [isMusicPlayerOpen, setIsMusicPlayerOpen] = useState<boolean>(false);
  const [isStandbyHUDOpen, setIsStandbyHUDOpen] = useState<boolean>(false);
  const [isContactsOpen, setIsContactsOpen] = useState<boolean>(false);
  const [backgroundState, setBackgroundState] = useState(backgroundWakeManager.getState());
  const [inspectingAction, setInspectingAction] = useState<StructuredAction | null>(null);
  const [pendingConfirmationAction, setPendingConfirmationAction] =
    useState<StructuredAction | null>(null);
  const [activeExecutedAction, setActiveExecutedAction] =
    useState<StructuredAction | null>(null);

  const textInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to background wake manager
  useEffect(() => {
    const unsub = backgroundWakeManager.subscribe((state) => {
      setBackgroundState(state);
    });
    return unsub;
  }, []);

  // Subscribe to Firebase Auth changes
  useEffect(() => {
    const unsub = authManager.subscribe((user) => {
      setCurrentUser(user);
      if (user?.displayName) {
        const firstName = user.displayName.split(' ')[0];
        setSettings((prev) => ({
          ...prev,
          userName: firstName,
        }));
      }
    });
    return unsub;
  }, []);

  // Sync settings and voice
  useEffect(() => {
    localStorage.setItem('jarvis_settings_v2', JSON.stringify(settings));

    if (settings.clonedVoice) {
      const clonedProfile = voiceCloneManager.createClonedVoiceProfile(
        settings.userName,
        settings.clonedVoice
      );
      voiceManager.registerClonedVoice(clonedProfile);
    }

    voiceManager.setVoiceProfile(settings.selectedVoiceId);
    voiceManager.updateVoiceParameters({
      rate: settings.voiceSpeed,
      pitch: settings.voicePitch,
      volume: settings.voiceVolume,
    });
    speechManager.setLanguage(settings.preferredLanguage);
    soundEffects.setEnabled(settings.soundEffects);

    // Auto-seed initial voice match profile from cloned voice if available
    if (settings.clonedVoice && !settings.voiceMatchProfile) {
      const derivedProfile: VoiceMatchProfile = {
        enrolled: true,
        enrolledAt: settings.clonedVoice.recordedAt || Date.now(),
        expectedPitchHz: settings.clonedVoice.pitchHz || 125,
        pitchRangeHz: [
          Math.max(65, (settings.clonedVoice.pitchHz || 125) - 35),
          Math.min(320, (settings.clonedVoice.pitchHz || 125) + 35),
        ],
        wakePhrase: settings.wakeWord || 'Hey Jarvis',
        confidenceThreshold: 0.62,
        sampleAudioUrl: settings.clonedVoice.sampleAudioUrl,
        trainingPassesCompleted: 1,
      };
      setSettings((prev) => ({
        ...prev,
        voiceMatchProfile: derivedProfile,
      }));
    }
  }, [settings]);

  // Synchronize Background Wake Word & Voice Match Daemon
  useEffect(() => {
    backgroundWakeManager.configure({
      wakeWord: settings.wakeWord || 'Hey Jarvis',
      userName: settings.userName || 'Mohit',
      voiceMatchEnabled: !!settings.voiceMatchEnabled,
      voiceMatchProfile: settings.voiceMatchProfile || null,
    });

    if (settings.wakeWordEnabled) {
      backgroundWakeManager.startBackgroundListening();
    } else if (!isStandbyHUDOpen) {
      backgroundWakeManager.stopBackgroundListening();
    }
  }, [
    settings.wakeWordEnabled,
    settings.wakeWord,
    settings.userName,
    settings.voiceMatchEnabled,
    settings.voiceMatchProfile,
    isStandbyHUDOpen,
  ]);

  // Handle incoming background wake event (Gemini / Google Assistant Style)
  useEffect(() => {
    backgroundWakeManager.setOnWakeCallback(async (command, verification) => {
      console.log('[JARVIS Wake Daemon] Voice Match Verified:', { command, verification });

      soundEffects.play('activate');
      setCurrentView('speaking_chat');
      setOrbState('listening');

      if (command && command.trim()) {
        setStatusText(`"${command}"`);
        setTranscriptText(command);
        processUserCommand(command);
      } else {
        const greeting = settings.replyInUserVoiceEnabled
          ? `Haan ${settings.userName}, boliye main sun raha hoon.`
          : `Yes ${settings.userName}, standing by. How can I help?`;
        setStatusText(greeting);
        await voiceManager.speak(greeting);
        if (!voiceManager.isSpeaking()) {
          setOrbState('listening');
        }
      }
    });
  }, [settings.userName, settings.replyInUserVoiceEnabled]);

  // Subscribe to chat history changes
  useEffect(() => {
    const unsub = chatHistoryManager.subscribe((msgs) => {
      setMessages(msgs);
    });
    return unsub;
  }, []);

  // Sync VoiceManager speaking state with orbState
  useEffect(() => {
    const unsub = voiceManager.onSpeakingChange((speaking) => {
      if (speaking) {
        setOrbState('speaking');
      } else {
        setOrbState('idle');
      }
    });
    return unsub;
  }, []);

  // Check required permission before executing
  const checkPermissionForAction = (action: StructuredAction): boolean => {
    if (!action.requiredPermission) return true;
    const isAllowed = permissionManager.isGranted(action.requiredPermission);
    if (!isAllowed) {
      soundEffects.play('warning');
      const warningText = `Sir, is action ke liye "${action.requiredPermission.replace('_', ' ').toUpperCase()}" permission required hai. Please allow permission to proceed.`;
      setStatusText(warningText);
      voiceManager.speak(warningText);
      setIsPermissionsOpen(true);
      return false;
    }
    return true;
  };

  // Main command processing pipeline
  const processUserCommand = async (commandText: string) => {
    const trimmed = commandText.trim();
    if (!trimmed) return;

    soundEffects.play('click');
    setTextInput('');
    setTranscriptText(trimmed);

    // If confirmation is waiting, check user response
    if (pendingConfirmationAction) {
      const { confirmed, detected } = commandManager.isConfirmationResponse(trimmed);
      if (detected) {
        if (confirmed) {
          handleConfirmAction();
        } else {
          handleCancelConfirmation();
        }
        return;
      }
    }

    // 1. Add user message
    chatHistoryManager.addMessage({
      sender: 'user',
      text: trimmed,
    });

    // 2. Set Orb to Thinking state
    setOrbState('thinking');
    setStatusText(`Processing: "${trimmed}"`);

    try {
      // 3. Request AI reasoning & structured action extraction
      const aiResponse = await aiManager.processCommand(
        trimmed,
        chatHistoryManager.getMessages(),
        settings.userName
      );

      setStatusText(aiResponse.spokenResponse);
      const action = aiResponse.structuredAction;
      setActiveExecutedAction(action || null);

      const lower = trimmed.toLowerCase();
      if (
        lower.includes('apk') ||
        lower.includes('github') ||
        lower.includes('release') ||
        (lower.includes('install') && lower.includes('app')) ||
        (lower.includes('download') && (lower.includes('kese') || lower.includes('kaise')))
      ) {
        setIsApkModalOpen(true);
      }

      // Add Jarvis message
      const jarvisMsg = chatHistoryManager.addMessage({
        sender: 'jarvis',
        text: aiResponse.spokenResponse,
        displayText: aiResponse.displayText,
        structuredAction: action,
        suggestedFollowups: aiResponse.suggestedFollowups,
      });

      // Sync command to cloud if signed in
      authManager.recordCommand(trimmed, aiResponse.spokenResponse, action?.action || 'none');

      // 4. Check if required permission is granted
      if (action && action.requiredPermission) {
        const allowed = checkPermissionForAction(action);
        if (!allowed) {
          chatHistoryManager.updateMessage(jarvisMsg.id, {
            permissionWarning: action.requiredPermission,
          });
          return;
        }
      }

      // 5. Check if action requires confirmation (WhatsApp send, Instagram follow/DM)
      if (action && action.confirmationRequired) {
        setPendingConfirmationAction(action);
        soundEffects.play('warning');
        await voiceManager.speak(aiResponse.spokenResponse);
        return;
      }

      // 6. Speak verbal response
      await voiceManager.speak(aiResponse.spokenResponse);

      // 7. Auto-execute direct actions (YouTube search/play, open app)
      if (action && action.text === 'toggle_standby') {
        setIsStandbyHUDOpen(true);
      } else if (action && action.app === 'OfflineMusic') {
        setIsMusicPlayerOpen(true);
        const result = await actionExecutor.executeAction(action);
        if (result.success) {
          chatHistoryManager.updateMessage(jarvisMsg.id, { status: 'executed' });
        }
      } else if (action && action.action !== 'none' && !action.confirmationRequired) {
        const result = await actionExecutor.executeAction(action);
        if (result.success) {
          chatHistoryManager.updateMessage(jarvisMsg.id, { status: 'executed' });
        }
      }
    } catch (err: any) {
      console.error('Command processing failed:', err);
      const fallbackMsg = `Sir, an anomaly occurred: ${err.message || 'Unknown issue'}. Standing by.`;
      chatHistoryManager.addMessage({
        sender: 'jarvis',
        text: fallbackMsg,
      });
      await voiceManager.speak(fallbackMsg);
    } finally {
      if (!voiceManager.isSpeaking()) {
        setOrbState('idle');
      }
    }
  };

  // Toggle microphone voice input & switch to Speaking Chat view
  const toggleListening = () => {
    if (speechManager.isListening()) {
      speechManager.stopListening();
      setOrbState('idle');
      setStatusText('How can I help you today?');
    } else {
      voiceManager.stop();
      setOrbState('listening');
      setCurrentView('speaking_chat');
      setStatusText('Listening for command in Hindi, English, or Hinglish...');
      setTranscriptText('');

      speechManager.startListening({
        onResult: (transcript, isFinal) => {
          setTranscriptText(transcript);
          setStatusText(`"${transcript}"`);
          if (isFinal) {
            speechManager.stopListening();
            processUserCommand(transcript);
          }
        },
        onAudioLevel: (level) => {
          setAudioLevel(level);
        },
        onStateChange: (listening) => {
          if (!listening && orbState === 'listening') {
            setOrbState('idle');
          }
        },
        onError: (err) => {
          setStatusText(`Microphone error: ${err}`);
          setOrbState('idle');
        },
      });
    }
  };

  // Confirmation handling
  const handleConfirmAction = async () => {
    if (!pendingConfirmationAction) return;
    const action = pendingConfirmationAction;
    setPendingConfirmationAction(null);

    soundEffects.play('confirm');
    const msg = `Executing ${action.app} confirmed task, ${settings.userName}.`;
    setStatusText(msg);

    chatHistoryManager.addMessage({
      sender: 'jarvis',
      text: msg,
      displayText: `User confirmed action. Executing deep intent payload for **${action.app}** (${action.action}).`,
    });

    await voiceManager.speak(msg);

    if (action.app === 'Phone' || action.action === 'call') {
      setActiveCallTarget({
        name: action.recipient || 'Papa',
        number: action.text || '+919876543210',
      });
      setIsCallHUDOpen(true);
    }

    await actionExecutor.executeAction(action);
    setOrbState('idle');
  };

  const handleCancelConfirmation = async () => {
    setPendingConfirmationAction(null);
    soundEffects.play('click');
    const msg = 'Action cancelled. No changes made.';
    setStatusText(msg);

    chatHistoryManager.addMessage({
      sender: 'jarvis',
      text: msg,
      displayText: 'Operation cancelled per user instruction.',
    });

    await voiceManager.speak(msg);
    setOrbState('idle');
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#070915] text-slate-100 overflow-hidden font-sans relative selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background ambient lighting (matches Screenshot 1 Left & Screenshot 2) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[550px] h-[350px] bg-gradient-to-b from-blue-600/15 via-indigo-900/10 to-transparent blur-[80px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[450px] h-[250px] bg-cyan-600/10 blur-[90px] pointer-events-none" />

      {/* Main Screen Top Bar (Matches Screenshot 1 Left: Hamburger ☰, Logo ✦, Profile) */}
      <header className="w-full px-5 py-3.5 flex items-center justify-between z-20 select-none">
        <button
          onClick={() => {
            soundEffects.play('click');
            setIsAppsDrawerOpen(true);
          }}
          className="p-2.5 rounded-full hover:bg-white/5 text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="Open Installed Android Apps"
          aria-label="Open App Drawer"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Center Logo: JARVIS with user's uploaded logo */}
        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setIsSettingsOpen(true)}>
          <div className="w-8 h-8 rounded-full overflow-hidden border border-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.5)] group-hover:scale-105 transition-transform">
            <img
              src="/jarvis-logo.jpg"
              alt="JARVIS AI Logo"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <span className="font-['Space_Grotesk'] font-bold text-lg tracking-wide text-white flex items-center gap-1.5">
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 bg-clip-text text-transparent">
              JARVIS
            </span>
            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse fill-cyan-400/20" />
          </span>
        </div>

        {/* Right: Wake Status, Standby Mode & Gmail / Google Login */}
        <div className="flex items-center gap-2">
          {/* Background Wakeup & Voice Match Quick Status Indicator */}
          <button
            onClick={() => {
              soundEffects.play('click');
              setIsSettingsOpen(true);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-mono transition-all cursor-pointer ${
              settings.wakeWordEnabled
                ? 'bg-amber-950/60 hover:bg-amber-900/60 border-amber-500/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                : 'bg-slate-900/60 hover:bg-slate-800 border-slate-700/40 text-slate-400'
            }`}
            title={`Background Wakeup: ${settings.wakeWordEnabled ? 'ACTIVE' : 'OFF'} (${settings.wakeWord || 'Hey Jarvis'})${settings.voiceMatchEnabled ? ' · Voice Match Lock Active' : ''}`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline font-medium">
              {settings.wakeWordEnabled ? 'Wake: ON' : 'Wake: OFF'}
            </span>
            {settings.voiceMatchEnabled && (
              <span title="Voice Match Locked (Only My Voice)" className="hidden md:inline-flex items-center">
                <Fingerprint className="w-3 h-3 text-cyan-400" />
              </span>
            )}
          </button>

          <button
            onClick={() => {
              soundEffects.play('confirm');
              setIsStandbyHUDOpen(true);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 text-xs font-mono transition-all cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.25)]"
            title="Lock Phone / Standby OLED HUD"
            aria-label="Lock Phone Standby Mode"
          >
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Lock / Standby</span>
          </button>

          <button
            onClick={() => {
              soundEffects.play('click');
              setIsAccountOpen(true);
            }}
            className={`flex items-center gap-1.5 p-1 pl-2.5 pr-1 rounded-full border transition-all cursor-pointer ${
              currentUser
                ? 'bg-[#0d122b] border-cyan-400/50 hover:border-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
            }`}
            title={currentUser ? `Signed in as ${currentUser.email}` : "Sign in with Gmail / Google"}
            aria-label="Google Account and Gmail Login"
          >
            {currentUser ? (
              <>
                <span className="text-[11px] text-cyan-200 font-medium max-w-[70px] sm:max-w-[110px] truncate">
                  {currentUser.displayName?.split(' ')[0] || 'User'}
                </span>
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Google Profile'}
                    className="w-7 h-7 rounded-full border border-cyan-400 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white text-[11px] font-bold">
                    {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                  </div>
                )}
              </>
            ) : (
              <>
                <span className="text-[11px] text-white font-medium flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  Gmail
                </span>
                <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
                  <User className="w-3.5 h-3.5" />
                </div>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Home Screen Content - Spacious, uncluttered, zen UI */}
      <main className="flex-1 flex flex-col justify-between items-center px-6 pt-6 pb-28 max-w-md mx-auto w-full z-10 select-none">
        {/* Top Greeting Headline */}
        <div className="text-center pt-2">
          <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-white/95">
            Hello, <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-300 to-blue-400">{settings.userName}</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1.5 flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            Online · Ready for voice commands
          </p>
        </div>

        {/* Center Hero Ambient Orb Display with Generous Breathing Space */}
        <div className="my-auto flex flex-col items-center justify-center py-6">
          <AIOrb
            state={orbState}
            audioLevel={audioLevel}
            onClick={() => {
              setCurrentView('speaking_chat');
              toggleListening();
            }}
            variant="home"
          />
          <p className="text-xs text-slate-400 mt-4 font-mono text-center tracking-wide max-w-xs transition-all">
            {statusText}
          </p>
        </div>

        {/* Minimal Clean Fast-Action Row (Only 4 sleek shortcuts, zero clutter) */}
        <div className="flex items-center justify-center gap-3 w-full mb-1">
          {/* Direct Speed Dial / Call */}
          <button
            onClick={() => {
              soundEffects.play('confirm');
              setActiveCallTarget({ name: 'Papa', number: '+919876543210' });
              setIsCallHUDOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-300 text-xs transition-all shadow-sm cursor-pointer"
            title="Voice Call & Speed Dial"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-medium">Call</span>
          </button>

          {/* Offline Music Player */}
          <button
            onClick={() => {
              soundEffects.play('click');
              setIsMusicPlayerOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-indigo-500/40 text-slate-300 hover:text-indigo-300 text-xs transition-all shadow-sm cursor-pointer"
            title="Offline Music Synthesizer & Local MP3"
          >
            <Music className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-medium">Music</span>
          </button>

          {/* Lock Screen Standby HUD */}
          <button
            onClick={() => {
              soundEffects.play('confirm');
              setIsStandbyHUDOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 text-xs transition-all shadow-sm cursor-pointer"
            title="OLED Always-On Lockscreen Mode"
          >
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-medium">Standby</span>
          </button>

          {/* Installed Android Apps */}
          <button
            onClick={() => {
              soundEffects.play('click');
              setIsAppsDrawerOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-sky-500/40 text-slate-300 hover:text-sky-300 text-xs transition-all shadow-sm cursor-pointer"
            title="Open App Drawer (YouTube, WhatsApp, Instagram, etc.)"
          >
            <Menu className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-medium">Apps</span>
          </button>
        </div>
      </main>

      {/* Floating Bottom Card: Ask JARVIS... (Matches Screenshot 1 Left & Screenshot 2) */}
      <footer className="fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-lg px-5 z-30 select-none">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            processUserCommand(textInput);
          }}
          className="flex items-center gap-2.5 p-2 rounded-3xl bg-[#121635]/95 border border-cyan-700/50 shadow-[0_10px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl"
        >
          {/* Left: Plus (+) Button */}
          <button
            type="button"
            onClick={() => {
              soundEffects.play('click');
              setIsPermissionsOpen(true);
            }}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Permissions & Shortcuts"
            aria-label="Add or Permissions"
          >
            <Plus className="w-5 h-5" />
          </button>

          {/* Center Input Placeholder */}
          <input
            ref={textInputRef}
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Ask JARVIS..."
            className="flex-1 bg-transparent px-2 text-sm text-white placeholder-slate-400 focus:outline-none"
          />

          {/* Right: Submit Arrow or Glowing Microphone Button (Matches Screenshots) */}
          {textInput.trim() ? (
            <button
              type="submit"
              className="w-11 h-11 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white flex items-center justify-center shadow-lg transition-transform cursor-pointer shrink-0"
              title="Send Command"
            >
              <Send className="w-5 h-5 -rotate-12 translate-x-0.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={toggleListening}
              className="w-11 h-11 rounded-full bg-gradient-to-tr from-cyan-500 via-sky-500 to-blue-600 hover:scale-105 text-white flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all cursor-pointer shrink-0"
              title="Start Voice Assistant (Speaking AI Chat)"
              aria-label="Voice Input"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
        </form>
      </footer>

      {/* Full Screen "Speaking AI Chat" (Matches Screenshot 1 Right) */}
      {currentView === 'speaking_chat' && (
        <SpeakingChatView
          orbState={orbState}
          audioLevel={audioLevel}
          statusText={statusText}
          transcriptText={transcriptText}
          activeAction={activeExecutedAction}
          onToggleListening={toggleListening}
          onClose={() => setCurrentView('home')}
          onSendTextPrompt={(text) => processUserCommand(text)}
          onExecuteAction={(act) => actionExecutor.executeAction(act)}
          onInspectAction={(act) => setInspectingAction(act)}
          onRequestPermissions={() => setIsPermissionsOpen(true)}
        />
      )}

      {/* Modals & Dialogs */}
      {isPermissionsOpen && (
        <PermissionsModal
          isOpen={isPermissionsOpen}
          onClose={() => setIsPermissionsOpen(false)}
          onPermissionChange={() => {
            setSettings({
              ...settings,
              permissions: permissionManager.getPermissionsMap(),
            });
          }}
        />
      )}

      {inspectingAction && (
        <CommandHUDModal
          action={inspectingAction}
          onClose={() => setInspectingAction(null)}
          onExecute={(action) => actionExecutor.executeAction(action)}
        />
      )}

      {pendingConfirmationAction && (
        <ConfirmationModal
          action={pendingConfirmationAction}
          onConfirm={handleConfirmAction}
          onCancel={handleCancelConfirmation}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={setSettings}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      <InstalledAppsDrawer
        isOpen={isAppsDrawerOpen}
        onClose={() => setIsAppsDrawerOpen(false)}
        onSelectCommand={(cmd) => processUserCommand(cmd)}
        onOpenApkModal={() => setIsApkModalOpen(true)}
      />

      <HelpSupportModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        userName={settings.userName}
      />

      <DownloadApkModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
      />

      <AccountModal
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
        currentUser={currentUser}
        onUserChanged={(user) => {
          setCurrentUser(user);
          if (user?.displayName) {
            const firstName = user.displayName.split(' ')[0];
            setSettings((prev) => ({
              ...prev,
              userName: firstName,
            }));
          }
        }}
      />

      <CallHUDModal
        isOpen={isCallHUDOpen}
        onClose={() => setIsCallHUDOpen(false)}
        targetContactName={activeCallTarget.name}
        targetPhoneNumber={activeCallTarget.number}
        onCallInitiated={(num) => {
          chatHistoryManager.addMessage({
            sender: 'jarvis',
            text: `Dialer launched for ${activeCallTarget.name} (${num}).`,
          });
        }}
      />

      <OfflineMusicPlayerModal
        isOpen={isMusicPlayerOpen}
        onClose={() => setIsMusicPlayerOpen(false)}
      />

      <LockScreenStandbyHUD
        isOpen={isStandbyHUDOpen}
        onUnlock={() => setIsStandbyHUDOpen(false)}
        onCallRequested={() => {
          setIsStandbyHUDOpen(false);
          setActiveCallTarget({ name: 'Papa', number: '+919876543210' });
          setIsCallHUDOpen(true);
        }}
        onMusicRequested={() => {
          setIsStandbyHUDOpen(false);
          setIsMusicPlayerOpen(true);
        }}
        onVoiceCommand={(cmd) => {
          processUserCommand(cmd);
        }}
      />

      <ContactsModal
        isOpen={isContactsOpen}
        onClose={() => setIsContactsOpen(false)}
        onDirectCall={(contact: Contact) => {
          setIsContactsOpen(false);
          setActiveCallTarget({ name: contact.name, number: contact.phoneNumber });
          setIsCallHUDOpen(true);
        }}
      />
    </div>
  );
}
