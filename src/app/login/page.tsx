"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthMotion, FieldItem, FieldStagger } from "@/components/auth/AuthMotion";
import { Button, Card } from "@/components/ui";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase"; // adjust if needed

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "/app";
    } catch (error: any) {
      setErr(error?.message ?? "Failed to log in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-16">
      <div className="mx-auto max-w-md">
        <AuthMotion>
          <Card className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_20px_80px_rgba(0,0,0,0.6)] p-6">
            <h1 className="text-3xl font-black tracking-tight">Welcome back</h1>
            <p className="mt-2 text-white/60">Log in to continue.</p>

            <form onSubmit={onLogin} className="mt-6">
              <FieldStagger>
                <FieldItem>
                  <label className="text-sm text-white/70">Email</label>
                  <input
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-cyan-300/50"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    autoComplete="email"
                    required
                  />
                </FieldItem>

                <FieldItem>
                  <label className="text-sm text-white/70">Password</label>
                  <input
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-cyan-300/50"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    autoComplete="current-password"
                    required
                  />
                </FieldItem>

                {err && (
                  <FieldItem>
                    <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                      {err}
                    </div>
                  </FieldItem>
                )}

                <FieldItem>
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? "Logging in..." : "Log in"}
                  </Button>

                  <div className="mt-4 text-sm text-white/60">
                    Don&apos;t have an account?{" "}
                    <Link className="text-cyan-300 hover:text-cyan-200" href="/register">
                      Create one
                    </Link>
                  </div>
                </FieldItem>
              </FieldStagger>
            </form>
          </Card>
        </AuthMotion>
      </div>
    </main>
  );
}
