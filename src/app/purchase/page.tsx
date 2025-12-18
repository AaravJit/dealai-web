"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, Card, Pill } from "@/components/ui";
import { ErrorCard } from "@/components/ErrorCard";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

type PlanKey = "monthly" | "yearly";

export default function PurchasePage() {
  const sp = useSearchParams();
  const next = sp.get("next") ?? "/app";

  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [plan, setPlan] = useState<PlanKey>("monthly");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const plans = useMemo(() => {
    const monthlyId = process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY ?? "";
    const yearlyId = process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY ?? "";
    return {
      monthly: { name: "Pro Monthly", priceText: "$19 / month", priceId: monthlyId },
      yearly: { name: "Pro Yearly", priceText: "$149 / year", priceId: yearlyId },
    };
  }, []);

  async function ensureAuth() {
    if (!email || !pw) throw new Error("Enter email + password.");

    if (mode === "signup") {
      const cred = await createUserWithEmailAndPassword(auth, email, pw);
      return cred.user;
    } else {
      const cred = await signInWithEmailAndPassword(auth, email, pw);
      return cred.user;
    }
  }

  async function startCheckout() {
    setErr(null);
    setLoading(true);

    try {
      const user = await ensureAuth();

      const chosen = plans[plan];
      if (!chosen.priceId) throw new Error("Missing Stripe price ID in .env.local");

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: chosen.priceId,
          uid: user.uid,
          email: user.email,
          next,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.detail ?? data?.error ?? "Checkout failed");
      if (!data?.url) throw new Error("Missing Stripe redirect url");

      window.location.href = data.url;
    } catch (e: any) {
      setErr(e?.message ?? "Purchase failed");
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
          <Pill>Aqua</Pill>
          <Pill>Liquid Glass</Pill>
          <Pill>Secure Checkout</Pill>
        </div>
        <h1 className="mt-5 text-4xl md:text-5xl font-black tracking-tight">Unlock Deal AI</h1>
        <p className="mt-3 text-white/70 max-w-2xl">
          Create an account and checkout in one flow. After payment, you’ll be sent straight into the app.
        </p>
      </div>

      {err ? (
        <div className="mb-6">
          <ErrorCard
            title="Couldn’t start checkout"
            message="Fix the issue and try again."
            details={err}
            onRetry={() => setErr(null)}
            href="/"
            hrefLabel="Back home"
          />
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="text-sm text-white/60">Choose a plan</div>

          <div className="mt-4 grid gap-3">
            {(["monthly", "yearly"] as PlanKey[]).map((k) => {
              const active = k === plan;
              const p = plans[k];
              return (
                <button
                  key={k}
                  onClick={() => setPlan(k)}
                  className={[
                    "w-full text-left rounded-2xl border p-4 transition",
                    active ? "border-cyan-300/40 bg-cyan-300/10" : "border-white/10 bg-white/5 hover:bg-white/7",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-lg font-bold">{p.name}</div>
                      <div className="text-sm text-white/60">
                        {k === "monthly" ? "Best for most users" : "Best value"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-cyan-200">{p.priceText}</div>
                    </div>
                  </div>

                  <ul className="mt-3 space-y-1 text-sm text-white/70">
                    <li>• Unlimited analyses</li>
                    <li>• Deal score + scam flags</li>
                    <li>• Negotiation copy</li>
                  </ul>
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm text-white/60">Account + payment</div>
              <div className="mt-1 text-lg font-bold">{mode === "signup" ? "Create account" : "Sign in"}</div>
            </div>

            <Button variant="ghost" onClick={() => setMode((m) => (m === "signup" ? "login" : "signup"))}>
              {mode === "signup" ? "I already have an account" : "Create a new account"}
            </Button>
          </div>

          <div className="mt-5 space-y-3">
            <div>
              <div className="text-sm text-white/60 mb-1">Email</div>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-cyan-300/40"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <div className="text-sm text-white/60 mb-1">Password</div>
              <input
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                type="password"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-cyan-300/40"
                placeholder="••••••••"
              />
            </div>

            <div className="pt-2">
              <Button onClick={startCheckout} disabled={loading} className="w-full">
                {loading ? "Starting checkout…" : `Continue to Stripe — ${plans[plan].priceText}`}
              </Button>
              <div className="mt-3 text-xs text-white/50">
                You’ll be redirected to Stripe Checkout. Payment details never touch our server.
              </div>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
