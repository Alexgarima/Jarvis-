import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';
import { handleFirestoreError, OperationType } from '../firebaseErrors';

export interface UserProfileData {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  createdAt: string;
  lastLoginAt: string;
}

type AuthListener = (user: FirebaseUser | null) => void;

class AuthManager {
  private currentUser: FirebaseUser | null = null;
  private listeners: Set<AuthListener> = new Set();
  private initialized: boolean = false;

  constructor() {
    onAuthStateChanged(auth, async (user) => {
      this.currentUser = user;
      this.initialized = true;

      if (user) {
        // Sync user profile to Firestore
        await this.syncUserProfile(user);
      }

      this.notifyListeners();
    });
  }

  public subscribe(listener: AuthListener): () => void {
    this.listeners.add(listener);
    if (this.initialized) {
      listener(this.currentUser);
    }
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    for (const listener of this.listeners) {
      try {
        listener(this.currentUser);
      } catch (err) {
        console.error('Error in auth listener:', err);
      }
    }
  }

  public getUser(): FirebaseUser | null {
    return this.currentUser;
  }

  public isReady(): boolean {
    return this.initialized;
  }

  public async signInWithGoogle(): Promise<FirebaseUser> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      this.currentUser = result.user;
      await this.syncUserProfile(result.user);
      return result.user;
    } catch (error: any) {
      console.error('Google Sign-in failed:', error);
      throw error;
    }
  }

  public async signOut(): Promise<void> {
    try {
      await signOut(auth);
      this.currentUser = null;
    } catch (error: any) {
      console.error('Sign-out failed:', error);
      throw error;
    }
  }

  private async syncUserProfile(user: FirebaseUser): Promise<void> {
    const userDocRef = doc(db, 'users', user.uid);
    const profilePayload: UserProfileData = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || 'Commander',
      photoURL: user.photoURL || '',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    try {
      await setDoc(userDocRef, profilePayload, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    }
  }

  public async recordCommand(prompt: string, spokenResponse: string, actionType: string = 'none'): Promise<void> {
    if (!this.currentUser) return;

    const historyCol = collection(db, 'users', this.currentUser.uid, 'history');
    const id = `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const historyPayload = {
      id,
      userId: this.currentUser.uid,
      prompt: prompt.substring(0, 990),
      spokenResponse: spokenResponse.substring(0, 1990),
      actionType: actionType.substring(0, 60),
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(historyCol, id), historyPayload);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${this.currentUser.uid}/history/${id}`);
    }
  }
}

export const authManager = new AuthManager();
