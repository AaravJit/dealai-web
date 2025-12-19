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

  const [processing, setProcessing] = useState(true);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      const dest = `/login?next=${encodeURIComponent(`/purchase/success?next=${encodeURIComponent(next)}`)}`;
      router.replace(dest);
    }
  }, [loading, next, router, user]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    let attempts = 0;

    async function checkStatus() {
      if (cancelled) return;
      attempts += 1;
      try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        const isPro = Boolean(snap.data()?.isPro);
        if (isPro) {
          router.replace(next);
          return;
        }
        if (attempts * 1500 >= 45000) {
          setTimedOut(true);
          setProcessing(false);
          return;
        }
      } catch (error) {
        console.error("Polling subscription status failed", error);
      }
      if (!cancelled) {
        setTimeout(checkStatus, 1500);
      }
    }

    checkStatus();
    return () => {
      cancelled = true;
    };
  }, [next, router, user]);

  if (loading || (!user && !timedOut)) {
    return (
      <div className="mx-auto max-w-xl p-6">
        <Card className="p-6">
          <div className="h-5 w-40 rounded-full bg-white/10 animate-pulse" />
          <div className="mt-3 h-4 w-56 rounded-full bg-white/5 animate-pulse" />
        </Card>
      </div>
    );
  }

  if (timedOut) {
    return (
      <div className="mx-auto max-w-xl p-6">
        <Card className="p-6 space-y-3">
          <div className="text-2xl font-black tracking-tight">Payment received</div>
          <div className="text-sm text-white/70">
            We’re still finalizing your subscription. Click refresh or contact support if this persists.
          </div>
          <div className="flex items-center gap-3">
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
      <Card className="p-6 space-y-3">
        <div className="text-2xl font-black tracking-tight">Finalizing your subscription…</div>
        <div className="text-white/70 text-sm">We’re confirming your payment. This usually takes a few seconds.</div>
        {processing ? <div className="h-2 w-full rounded-full bg-white/10 animate-pulse" /> : null}
      </Card>
    </div>
  );
}
