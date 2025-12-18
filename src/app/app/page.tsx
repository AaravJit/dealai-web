"use client";

import { useEffect, useState } from "react";
import { Card, Metric, Button } from "@/components/ui";
import { useAuth } from "@/components/AuthProvider";
import { listDeals } from "@/lib/dealsDb";
import { refreshQuota, type QuotaState } from "@/lib/quota";

export default function AppHome() {
  const { user } = useAuth();
  const [timelineCount, setTimelineCount] = useState(0);
  const [quota, setQuota] = useState<QuotaState | null>(null);

  useEffect(() => {
    async function load() {
      if (!user) return;
      try {
        const [deals, profile] = await Promise.all([listDeals(user.uid), refreshQuota(user.uid)]);
        setTimelineCount(deals.length);
        if (profile?.quota) setQuota(profile.quota);
      } catch (error) {
        console.error("Failed to load dashboard state", error);
      }
    }
    load();
  }, [user]);

  const remaining = quota ? Math.max(0, quota.uploadsLimit - quota.uploadsUsed) : null;

  return (
    <div className="space-y-6">
      <Card>
        <div className="text-2xl font-black tracking-tight">Welcome to DealAI</div>
        <div className="mt-2 text-white/70">
          Upload a listing screenshot and get deal score, market value, scam flags, and negotiation copy.
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button href="/app/upload">Upload Screenshot</Button>
          <Button href="/pricing" variant="secondary">See pricing</Button>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Saved to Timeline" value={`${timelineCount}`} />
        <Metric
          label="Daily uploads left"
          value={remaining !== null ? `${remaining}/${quota?.uploadsLimit ?? 3}` : "--"}
        />
        <Metric label="Status" value="Secure + Stripe-ready" />
      </div>

      <Card>
        <div className="text-sm font-semibold">Next steps</div>
        <div className="mt-2 text-sm text-white/70">
          Upload a deal, analyze it, then save to your timeline. Upgrade to Pro for unlimited uploads and faster analysis.
        </div>
      </Card>
    </div>
  );
}
