"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthMotion, FieldItem, FieldStagger } from "@/components/auth/AuthMotion";
import { Button, Card } from "@/components/ui";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase"; // adjust if your auth export name differs

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onRegister(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!agree) {
      setErr("You must agree to the Terms and Privacy Policy to create an account.");
      return;
    }

    try {
      setLoading(true);
      await createUserWithEmailAndPassword(auth, email, password);
      // redirect wherever your app goes next
      window.location.href = "/app";
    } catch (error: any) {
      setErr(error?.message ?? "Failed to create account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-16">
      <div className="mx-auto max-w-md">
        <AuthMotion>
          <Card className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_20px_80px_rgba(0,0,0,0.6)] p-6">
            <h1 className="text-3xl font-black tracking-tight">Create account</h1>
            <p className="mt-2 text-white/60">
              Start analyzing listings in seconds.
            </p>

            <form onSubmit={onRegister} className="mt-6">
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
                    autoComplete="new-password"
                    required
                    minLength={6}
                  />
                  <div className="mt-2 text-xs text-white/50">
                    Minimum 6 characters.
                  </div>
                </FieldItem>

                <FieldItem>
                  <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
                    <input
                      type="checkbox"
                      checked={agree}
                      onChange={(e) => setAgree(e.target.checked)}
                      className="mt-1 h-4 w-4 accent-cyan-300"
                    />
                    <span className="text-sm text-white/70 leading-relaxed">
                      I agree to the{" "}
                      <Link className="text-cyan-300 hover:text-cyan-200 underline underline-offset-2" href="/terms">
                        Terms & Conditions
                      </Link>{" "}
                      and{" "}
                      <Link className="text-cyan-300 hover:text-cyan-200 underline underline-offset-2" href="/privacy">
                        Privacy Policy
                      </Link>
                      .
                    </span>
                  </label>
                </FieldItem>

                {err && (
                  <FieldItem>
                    <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                      {err}
                    </div>
                  </FieldItem>
                )}

                <FieldItem>
                  <Button
                    type="submit"
                    disabled={loading || !agree}
                    className="w-full"
                  >
                    {loading ? "Creating..." : "Create account"}
                  </Button>

                  <div className="mt-4 text-sm text-white/60">
                    Already have an account?{" "}
                    <Link className="text-cyan-300 hover:text-cyan-200" href="/login">
                      Log in
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
