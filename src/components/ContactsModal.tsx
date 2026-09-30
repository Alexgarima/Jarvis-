import React, { useState } from 'react';
import { Phone, Plus, Trash2, Edit2, X, User, PhoneCall, ShieldCheck } from 'lucide-react';
import { callManager, Contact } from '../modules/CallManager';
import { soundEffects } from '../modules/SoundEffects';

interface ContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDirectCall: (contact: Contact) => void;
}

export const ContactsModal: React.FC<ContactsModalProps> = ({
  isOpen,
  onClose,
  onDirectCall,
}) => {
  const [contacts, setContacts] = useState<Contact[]>(callManager.getContacts());
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [relation, setRelation] = useState<string>('');

  if (!isOpen) return null;

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    soundEffects.play('confirm');
    callManager.addContact({
      name: name.trim(),
      phoneNumber: phone.trim(),
      relation: relation.trim() || 'Contact',
    });
    setContacts(callManager.getContacts());
    setName('');
    setPhone('');
    setRelation('');
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    soundEffects.play('click');
    callManager.deleteContact(id);
    setContacts(callManager.getContacts());
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#090e29] border border-cyan-500/40 rounded-3xl w-full max-w-md overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.25)] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-cyan-900/40 flex items-center justify-between bg-gradient-to-r from-cyan-950/30 to-indigo-950/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-['Orbitron'] text-base font-bold text-white tracking-wide flex items-center gap-1.5">
                SPEED DIAL & CALLS
              </h2>
              <p className="text-[11px] text-cyan-300/70 font-mono">
                Voice Calling Contacts Directory
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundEffects.play('click');
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-cyan-300 font-mono">
              Voice command: &quot;Call [Name]&quot;
            </span>
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950 border border-cyan-500/50 text-cyan-300 text-xs font-mono hover:bg-cyan-900/60 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAdding ? 'Cancel' : 'Add Contact'}</span>
            </button>
          </div>

          {/* Add form */}
          {isAdding && (
            <form onSubmit={handleAddContact} className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-700/50 space-y-3">
              <div>
                <label className="text-[11px] text-slate-300 font-mono block mb-1">Name</label>
                <input
                  type="text"
                  placeholder="e.g. Papa, Rohit, Bhai"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:border-cyan-400 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-300 font-mono block mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g. +919876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:border-cyan-400 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-300 font-mono block mb-1">Relation / Label (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Father, Friend, Home"
                  value={relation}
                  onChange={(e) => setRelation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                Save Contact
              </button>
            </form>
          )}

          {/* Contacts List */}
          <div className="max-h-60 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
            {contacts.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{c.name}</span>
                      {c.relation && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 font-mono">
                          {c.relation}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 font-mono">{c.phoneNumber}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      soundEffects.play('confirm');
                      onDirectCall(c);
                    }}
                    className="p-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 transition-colors cursor-pointer"
                    title={`Call ${c.name}`}
                  >
                    <PhoneCall className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
