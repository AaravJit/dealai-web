"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function login() {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/app");
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function google() {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    router.push("/app");
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="glass w-full max-w-sm p-6 rounded-2xl">
        <h1 className="text-2xl font-black">Login</h1>

        {error && <p className="mt-2 text-sm text-rose-400">{error}</p>}

        <input
          className="mt-4 w-full rounded-xl bg-black/40 border border-white/10 p-2"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          className="mt-2 w-full rounded-xl bg-black/40 border border-white/10 p-2"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={login} className="mt-4 w-full rounded-xl bg-cyan-500/20 p-2">
          Login
        </button>

        <button onClick={google} className="mt-2 w-full rounded-xl bg-white/10 p-2">
          Sign in with Google
        </button>

        <p className="mt-4 text-sm text-white/60">
          No account? <a href="/register" className="text-cyan-300">Register</a>
        </p>
      </div>
    </div>
  );
}
