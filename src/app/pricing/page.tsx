"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Container, Pill } from "@/components/ui";
import { useAuth } from "@/components/AuthProvider";
import { refreshQuota, type QuotaState } from "@/lib/quota";

type PlanKey = "monthly" | "yearly";

export default function PricingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [plan, setPlan] = useState<PlanKey>("monthly");
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [quota, setQuota] = useState<QuotaState | null>(null);

  useEffect(() => {
    async function load() {
      if (!user) return;
      try {
        const profile = await refreshQuota(user.uid);
        if (profile?.quota) setQuota(profile.quota);
      } catch (error) {
        console.error("Failed to load quota", error);
      }
    }
    load();
  }, [user]);

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

  const remaining = quota ? Math.max(0, quota.uploadsLimit - quota.uploadsUsed) : null;

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
            <Pill>Secure checkout by Stripe</Pill>
            <Pill>Cancel anytime</Pill>
            <Pill>We never store card details</Pill>
          </div>

          <h1 className="mt-4 text-4xl font-black tracking-tight">Choose your plan</h1>
          <p className="mt-2 max-w-2xl text-white/70">
            Free includes 3 uploads per day. Upgrade to Pro for unlimited uploads, priority analysis, and enhanced scam detection.
          </p>

          {err ? (
            <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-rose-50">{err}</div>
          ) : null}

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <Card className="border-white/10 bg-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold">Free</div>
                  <div className="text-sm text-white/60">For quick checks (3 uploads/day)</div>
                </div>
                <div className="text-2xl font-black text-cyan-100">$0</div>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-white/70">
                <li>• 3 uploads per day</li>
                <li>• Deal score + scam flags</li>
                <li>• Timeline saved to your account</li>
              </ul>
              <div className="mt-4 text-sm text-white/60">
                Daily uploads left: {remaining !== null ? `${remaining}/${quota?.uploadsLimit ?? 3}` : "--"}
              </div>
              <div className="mt-4 flex gap-2">
                <Button href="/app/upload" variant="ghost">
                  Continue Free
                </Button>
                <Button href="/purchase" variant="secondary">
                  Purchase later
                </Button>
              </div>
            </Card>

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
                      <div className="text-xs text-white/50">Secure Stripe billing</div>
                    </div>
                  </div>
                  <ul className="mt-4 space-y-2 text-sm text-white/70">
                    <li>• Unlimited analyses</li>
                    <li>• Priority AI + enhanced scam flags</li>
                    <li>• Negotiation guidance + history</li>
                  </ul>
                  <div className="mt-5 flex gap-3">
                    <Button onClick={startCheckout} disabled={submitting || loading}>
                      {submitting ? "Starting checkout…" : "Upgrade to Pro"}
                    </Button>
                    <Button href="/purchase" variant="ghost">
                      View purchase flow
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3 text-sm text-white/70">
            <Card className="p-4">
              <div className="font-semibold">Trust & Safety</div>
              <div className="mt-2">We use Stripe for all payments. Card data never touches our servers.</div>
            </Card>
            <Card className="p-4">
              <div className="font-semibold">Cancel anytime</div>
              <div className="mt-2">Manage or cancel your subscription directly via Stripe’s customer portal.</div>
            </Card>
            <Card className="p-4">
              <div className="font-semibold">Support</div>
              <div className="mt-2">Questions? Reach out and we’ll help get you live quickly.</div>
            </Card>
          </div>
        </section>
      </Container>
    </div>
  );
}
