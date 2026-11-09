import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  getDocs,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import firebaseConfig from '../firebase-config.json';
import { FullNapSession } from './types';

// Connect this website to the new Firebase project. The previous project is untouched.
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const ADMIN_EMAIL = 'khaosatgiacngungan@gmail.com';

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function signInAdminWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  if (result.user.email?.toLowerCase() !== ADMIN_EMAIL || !result.user.emailVerified) {
    await signOut(auth);
    throw new Error('Tài khoản Google này không được cấp quyền quản trị.');
  }
  return result.user;
}

export async function signOutAdmin(): Promise<void> {
  await signOut(auth);
}

/** Save a completed survey. Participants can create records without signing in. */
export async function saveSurveyToGlobal(session: FullNapSession): Promise<void> {
  try {
    await setDoc(doc(db, 'all_surveys', session.id), {
      ...session,
      savedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Note: Cloud global survey backup skipped:', err);
  }
}

/** Retrieve all records. Firestore Security Rules restrict this to the admin account. */
export async function getAllSurveysFromGlobal(): Promise<FullNapSession[]> {
  const q = query(collection(db, 'all_surveys'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((item) => item.data() as FullNapSession);
}

/** Delete one record. Firestore Security Rules restrict this to the admin account. */
export async function deleteSurveyFromGlobal(sessionId: string): Promise<void> {
  await deleteDoc(doc(db, 'all_surveys', sessionId));
}
