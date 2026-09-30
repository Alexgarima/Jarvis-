import { ChatMessage } from '../types/jarvis';

const STORAGE_KEY = 'jarvis_chat_history_v1';

class ChatHistoryManager {
  private messages: ChatMessage[] = [];
  private listeners: ((messages: ChatMessage[]) => void)[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.messages = JSON.parse(raw);
      } else {
        // Welcome message on fresh install
        this.messages = [
          {
            id: 'welcome-1',
            sender: 'jarvis',
            text: 'Good day. I am J.A.R.V.I.S., your personal AI assistant. How may I assist you today?',
            displayText: 'Greetings, Sir. All holographic systems, voice synthesizers, and Android command intent channels are fully operational. You can speak to me or type commands like **"YouTube kholo"**, **"Instagram me @username search karo"**, or **"WhatsApp message bhejo"**.',
            timestamp: Date.now(),
            suggestedFollowups: [
              'YouTube par BGMI search karo',
              'Instagram me @mohit search karo',
              'India ki capital kya hai?',
              'Time kya hua?',
            ],
          },
        ];
        this.saveToStorage();
      }
    } catch {
      this.messages = [];
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.messages));
      this.notify();
    } catch {
      // Storage quota exceeded or disabled
    }
  }

  private notify() {
    this.listeners.forEach((cb) => cb([...this.messages]));
  }

  public subscribe(cb: (messages: ChatMessage[]) => void) {
    this.listeners.push(cb);
    cb([...this.messages]);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  public getMessages(): ChatMessage[] {
    return [...this.messages];
  }

  public addMessage(msg: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage {
    const newMsg: ChatMessage = {
      ...msg,
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
    };
    this.messages.push(newMsg);
    this.saveToStorage();
    return newMsg;
  }

  public updateMessage(id: string, updates: Partial<ChatMessage>) {
    this.messages = this.messages.map((m) => (m.id === id ? { ...m, ...updates } : m));
    this.saveToStorage();
  }

  public clearHistory() {
    this.messages = [
      {
        id: `welcome-${Date.now()}`,
        sender: 'jarvis',
        text: 'New session initialized. Standing by for instructions.',
        displayText: 'Session memory cleared. Systems calibrated for new commands.',
        timestamp: Date.now(),
        suggestedFollowups: ['YouTube kholo', 'Chrome me search karo', 'Mujhe rap sunao'],
      },
    ];
    this.saveToStorage();
  }

  public searchMessages(query: string): ChatMessage[] {
    const q = query.toLowerCase().trim();
    if (!q) return this.messages;
    return this.messages.filter(
      (m) =>
        m.text.toLowerCase().includes(q) ||
        (m.displayText && m.displayText.toLowerCase().includes(q)) ||
        (m.structuredAction?.app && m.structuredAction.app.toLowerCase().includes(q))
    );
  }
}

export const chatHistoryManager = new ChatHistoryManager();
