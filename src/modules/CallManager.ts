export interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  relation?: string;
  avatarColor?: string;
}

const DEFAULT_CONTACTS: Contact[] = [
  { id: 'c1', name: 'Papa', phoneNumber: '+919876543210', relation: 'Father', avatarColor: '#06b6d4' },
  { id: 'c2', name: 'Mohit', phoneNumber: '+919887290000', relation: 'Self/Work', avatarColor: '#6366f1' },
  { id: 'c3', name: 'Mummy', phoneNumber: '+919876543211', relation: 'Mother', avatarColor: '#ec4899' },
  { id: 'c4', name: 'Bhai', phoneNumber: '+919876543212', relation: 'Brother', avatarColor: '#10b981' },
  { id: 'c5', name: 'Emergency', phoneNumber: '112', relation: 'Police / SOS', avatarColor: '#ef4444' },
];

const STORAGE_KEY = 'jarvis_contacts_v1';

class CallManager {
  private contacts: Contact[] = [];

  constructor() {
    this.loadContacts();
  }

  private loadContacts() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.contacts = JSON.parse(stored);
      } else {
        this.contacts = [...DEFAULT_CONTACTS];
        this.saveContacts();
      }
    } catch {
      this.contacts = [...DEFAULT_CONTACTS];
    }
  }

  public getContacts(): Contact[] {
    return this.contacts;
  }

  public addContact(contact: Omit<Contact, 'id'>): Contact {
    const newContact: Contact = {
      ...contact,
      id: `c_${Date.now()}`,
      avatarColor: contact.avatarColor || '#06b6d4',
    };
    this.contacts.unshift(newContact);
    this.saveContacts();
    return newContact;
  }

  public updateContact(id: string, updates: Partial<Contact>) {
    this.contacts = this.contacts.map((c) => (c.id === id ? { ...c, ...updates } : c));
    this.saveContacts();
  }

  public deleteContact(id: string) {
    this.contacts = this.contacts.filter((c) => c.id !== id);
    this.saveContacts();
  }

  private saveContacts() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.contacts));
    } catch (e) {
      console.warn('Could not save contacts to localStorage:', e);
    }
  }

  public findContact(query: string): Contact | undefined {
    const q = query.toLowerCase().trim();
    if (!q) return undefined;

    // Direct name match or relation match
    return (
      this.contacts.find((c) => c.name.toLowerCase() === q) ||
      this.contacts.find((c) => c.name.toLowerCase().includes(q) || q.includes(c.name.toLowerCase())) ||
      this.contacts.find((c) => c.relation && c.relation.toLowerCase() === q) ||
      this.contacts.find((c) => c.relation && (c.relation.toLowerCase().includes(q) || q.includes(c.relation.toLowerCase())))
    );
  }

  public makeCall(phoneNumber: string): { success: boolean; url: string } {
    const cleanNumber = phoneNumber.replace(/[^0-9+*#]/g, '');
    const telUrl = `tel:${cleanNumber}`;
    try {
      // Direct native dialer trigger
      window.location.href = telUrl;
      return { success: true, url: telUrl };
    } catch (e) {
      console.warn('Failed to dispatch tel intent:', e);
      return { success: false, url: telUrl };
    }
  }
}

export const callManager = new CallManager();
