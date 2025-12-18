"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function register() {
    setError("");
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      router.push("/app");
    } catch (e: any) {
      setError(e?.message ?? "Failed to register");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass w-full max-w-sm rounded-2xl p-6">
        <h1 className="text-2xl font-black">Create account</h1>

        {error && <p className="mt-2 text-sm text-rose-400">{error}</p>}

        <input
          className="mt-4 w-full rounded-xl bg-black/40 border border-white/10 p-2 outline-none focus:border-cyan-300/30"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="mt-2 w-full rounded-xl bg-black/40 border border-white/10 p-2 outline-none focus:border-cyan-300/30"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={register}
          className="mt-4 w-full rounded-xl bg-cyan-500/20 border border-cyan-400/30 py-2 text-sm font-semibold hover:bg-cyan-500/25"
        >
          Register
        </button>

        <p className="mt-4 text-sm text-white/60">
          Already have an account?{" "}
          <a href="/login" className="text-cyan-300 hover:underline">
            Login
          </a>
        </p>
      </div>
    </div>
  );
}
