"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button, Card, Pill } from "@/components/ui";
import { ErrorCard } from "@/components/ErrorCard";
import { useAuth } from "@/components/AuthProvider";
import { refreshQuota, type UserProfile } from "@/lib/quota";

type PlanKey = "monthly" | "yearly";

export default function PurchasePage() {
  const sp = useSearchParams();
  const router = useRouter();
  const next = sp.get("next") ?? "/app";
  const { user, loading } = useAuth();

  const [plan, setPlan] = useState<PlanKey>("monthly");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(`/purchase?next=${encodeURIComponent(next)}`)}`);
    }
  }, [loading, next, router, user]);

  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      if (!user) {
        setProfile(null);
        setProfileLoading(false);
        return;
      }
      setProfileLoading(true);
      try {
        const p = await refreshQuota(user.uid);
        if (!cancelled) {
          setProfile(p);
        }
      } catch (error) {
        console.error("Failed to load profile for purchase", error);
        if (!cancelled) setErr("Unable to load profile. Please retry.");
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    }
    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (profile?.isPro && !redirecting) {
      setRedirecting(true);
      router.replace(next);
    }
  }, [next, profile?.isPro, redirecting, router]);

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
    if (!user || profileLoading) return;

    try {
      setSubmitting(true);
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
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Purchase failed");
      setSubmitting(false);
    }
  }

  if (loading || profileLoading) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          {[0, 1].map((i) => (
            <Card key={i} className="p-6">
              <div className="h-4 w-32 rounded-full bg-white/10 animate-pulse" />
              <div className="mt-4 space-y-3">
                <div className="h-12 rounded-2xl bg-white/5 animate-pulse" />
                <div className="h-12 rounded-2xl bg-white/5 animate-pulse" />
                <div className="h-12 rounded-2xl bg-white/5 animate-pulse" />
              </div>
            </Card>
          ))}
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-12">
        <Card className="p-6">
          <div className="text-xl font-bold">Please sign in</div>
          <p className="mt-2 text-white/70">Sign in to continue to checkout.</p>
          <div className="mt-4">
            <Button href={`/login?next=${encodeURIComponent(`/purchase?next=${encodeURIComponent(next)}`)}`}>Go to login</Button>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
          <Pill>Secure Stripe</Pill>
          <Pill>Unlimited uploads</Pill>
          <Pill>Cancel anytime</Pill>
        </div>
        <h1 className="mt-5 text-4xl md:text-5xl font-black tracking-tight">Purchase DealAI Pro</h1>
        <p className="mt-3 text-white/70 max-w-2xl">
          Complete checkout with Stripe to unlock unlimited analyses and priority scam detection. You’ll return to the app
          automatically.
        </p>
      </div>

      {err ? (
        <div className="mb-6">
          <ErrorCard
            title="Couldn’t start checkout"
            message="Fix the issue and try again."
            details={err}
            onRetry={() => setErr(null)}
            href="/pricing"
            hrefLabel="Back to pricing"
          />
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
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
                      <div className="text-sm text-white/60">{k === "monthly" ? "Best for most users" : "Best value"}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-cyan-200">{p.priceText}</div>
                      <div className="text-xs text-white/60">Secure checkout by Stripe</div>
                    </div>
                  </div>

                  <ul className="mt-3 space-y-1 text-sm text-white/70">
                    <li>• Unlimited analyses</li>
                    <li>• Priority AI + scam detection</li>
                    <li>• Negotiation copy & history</li>
                  </ul>
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm text-white/60">Account</div>
              <div className="mt-1 text-lg font-bold">{user?.email || "Loading"}</div>
              <div className="mt-1 inline-flex items-center gap-2 text-xs text-white/60">
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] uppercase tracking-[0.14em]">
                  {profile?.plan === "pro" || profile?.isPro ? "Pro" : "Free"}
                </span>
                <span>We’ll keep you signed in after checkout.</span>
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
              <div className="font-semibold text-white">What you get</div>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li>Unlimited uploads per day</li>
                <li>Priority analysis with enhanced scam flags</li>
                <li>Negotiation messaging and saved timeline</li>
              </ul>
              <div className="mt-2 text-xs text-white/60">Card details are handled by Stripe. You can cancel anytime.</div>
            </div>

            <div className="pt-2">
              <Button onClick={startCheckout} disabled={submitting || loading} className="w-full">
                {submitting ? "Starting checkout…" : `Continue to Stripe — ${plans[plan].priceText}`}
              </Button>
              <div className="mt-3 text-xs text-white/50">
                By continuing you agree to our terms. You’ll be redirected to Stripe Checkout and back to DealAI once payment
                completes.
              </div>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
