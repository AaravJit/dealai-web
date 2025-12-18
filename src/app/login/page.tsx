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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/app";

  const { user, loading: authLoading, signIn, signInWithGoogle } = useAuth();
  const busy = submitting || authLoading;

  useEffect(() => {
    if (!authLoading && user) router.replace(next);
  }, [authLoading, user, router, next]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMessage(null);

    try {
      setSubmitting(true);
      await signIn(email, password);
      router.replace(next);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Login failed. Please try again.";
      setErr(msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle() {
    setErr(null);
    setMessage(null);

    try {
      setSubmitting(true);
      await signInWithGoogle();
      router.replace(next);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Google sign-in failed. Try again.";
      setErr(msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleForgotPassword() {
    setErr(null);
    setMessage(null);
    try {
      if (!email) throw new Error("Enter your email first to reset your password.");
      await sendPasswordResetEmail(auth, email);
      setMessage("Reset link sent. Check your inbox.");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unable to send reset email.";
      setErr(msg);
    }
  }

  return (
    <main className="min-h-screen bg-[#05070c] text-white px-6 py-12">
      <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <p className="text-sm uppercase tracking-[0.3em] text-white/50">Sign in</p>
            <h1 className="mt-3 text-4xl font-black leading-tight md:text-5xl">Welcome back</h1>
            <p className="mt-3 max-w-xl text-white/70">
              Sign in to access your DealAI workspace — analyze listings, keep a timeline, and stay synced.
            </p>
          </motion.div>

          <div className="grid max-w-xl grid-cols-2 gap-3">
            {["Secure Firebase Auth", "Google sign-in", "Glass UI", "Fast redirects"].map((pill) => (
              <motion.div
                key={pill}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.05 }}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 shadow-lg shadow-cyan-500/5"
              >
                {pill}
              </motion.div>
            ))}
          </div>
        </div>

        <AuthMotion>
          <Card className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">DealAI</p>
                <h2 className="text-2xl font-bold">Sign in</h2>
                <p className="mt-1 text-sm text-white/60">Use your email or Google.</p>
              </div>
              <div className="rounded-full border border-cyan-300/30 bg-cyan-500/15 px-3 py-1 text-xs text-cyan-100">
                Secure
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <FieldStagger>
                <FieldItem>
                  <label className="text-sm">Email</label>
                  <Input
                    className="mt-2"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="you@example.com"
                  />
                </FieldItem>

                <FieldItem>
                  <div className="flex items-center justify-between text-sm">
                    <label>Password</label>
                    <button type="button" onClick={handleForgotPassword} className="text-cyan-200 hover:text-cyan-100">
                      Forgot password?
                    </button>
                  </div>
                  <Input
                    className="mt-2"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    autoComplete="current-password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                  />
                </FieldItem>

                {err && (
                  <FieldItem>
                    <div className="rounded-xl border border-rose-500/30 bg-rose-500/15 px-4 py-3 text-sm text-rose-50">
                      {err}
                    </div>
                  </FieldItem>
                )}

                {message && (
                  <FieldItem>
                    <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-50">
                      {message}
                    </div>
                  </FieldItem>
                )}

                <FieldItem>
                  <Button type="submit" disabled={busy} className="w-full">
                    {busy ? "Signing in..." : "Sign in"}
                  </Button>
                </FieldItem>
              </FieldStagger>
            </form>

            <div className="mt-4">
              <Button type="button" variant="secondary" className="w-full" onClick={handleGoogle} disabled={busy}>
                Continue with Google
              </Button>
            </div>

            <div className="mt-6 flex items-center justify-between text-sm text-white/70">
              <span>
                New here?{" "}
                <Link className="text-cyan-200 hover:text-cyan-100" href={`/signup?next=${encodeURIComponent(next)}`}>
                  Create an account
                </Link>
              </span>
              <Link className="text-cyan-200 hover:text-cyan-100" href="/privacy">
                Privacy
              </Link>
            </div>
          </Card>
        </AuthMotion>
      </div>
    </main>
  );
}
