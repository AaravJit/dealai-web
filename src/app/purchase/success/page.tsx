"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, Button } from "@/components/ui";
import { useAuth } from "@/components/AuthProvider";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function PurchaseSuccess() {
  const sp = useSearchParams();
  const router = useRouter();
  const next = useMemo(() => sp.get("next") ?? "/app", [sp]);
  const { user, loading } = useAuth();

  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(
        `/login?next=${encodeURIComponent(
          `/purchase/success?next=${encodeURIComponent(next)}`
        )}`
      );
    }
  }, [loading, next, router, user]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    let attempts = 0;

    async function poll() {
      if (cancelled) return;
      attempts += 1;

      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.data()?.isPro) {
          router.replace(next);
          return;
        }
        if (attempts * 1500 >= 45000) {
          setTimedOut(true);
          return;
        }
      } catch (e) {
        console.error("Polling failed", e);
      }

      if (!cancelled) setTimeout(poll, 1500);
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [next, router, user]);

  if (loading) {
    return (
      <div className="mx-auto max-w-xl p-6">
        <Card className="p-6 animate-pulse">Finalizing…</Card>
      </div>
    );
  }

  if (timedOut) {
    return (
      <div className="mx-auto max-w-xl p-6">
        <Card className="p-6 space-y-3">
          <div className="text-2xl font-black">Payment received</div>
          <div className="text-sm text-white/70">
            We’re still finalizing your subscription.
          </div>
          <div className="flex gap-3">
            <Button onClick={() => router.refresh()}>Refresh</Button>
            <Button href="mailto:support@dealai.app" variant="ghost">
              Contact support
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl p-6">
      <Card className="p-6">
        <div className="text-2xl font-black">Payment successful ✅</div>
        <div className="mt-2 text-sm text-white/70">
          You’re all set. Taking you into the app…
        </div>
      </Card>
    </div>
  );
}
