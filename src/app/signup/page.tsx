"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthMotion, FieldItem, FieldStagger } from "@/components/auth/AuthMotion";
import { Button, Card, Input } from "@/components/ui";
import { useAuth } from "@/components/AuthProvider";
import { motion } from "framer-motion";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/app";

  const { user, loading: authLoading, signUp, signInWithGoogle } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      router.replace(next);
    }
  }, [authLoading, user, router, next]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    try {
      setLoading(true);
      await signUp(email, password, name || undefined);
      router.replace(next);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Signup failed. Please try again.";
      setErr(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setErr(null);
    try {
      setLoading(true);
      await signInWithGoogle();
      router.replace(next);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Google sign-in failed. Try another method.";
      setErr(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#05070c] px-6 py-12 text-white">
      <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <p className="text-sm uppercase tracking-[0.3em] text-white/50">Get started</p>
            <h1 className="mt-3 text-4xl font-black leading-tight md:text-5xl">Create your account</h1>
            <p className="mt-3 max-w-xl text-white/70">
              Spin up a DealAI workspace in seconds. You can explore the app now and upgrade anytime from the pricing page.
            </p>
          </motion.div>

          <div className="flex flex-wrap gap-3 text-sm text-white/70">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Email + password</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Google sign-up</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Upgrade later</span>
          </div>
        </div>

        <AuthMotion>
          <Card className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">DealAI</p>
                <h2 className="text-2xl font-bold">Create your account</h2>
                <p className="mt-1 text-sm text-white/60">Start analyzing listings instantly.</p>
              </div>
              <div className="rounded-full border border-cyan-300/30 bg-cyan-500/15 px-3 py-1 text-xs text-cyan-100">Secure signup</div>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <FieldStagger>
                <FieldItem>
                  <label className="text-sm">Name</label>
                  <Input
                    className="mt-2"
                    placeholder="Alex Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </FieldItem>

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
                  <label className="text-sm">Password</label>
                  <Input
                    className="mt-2"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                  />
                  <p className="mt-2 text-xs text-white/50">At least 6 characters.</p>
                </FieldItem>

                {err && (
                  <FieldItem>
                    <div className="rounded-xl border border-rose-500/30 bg-rose-500/15 px-4 py-3 text-sm text-rose-50">{err}</div>
                  </FieldItem>
                )}

                <FieldItem>
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? "Creating..." : "Create account"}
                  </Button>
                </FieldItem>
              </FieldStagger>
            </form>

            <div className="mt-4">
              <Button type="button" variant="secondary" className="w-full" onClick={handleGoogle} disabled={loading}>
                Continue with Google
              </Button>
            </div>

            <div className="mt-6 flex flex-col gap-3 text-sm text-white/70 md:flex-row md:items-center md:justify-between">
              <span>
                Already registered?{" "}
                <Link className="text-cyan-200 hover:text-cyan-100" href={`/login?next=${encodeURIComponent(next)}`}>
                  Sign in
                </Link>
              </span>
              <Link className="text-cyan-200 hover:text-cyan-100" href="/pricing">
                View pricing
              </Link>
            </div>
          </Card>
        </AuthMotion>
      </div>
    </main>
  );
}
