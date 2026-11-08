import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  deleteDoc,
  getDocFromServer,
  query,
  orderBy,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-config.json';
import { FullNapSession } from './types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Firestore uses the named database configured in firebase-config.json
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/gmail.send');
googleProvider.addScope('https://www.googleapis.com/auth/drive');
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');

// In-memory token cache (never stored in localStorage)
let inMemoryAccessToken: string | null = null;
export const getCachedAccessToken = (): string | null => inMemoryAccessToken;
export const setCachedAccessToken = (token: string | null): void => {
  inMemoryAccessToken = token;
};

export interface UserProfileData {
  uid: string;
  displayName: string;
  email: string;
  studentId?: string;
  className?: string;
  schoolName?: string;
  photoURL?: string;
  createdAt: string;
  updatedAt: string;
}

// Firestore error handling
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or starting up.');
    }
    return false;
  }
}

// User Profile Operations
export async function getUserProfile(uid: string): Promise<UserProfileData | null> {
  const docPath = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      return snap.data() as UserProfileData;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, docPath);
  }
}

export async function saveUserProfile(profile: Partial<UserProfileData> & { uid: string; email: string }): Promise<void> {
  const docPath = `users/${profile.uid}`;
  try {
    const existing = await getUserProfile(profile.uid);
    const updated: UserProfileData = {
      uid: profile.uid,
      displayName: profile.displayName || existing?.displayName || profile.email.split('@')[0],
      email: profile.email,
      studentId: profile.studentId || existing?.studentId || '',
      className: profile.className || existing?.className || '',
      schoolName: profile.schoolName || existing?.schoolName || '',
      photoURL: profile.photoURL || existing?.photoURL || '',
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'users', profile.uid), updated, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, docPath);
  }
}

// User Session Results Operations
export async function saveSessionToCloud(userId: string, session: FullNapSession): Promise<void> {
  const docPath = `users/${userId}/sessions/${session.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'sessions', session.id), {
      ...session,
      userId,
      savedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, docPath);
  }
}

export async function getUserSessionsFromCloud(userId: string): Promise<FullNapSession[]> {
  const collectionPath = `users/${userId}/sessions`;
  try {
    const q = query(collection(db, 'users', userId, 'sessions'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const sessions: FullNapSession[] = [];
    snapshot.forEach((d) => {
      sessions.push(d.data() as FullNapSession);
    });
    return sessions;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, collectionPath);
  }
}

export async function deleteSessionFromCloud(userId: string, sessionId: string): Promise<void> {
  const docPath = `users/${userId}/sessions/${sessionId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'sessions', sessionId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, docPath);
  }
}

// Global Repository for All Participant Surveys
export async function saveSurveyToGlobal(session: FullNapSession): Promise<void> {
  const docPath = `all_surveys/${session.id}`;
  try {
    await setDoc(doc(db, 'all_surveys', session.id), {
      ...session,
      savedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Note: Cloud global survey backup skipped:', err);
  }
}

export async function getAllSurveysFromGlobal(): Promise<FullNapSession[]> {
  try {
    const q = query(collection(db, 'all_surveys'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const sessions: FullNapSession[] = [];
    snapshot.forEach((d) => {
      sessions.push(d.data() as FullNapSession);
    });
    return sessions;
  } catch (err) {
    console.warn('Note: Cloud surveys retrieval skipped:', err);
    return [];
  }
}

export async function deleteSurveyFromGlobal(sessionId: string): Promise<void> {
  const docPath = `all_surveys/${sessionId}`;
  try {
    await deleteDoc(doc(db, 'all_surveys', sessionId));
  } catch (err) {
    console.warn('Note: Cloud survey delete skipped:', err);
  }
}
