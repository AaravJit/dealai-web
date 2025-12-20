"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  updateProfile,
  User,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { stripUndefinedDeep } from "@/lib/firestoreClean";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { motion } from "framer-motion";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string, remember?: boolean) => Promise<User>;
  signUp: (email: string, password: string, displayName?: string, remember?: boolean) => Promise<User>;
  signInWithGoogle: (remember?: boolean) => Promise<User>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signIn: async () => {
    throw new Error("AuthProvider not ready");
  },
  signUp: async () => {
    throw new Error("AuthProvider not ready");
  },
  signInWithGoogle: async () => {
    throw new Error("AuthProvider not ready");
  },
  signOut: async () => {
    throw new Error("AuthProvider not ready");
  },
});

async function ensureUserDocument(user: User) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  const wasPro = Boolean(snap.data()?.isPro || snap.data()?.plan === "pro");
  const basePlan = snap.exists() && wasPro ? "pro" : "free";
  const todayValue = today();

  await setDoc(
    ref,
    stripUndefinedDeep({
      uid: user.uid,
      email: user.email ?? "",
      displayName: user.displayName ?? "",
      photoURL: user.photoURL ?? "",
      createdAt: snap.exists() ? snap.data()?.createdAt ?? serverTimestamp() : serverTimestamp(),
      plan: snap.exists() ? snap.data()?.plan ?? basePlan : "free",
      isPro: wasPro,
      quota: {
        day: snap.data()?.quota?.day ?? todayValue,
        uploadsUsed: snap.data()?.quota?.uploadsUsed ?? 0,
        uploadsLimit: snap.data()?.quota?.uploadsLimit ?? (wasPro ? 10000 : 3),
      },
      updatedAt: serverTimestamp(),
    }),
    { merge: true }
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function applyPersistence(remember?: boolean) {
    try {
      await setPersistence(auth, remember === false ? browserSessionPersistence : browserLocalPersistence);
    } catch (error) {
      console.error("Failed to set auth persistence", error);
    }
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          await ensureUserDocument(u);
        } catch (error) {
          console.error("Failed to sync user document", error);
        }
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const api = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      async signIn(email, password, remember = true) {
        await applyPersistence(remember);
        const cred = await signInWithEmailAndPassword(auth, email, password);
        await ensureUserDocument(cred.user);
        return cred.user;
      },
      async signUp(email, password, displayName, remember = true) {
        await applyPersistence(remember);
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (displayName) {
          await updateProfile(cred.user, { displayName });
        }
        await ensureUserDocument(cred.user);
        return cred.user;
      },
      async signInWithGoogle(remember = true) {
        await applyPersistence(remember);
        const provider = new GoogleAuthProvider();
        const cred = await signInWithPopup(auth, provider);
        await ensureUserDocument(cred.user);
        return cred.user;
      },
      async signOut() {
        await firebaseSignOut(auth);
      },
    }),
    [loading, user]
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#05070c] px-6 text-white">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass glow w-full max-w-md rounded-3xl p-6"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white/10 animate-pulse" />
            <div>
              <div className="h-4 w-40 rounded-full bg-white/10 animate-pulse" />
              <div className="mt-2 h-3 w-28 rounded-full bg-white/5 animate-pulse" />
            </div>
          </div>
          <div className="mt-6 space-y-3">
            <div className="h-10 rounded-2xl bg-white/5 animate-pulse" />
            <div className="h-10 rounded-2xl bg-white/5 animate-pulse" />
            <div className="h-10 rounded-2xl bg-white/5 animate-pulse" />
          </div>
        </motion.div>
      </div>
    );
  }

  return <AuthContext.Provider value={api}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
