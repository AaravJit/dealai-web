"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, Card, Metric, Pill } from "@/components/ui";
import { saveDeal, type DealDocument } from "@/lib/dealsDb";
import { useAuth } from "@/components/AuthProvider";
import { uploadDealImage } from "@/lib/uploadImage";
import { ErrorCard } from "@/components/ErrorCard";

export default function AnalyzePage() {
  const { user } = useAuth();
  const sp = useSearchParams();

  const [deal, setDeal] = useState<(DealDocument & { imageDataUrl?: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showReasoning, setShowReasoning] = useState(false);

  const img = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    return sessionStorage.getItem("dealai_upload_img") ?? undefined;
  }, []);

  const existingImageUrl = sp.get("imageUrl") ?? undefined;
  const existingDealId = sp.get("dealId") ?? undefined;

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setLoading(true);
        setErr(null);
        setDeal(null);

        const title = sp.get("title") ?? undefined;
        const price = sp.get("price") ? Number(sp.get("price")) : undefined;
        const loc = sp.get("loc") ?? undefined;

        if (!user) throw new Error("Please sign in.");
        if (!img && !existingImageUrl) throw new Error("Upload a screenshot first.");

        let imageUrl = existingImageUrl;
        if (!imageUrl && img) {
          imageUrl = await uploadDealImage(user.uid, img);
        }

        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl, title, sellerPrice: price, location: loc }),
        });

        const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        if (!res.ok) throw new Error(String(data.error ?? "Analyze failed"));

        const analysis: DealDocument["analysis"] = {
          dealScore: typeof data.dealScore === "number" ? data.dealScore : 50,
          marketValue: typeof data.marketValue === "number" ? data.marketValue : 0,
          confidence: (data.confidence as any) ?? "medium",
          condition: (data.condition as any) ?? "good",
          scamFlags: Array.isArray(data.scamFlags) ? data.scamFlags.map(String) : [],
          negotiationMessage:
            typeof data.negotiationMessage === "string"
              ? data.negotiationMessage
              : "Thanks for the listing. Would you consider a small discount?",
          reasoning: Array.isArray(data.reasoning) ? data.reasoning.map(String) : [],
        };

        const doc: DealDocument & { imageDataUrl?: string } = {
          id: existingDealId ?? undefined,
          title: typeof data.title === "string" ? data.title : title ?? "Untitled listing",
          sellerPrice: typeof data.sellerPrice === "number" ? data.sellerPrice : price,
          location: typeof data.location === "string" ? data.location : loc,
          imageUrl,
          analysis,
          imageDataUrl: img,
        };

        const id = await saveDeal(user.uid, doc);
        doc.id = id;

        if (!cancelled) {
          setDeal(doc);
          setLoading(false);
          sessionStorage.removeItem("dealai_upload_img");
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setErr(e instanceof Error ? e.message : "Analyze failed");
          setLoading(false);
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [existingDealId, existingImageUrl, img, sp, user]);

  async function onSave() {
    if (!deal || !user) return;
    try {
      setSaving(true);
      const { imageDataUrl: _omit, ...rest } = deal;
      await saveDeal(user.uid, rest);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Card>Analyzing…</Card>;
  if (err) return <ErrorCard title="Analysis failed" message={err} />;

  if (!deal) {
    return <ErrorCard title="Nothing to analyze" message="Upload a listing first." />;
  }

  return (
    <Card>
      <div className="text-2xl font-black">{deal.title}</div>
      <div className="mt-3 grid grid-cols-4 gap-4">
        <Metric label="Score" value={`${deal.analysis.dealScore}/100`} />
        <Metric label="Price" value={deal.sellerPrice ? `$${deal.sellerPrice}` : "Unknown"} />
        <Metric label="Market" value={`$${deal.analysis.marketValue}`} />
        <Metric label="Confidence" value={deal.analysis.confidence} />
      </div>

      <Button className="mt-4" onClick={onSave} disabled={saving}>
        {saving ? "Saving…" : "Save"}
      </Button>
    </Card>
  );
}
