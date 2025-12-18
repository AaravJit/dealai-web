"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui";

export default function PurchaseSuccess() {
  const sp = useSearchParams();
  const router = useRouter();
  const next = sp.get("next") ?? "/app";

  useEffect(() => {
    const t = setTimeout(() => router.replace(next), 900);
    return () => clearTimeout(t);
  }, [next, router]);

  return (
    <div className="mx-auto max-w-xl p-6">
      <Card className="p-6">
        <div className="text-2xl font-black tracking-tight">Payment successful ✅</div>
        <div className="mt-2 text-white/70 text-sm">You’re all set with DealAI Pro. Taking you into the app…</div>
      </Card>
    </div>
  );
}
