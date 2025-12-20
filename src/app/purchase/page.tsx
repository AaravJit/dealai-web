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
      router.replace(
        `/login?next=${encodeURIComponent(
          `/purchase?next=${encodeURIComponent(next)}`
        )}`
      );
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
        if (!cancelled) setProfile(p);
      } catch (e) {
        console.error("Failed to load profile", e);
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
    if (!user) return;

    try {
      setSubmitting(true);
      await refreshQuota(user.uid); // ensure profile exists

      const chosen = plans[plan];
      if (!chosen.priceId) {
        throw new Error("Missing Stripe price ID in .env.local");
      }

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
      if (!res.ok) {
        throw new Error(data?.detail ?? data?.error ?? "Checkout failed");
      }
      if (!data?.url) {
        throw new Error("Missing Stripe redirect URL");
      }

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
          <Button
            className="mt-4"
            href={`/login?next=${encodeURIComponent(
              `/purchase?next=${encodeURIComponent(next)}`
            )}`}
          >
            Go to login
          </Button>
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
        <h1 className="mt-5 text-4xl md:text-5xl font-black">
          Purchase DealAI Pro
        </h1>
        <p className="mt-3 max-w-2xl text-white/70">
          Complete checkout with Stripe to unlock unlimited analyses.
        </p>
      </div>

      {err && (
        <div className="mb-6">
          <ErrorCard
            title="Couldn’t start checkout"
            message="Fix the issue and try again."
            details={err}
            onRetry={() => setErr(null)}
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-6">
          <div className="text-sm text-white/60">Choose a plan</div>

          <div className="mt-4 grid gap-3">
            {(Object.keys(plans) as PlanKey[]).map((k) => {
              const p = plans[k];
              const active = k === plan;
              return (
                <button
                  key={k}
                  onClick={() => setPlan(k)}
                  className={[
                    "w-full rounded-2xl border p-4 text-left transition",
                    active
                      ? "border-cyan-300/40 bg-cyan-300/10"
                      : "border-white/10 bg-white/5 hover:bg-white/7",
                  ].join(" ")}
                >
                  <div className="flex justify-between gap-4">
                    <div>
                      <div className="text-lg font-bold">{p.name}</div>
                      <div className="text-sm text-white/60">
                        {k === "monthly" ? "Best for most users" : "Best value"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-cyan-200">
                        {p.priceText}
                      </div>
                      <div className="text-xs text-white/60">
                        Secure checkout by Stripe
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-sm text-white/60">Account</div>
          <div className="mt-1 text-lg font-bold">{user.email}</div>
          <div className="mt-1 text-xs text-white/60">
            We’ll keep you signed in after checkout.
          </div>

          <div className="mt-6">
            <Button
              onClick={startCheckout}
              disabled={submitting || loading}
              className="w-full"
            >
              {submitting
                ? "Starting checkout…"
                : `Continue to Stripe — ${plans[plan].priceText}`}
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
}
