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
      setLoading(true);
      setErr(null);
      setDeal(null);

      try {
        const title = sp.get("title") ?? undefined;
        const price = sp.get("price") ? Number(sp.get("price")) : undefined;
        const loc = sp.get("loc") ?? undefined;

        if (!img && !existingImageUrl) throw new Error("Upload a screenshot first.");
        if (!user) throw new Error("Please sign in to analyze.");

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
        if (!res.ok)
          throw new Error(
            (typeof data.detail === "string" && data.detail) || (typeof data.error === "string" && data.error) || "Analyze failed"
          );

        const analysis = {
          dealScore: typeof data.dealScore === "number" ? data.dealScore : 50,
          marketValue: typeof data.marketValue === "number" ? data.marketValue : 0,
          confidence: data.confidence ?? "medium",
          condition: data.condition ?? "good",
          scamFlags: Array.isArray(data.scamFlags) ? data.scamFlags.map(String) : [],
          negotiationMessage: data.negotiationMessage ?? "Thanks for the listing. Would you consider a small discount today?",
          reasoning: Array.isArray(data.reasoning) ? data.reasoning.map(String) : [],
        } as DealDocument["analysis"];

        const doc: DealDocument & { imageDataUrl?: string } = {
          id: existingDealId ?? undefined,
          title: data.title ?? title ?? "Untitled listing",
          sellerPrice: typeof data.sellerPrice === "number" ? data.sellerPrice : price,
          location: data.location ?? loc ?? "Unknown",
          imageUrl,
          analysis,
          imageDataUrl: img,
        };

        const id = await saveDeal(user.uid, doc);
        doc.id = id;

        if (!cancelled) {
          setDeal(doc);
          setLoading(false);
          if (typeof window !== "undefined") {
            sessionStorage.removeItem("dealai_upload_img");
          }
        }
      } catch (e: unknown) {
        console.error(e);
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
      void _omit;
      await saveDeal(user.uid, rest);
    } catch (e: unknown) {
      console.error(e);
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <div className="text-2xl font-black tracking-tight">Analyzing…</div>
        <div className="mt-2 text-white/70 text-sm">Running comps, detecting red flags, generating a counter-offer.</div>
        <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-2/3 bg-cyan-300/30 animate-pulse" />
        </div>
      </Card>
    );
  }

  if (err) {
    return (
      <div className="space-y-6">
        <ErrorCard
          title="Analysis failed"
          message="We couldn’t analyze that listing right now."
          details={err}
          onRetry={() => location.reload()}
          href="/app/upload"
          hrefLabel="Go to Upload"
        />
      </div>
    );
  }

  if (!deal) {
    return (
      <ErrorCard
        title="Nothing to analyze yet"
        message="Upload a listing to start."
        href="/app/upload"
        hrefLabel="Go to Upload"
      />
    );
  }

  const reasoning = deal.analysis.reasoning.length
    ? deal.analysis.reasoning
    : ["We looked at price, condition, and location to score this deal."];

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-2xl font-black tracking-tight">{deal.title}</div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Pill>Condition: {deal.analysis.condition}</Pill>
              <Pill>Confidence: {deal.analysis.confidence}</Pill>
              <Pill>Scam Flags: {deal.analysis.scamFlags.length}</Pill>
              <Pill>Location: {deal.location}</Pill>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={onSave} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>

        {deal.imageDataUrl && (
          <img
            src={deal.imageDataUrl}
            alt="listing"
            className="mt-5 w-full rounded-2xl border border-white/10 object-cover"
          />
        )}

        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <Metric label="Deal Score" value={`${deal.analysis.dealScore}/100`} />
          <Metric label="Seller Price" value={deal.sellerPrice ? `$${deal.sellerPrice.toLocaleString()}` : "Unknown"} />
          <Metric label="Market Value" value={`$${deal.analysis.marketValue.toLocaleString()}`} />
          <Metric label="Confidence" value={deal.analysis.confidence} />
        </div>
      </Card>

      <Card>
        <div className="text-sm font-semibold">AI Notes</div>
        <ul className="mt-3 space-y-2 text-sm text-white/70">
          {reasoning.map((n, i) => (
            <li key={i} className="rounded-xl border border-white/10 bg-white/5 p-3">
              {n}
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Scam and negotiation</div>
            <div className="text-xs text-white/60">Copy the message and see why this score was given.</div>
          </div>
          <Button
            onClick={() => {
              navigator.clipboard.writeText(deal.analysis.negotiationMessage);
            }}
          >
            Copy negotiation
          </Button>
        </div>

        <div className="mt-3 rounded-2xl border border-white/10 bg-zinc-950/40 p-4 text-sm text-white/80">
          {deal.analysis.negotiationMessage}
        </div>

        <div className="mt-4 space-y-2">
          <Button onClick={() => setShowReasoning((v) => !v)} variant="ghost">
            {showReasoning ? "Hide" : "Why this score?"}
          </Button>
          {showReasoning ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/70">
              <div className="font-semibold text-white">Score reasoning</div>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                {reasoning.map((r, idx) => (
                  <li key={idx}>{r}</li>
                ))}
              </ul>
              {deal.analysis.scamFlags.length ? (
                <div className="mt-3">
                  <div className="font-semibold text-white">Scam flags</div>
                  <ul className="list-disc list-inside text-sm text-rose-100">
                    {deal.analysis.scamFlags.map((flag, i) => (
                      <li key={i}>{flag}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
