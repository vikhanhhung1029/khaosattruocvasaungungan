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
import firebaseConfig from '../firebase-config.json';
import { FullNapSession } from './types';

// Firebase is retained only for anonymous Firestore survey storage.
// Authentication and OAuth are intentionally not initialized.
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

/** Save a completed survey to the shared Firestore collection. */
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

/** Retrieve saved survey sessions from the shared collection. */
export async function getAllSurveysFromGlobal(): Promise<FullNapSession[]> {
  try {
    const q = query(collection(db, 'all_surveys'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const sessions: FullNapSession[] = [];
    snapshot.forEach((item) => {
      sessions.push(item.data() as FullNapSession);
    });
    return sessions;
  } catch (err) {
    console.warn('Note: Cloud surveys retrieval skipped:', err);
    return [];
  }
}

/** Delete a survey session from the shared collection. */
export async function deleteSurveyFromGlobal(sessionId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'all_surveys', sessionId));
  } catch (err) {
    console.warn('Note: Cloud survey delete skipped:', err);
  }
}
