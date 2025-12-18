"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Container, Pill } from "@/components/ui";
import { useAuth } from "@/components/AuthProvider";

type PlanKey = "monthly" | "yearly";

export default function PricingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [plan, setPlan] = useState<PlanKey>("monthly");
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const plans = useMemo(() => {
    const monthlyId = process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY ?? "";
    const yearlyId = process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY ?? "";
    return {
      monthly: { name: "Pro Monthly", priceText: "$19 / month", priceId: monthlyId },
      yearly: { name: "Pro Yearly", priceText: "$149 / year", priceId: yearlyId },
    };
  }, []);

  async function startCheckout() {
    setErr(null);

    if (!user) {
      router.push(`/login?next=${encodeURIComponent("/pricing")}`);
      return;
    }

    try {
      setSubmitting(true);
      const chosen = plans[plan];
      if (!chosen.priceId) throw new Error("Missing Stripe price ID");

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: chosen.priceId,
          uid: user.uid,
          email: user.email,
          next: "/app",
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.detail ?? data?.error ?? "Checkout failed");
      if (!data?.url) throw new Error("Missing Stripe redirect url");

      window.location.href = data.url;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Checkout failed";
      setErr(message);
      setSubmitting(false);
    }
  }

  return (
    <div>
      <header className="border-b border-white/10 bg-zinc-950/60 backdrop-blur">
        <Container>
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-cyan-400/20 border border-cyan-300/25" />
              <div className="font-black tracking-tight">DealAI</div>
            </div>
            <div className="flex items-center gap-2">
              <Button href="/app" variant="ghost">App</Button>
              <Button href={user ? "/app" : "/login"} variant="secondary">
                {user ? "Dashboard" : "Login"}
              </Button>
            </div>
          </div>
        </Container>
      </header>

      <Container>
        <section className="py-12">
          <div className="flex items-center gap-2">
            <Pill>Simple</Pill>
            <Pill>No Mac needed</Pill>
          </div>

          <h1 className="mt-4 text-4xl font-black tracking-tight">Choose your plan</h1>
          <p className="mt-2 max-w-2xl text-white/70">
            Sign up or log in, then start checkout to unlock DealAI Pro. You’ll be redirected back to the app after Stripe.
          </p>

          {err ? (
            <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-rose-50">{err}</div>
          ) : null}

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {(["monthly", "yearly"] as PlanKey[]).map((k) => {
              const active = k === plan;
              const p = plans[k];
              return (
                <Card
                  key={k}
                  className={`cursor-pointer border transition ${
                    active ? "border-cyan-300/40 bg-cyan-300/10" : "border-white/10 bg-white/5 hover:border-white/20"
                  }`}
                  onClick={() => setPlan(k)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-lg font-bold">{p.name}</div>
                      <div className="text-sm text-white/60">{k === "monthly" ? "Best for trying DealAI" : "Best value"}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-cyan-100">{p.priceText}</div>
                    </div>
                  </div>
                  <ul className="mt-4 space-y-2 text-sm text-white/70">
                    <li>• Unlimited analyses</li>
                    <li>• Deal score + scam flags</li>
                    <li>• Negotiation copy</li>
                  </ul>
                </Card>
              );
            })}
          </div>

          <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-white/70">
              {user
                ? "You’re signed in. Choose a plan and continue to secure Stripe Checkout."
                : "Log in or create an account first, then start checkout."}
            </div>
            <div className="flex gap-3">
              {!user && !loading ? (
                <Button href={`/login?next=${encodeURIComponent("/pricing")}`} variant="ghost">
                  Log in
                </Button>
              ) : null}
              <Button onClick={startCheckout} disabled={submitting || loading}>
                {submitting ? "Starting checkout…" : "Continue to Stripe"}
              </Button>
            </div>
          </div>
        </section>
      </Container>
    </div>
  );
}
