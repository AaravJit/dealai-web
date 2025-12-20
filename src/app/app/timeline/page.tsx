"use client";
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useState } from "react";
import { Button, Card, Pill } from "@/components/ui";
import { useAuth } from "@/components/AuthProvider";
import { listDeals, refreshDealAnalysis, type DealDocument } from "@/lib/dealsDb";
import { ErrorCard } from "@/components/ErrorCard";

export default function TimelinePage() {
  const { user } = useAuth();
  const [items, setItems] = useState<DealDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reAnalyzing, setReAnalyzing] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listDeals(user.uid);
      setItems(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load timeline");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleReanalyze(deal: DealDocument) {
    if (!user || !deal.id) return;
    setReAnalyzing(deal.id);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: deal.title,
          sellerPrice: deal.sellerPrice,
          location: deal.location,
          imageUrl: deal.imageUrl,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        throw new Error(
          (typeof data.error === "string" && data.error) || "Re-analyze failed"
        );
      }

      const analysis: DealDocument["analysis"] = {
        dealScore: typeof data.dealScore === "number" ? data.dealScore : 50,
        marketValue: typeof data.marketValue === "number" ? data.marketValue : 0,
        confidence: (data.confidence as any) ?? "medium",
        condition: (data.condition as any) ?? "good",
        scamFlags: Array.isArray(data.scamFlags) ? data.scamFlags.map(String) : [],
        negotiationMessage:
          typeof data.negotiationMessage === "string"
            ? data.negotiationMessage
            : "Updated negotiation guidance ready.",
        reasoning: Array.isArray(data.reasoning) ? data.reasoning.map(String) : [],
      };

      await refreshDealAnalysis(user.uid, deal.id, analysis);
      await refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Re-analyze failed");
    } finally {
      setReAnalyzing(null);
    }
  }

  if (!user) return <Card>Please log in to view your timeline.</Card>;
  if (loading) return <Card>Loading timeline…</Card>;

  if (error) {
    return (
      <ErrorCard
        title="Timeline unavailable"
        message="We couldn’t load your saved deals."
        details={error}
        onRetry={refresh}
      />
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <div>No saved deals yet.</div>
        <Button href="/app/upload" className="mt-4">
          Upload a screenshot
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex justify-between">
          <div>
            <div className="text-2xl font-black">Timeline</div>
            <div className="text-sm text-white/70">Your saved deals</div>
          </div>
          <Button onClick={refresh} variant="secondary">
            Refresh
          </Button>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {items.map((d) => (
          <Card key={d.id} className="overflow-hidden p-0">
            {d.imageUrl && (
              <img src={d.imageUrl} alt="" className="h-48 w-full object-cover" />
            )}

            <div className="space-y-2 p-5">
              <div className="font-black">{d.title || "Untitled listing"}</div>

              <div className="mt-2 flex flex-wrap gap-2">
                <Pill>Score {d.analysis.dealScore}</Pill>
                {d.sellerPrice && <Pill>${d.sellerPrice.toLocaleString()}</Pill>}
                <Pill>MV ${d.analysis.marketValue.toLocaleString()}</Pill>
              </div>

              <div className="text-xs text-white/60">
                {d.analysis.negotiationMessage}
              </div>

              <Button
                onClick={() => handleReanalyze(d)}
                variant="secondary"
                className="mt-4"
                disabled={reAnalyzing === d.id}
              >
                {reAnalyzing === d.id ? "Re-analyzing…" : "Re-analyze"}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
