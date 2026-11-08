import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
} from 'firebase/auth';
import {
  auth,
  googleProvider,
  getUserProfile,
  saveUserProfile,
  UserProfileData,
  testConnection,
  setCachedAccessToken,
  getCachedAccessToken,
} from '../firebase';

interface AuthContextType {
  user: User | null;
  profile: UserProfileData | null;
  accessToken: string | null;
  loading: boolean;
  loginWithGoogle: () => Promise<string | null>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (
    email: string,
    pass: string,
    name: string,
    studentId?: string,
    className?: string
  ) => Promise<void>;
  updateProfileInfo: (updates: Partial<UserProfileData>) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  requestGoogleAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(getCachedAccessToken());
  const [loading, setLoading] = useState<boolean>(true);

  // Test connection on boot
  useEffect(() => {
    testConnection();
  }, []);

  const loadUserProfile = async (currentUser: User) => {
    try {
      let prof = await getUserProfile(currentUser.uid);
      if (!prof) {
        // Auto-create initial profile
        prof = {
          uid: currentUser.uid,
          displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Học sinh',
          email: currentUser.email || '',
          studentId: '',
          className: '',
          photoURL: currentUser.photoURL || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await saveUserProfile(prof);
      }
      setProfile(prof);
    } catch (err) {
      console.error('Failed to load user profile:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await loadUserProfile(currentUser);
      } else {
        setProfile(null);
        setAccessToken(null);
        setCachedAccessToken(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async (): Promise<string | null> => {
    const cred = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(cred);
    const token = credential?.accessToken || null;
    setAccessToken(token);
    setCachedAccessToken(token);
    if (cred.user) {
      await loadUserProfile(cred.user);
    }
    return token;
  };

  const requestGoogleAccessToken = async (): Promise<string | null> => {
    const currentCached = getCachedAccessToken();
    if (currentCached) {
      setAccessToken(currentCached);
      return currentCached;
    }
    return await loginWithGoogle();
  };

  const loginWithEmail = async (email: string, pass: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    if (cred.user) {
      await loadUserProfile(cred.user);
    }
  };

  const registerWithEmail = async (
    email: string,
    pass: string,
    name: string,
    studentId?: string,
    className?: string
  ) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (cred.user) {
      await updateProfile(cred.user, { displayName: name });
      const newProfile: UserProfileData = {
        uid: cred.user.uid,
        displayName: name,
        email: email,
        studentId: studentId || '',
        className: className || '',
        photoURL: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveUserProfile(newProfile);
      setProfile(newProfile);
    }
  };

  const updateProfileInfo = async (updates: Partial<UserProfileData>) => {
    if (!user) return;
    await saveUserProfile({
      ...updates,
      uid: user.uid,
      email: user.email || '',
    });
    const updated = await getUserProfile(user.uid);
    setProfile(updated);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
    setAccessToken(null);
    setCachedAccessToken(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await loadUserProfile(user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        accessToken,
        loading,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        updateProfileInfo,
        logout,
        refreshProfile,
        requestGoogleAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
