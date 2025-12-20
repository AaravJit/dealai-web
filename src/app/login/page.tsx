"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthMotion, FieldItem, FieldStagger } from "@/components/auth/AuthMotion";
import { Button, Card, Input } from "@/components/ui";
import { motion } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/app";

  const { user, loading: authLoading, signIn, signUp, signInWithGoogle } = useAuth();
  const busy = loading || authLoading;

  useEffect(() => {
    if (!authLoading && user) router.replace(next);
  }, [authLoading, user, router, next]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMessage(null);

    try {
      setLoading(true);
      if (mode === "login") {
        await signIn(email, password);
      } else {
        await signUp(email, password, name || undefined);
      }
      router.replace(next);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    try {
      setLoading(true);
      await signInWithGoogle();
      router.replace(next);
    } catch {
      setErr("Google sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    try {
      if (!email) throw new Error("Enter your email first.");
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email sent.");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Reset failed");
    }
  }

  return (
    <main className="min-h-screen bg-[#05070c] text-white px-6 py-12">
      <div className="mx-auto max-w-5xl grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-5xl font-black">DealAI</h1>
          <p className="mt-3 text-white/70">
            Sign in to analyze listings and save deals.
          </p>
        </motion.div>

        <AuthMotion>
          <Card className="p-8 rounded-3xl">
            <form onSubmit={handleSubmit} className="space-y-4">
              <FieldStagger>
                {mode === "signup" && (
                  <FieldItem>
                    <Input
                      placeholder="Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </FieldItem>
                )}

                <FieldItem>
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </FieldItem>

                <FieldItem>
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </FieldItem>

                {err && <div className="text-rose-400 text-sm">{err}</div>}
                {message && <div className="text-emerald-400 text-sm">{message}</div>}

                <Button type="submit" disabled={busy}>
                  {busy ? "Working…" : mode === "login" ? "Login" : "Create account"}
                </Button>
              </FieldStagger>
            </form>

            <Button variant="secondary" onClick={handleGoogle} className="mt-4 w-full">
              Continue with Google
            </Button>

            <div className="mt-4 flex justify-between text-sm">
              <button onClick={() => setMode(mode === "login" ? "signup" : "login")}>
                {mode === "login" ? "Create account" : "Back to login"}
              </button>
              <button onClick={handleForgotPassword}>Forgot password?</button>
            </div>
          </Card>
        </AuthMotion>
      </div>
    </main>
  );
}
