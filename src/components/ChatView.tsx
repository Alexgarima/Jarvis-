import React, { useRef, useEffect } from 'react';
import { ChatMessage, StructuredAction } from '../types/jarvis';
import { Bot, User, Play, ExternalLink, ShieldAlert, CheckCircle2, Search } from 'lucide-react';
import { soundEffects } from '../modules/SoundEffects';

interface ChatViewProps {
  messages: ChatMessage[];
  onSelectFollowup: (text: string) => void;
  onExecuteAction: (action: StructuredAction) => void;
  onInspectAction: (action: StructuredAction) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  onSelectFollowup,
  onExecuteAction,
  onInspectAction,
  searchQuery,
  onSearchChange,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Search Header for Chat History */}
      <div className="px-4 py-2 border-b border-cyan-950/40 bg-slate-950/40 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-cyan-500/70 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search past logs, commands, or apps..."
            className="w-full bg-slate-900/60 border border-cyan-900/30 rounded pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-500/60"
          />
        </div>
      </div>

      {/* Messages Scroll View */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-sm">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
            <Bot className="w-8 h-8 text-cyan-500/30 mb-2 animate-pulse" />
            <p>No conversation logs found.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const action = msg.structuredAction;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} transition-all`}
              >
                {/* Sender Tag & Timestamp */}
                <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-slate-500">
                  {isUser ? (
                    <>
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="text-cyan-400 font-bold">YOU</span>
                      <User className="w-3 h-3 text-cyan-400" />
                    </>
                  ) : (
                    <>
                      <Bot className="w-3 h-3 text-cyan-400" />
                      <span className="text-cyan-400 font-bold">JARVIS</span>
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </>
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-xl px-4 py-3 relative border ${
                    isUser
                      ? 'bg-gradient-to-br from-cyan-950/80 to-slate-900/90 text-cyan-50 border-cyan-700/50 shadow-[0_2px_12px_rgba(6,182,212,0.15)] rounded-tr-none'
                      : 'bg-gradient-to-br from-slate-900/90 to-slate-950/90 text-slate-200 border-cyan-900/40 shadow-[0_2px_12px_rgba(0,0,0,0.4)] rounded-tl-none'
                  }`}
                >
                  {/* Spoken voice line */}
                  <p className="whitespace-pre-line text-[13px] leading-relaxed select-text">
                    {msg.displayText || msg.text}
                  </p>

                  {/* Structured Action Preview Box (APP + SCREEN + ELEMENT + ACTION) */}
                  {action && action.app !== 'JARVIS' && (
                    <div className="mt-3 pt-3 border-t border-cyan-900/40 text-xs">
                      <div className="bg-slate-950/80 rounded-lg p-2.5 border border-cyan-900/50 flex flex-col gap-1.5 font-mono">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase tracking-wider text-cyan-400 font-semibold flex items-center gap-1">
                            <span>ACTION PROTOCOL</span>
                          </span>
                          {action.confirmationRequired && (
                            <span className="flex items-center gap-1 text-[10px] text-amber-400 font-bold">
                              <ShieldAlert className="w-3 h-3" />
                              CONFIRMATION REQUIRED
                            </span>
                          )}
                        </div>

                        {/* Structured Matrix Grid */}
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-slate-300 py-1">
                          <div>
                            <span className="text-slate-500">App:</span>{' '}
                            <span className="text-cyan-300 font-bold">{action.app}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Screen:</span>{' '}
                            <span className="text-slate-300">{action.screen || 'Default'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Element:</span>{' '}
                            <span className="text-slate-300 truncate inline-block max-w-[120px] align-bottom">
                              {action.element || 'None'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Action:</span>{' '}
                            <span className="text-emerald-400 uppercase font-semibold">{action.action}</span>
                          </div>
                        </div>

                        {action.text && (
                          <div className="text-[11px] bg-slate-900/90 px-2 py-1 rounded border border-cyan-950 text-cyan-200 truncate">
                            <span className="text-slate-500">Payload: </span>"{action.text}"
                          </div>
                        )}

                        {/* Action Buttons: Execute vs Inspect */}
                        <div className="mt-1 flex items-center gap-2 pt-1 border-t border-cyan-950">
                          <button
                            onClick={() => {
                              soundEffects.play('click');
                              onInspectAction(action);
                            }}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded bg-slate-900 hover:bg-slate-800 text-[11px] text-cyan-300 border border-cyan-900/60 transition-colors cursor-pointer"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Inspect UI Path</span>
                          </button>

                          <button
                            onClick={() => {
                              soundEffects.play('confirm');
                              onExecuteAction(action);
                            }}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded bg-cyan-600 hover:bg-cyan-500 text-[11px] text-white font-semibold shadow-[0_0_10px_rgba(6,182,212,0.3)] transition-colors cursor-pointer"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Execute Intent</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Suggested Followups */}
                  {!isUser && msg.suggestedFollowups && msg.suggestedFollowups.length > 0 && (
                    <div className="mt-3 pt-2 flex flex-wrap gap-1.5">
                      {msg.suggestedFollowups.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            soundEffects.play('click');
                            onSelectFollowup(item);
                          }}
                          className="px-2.5 py-1 rounded-md text-[11px] bg-cyan-950/50 hover:bg-cyan-900/70 border border-cyan-800/50 text-cyan-300 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-2.5 h-2.5 text-cyan-400" />
                          <span>{item}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
