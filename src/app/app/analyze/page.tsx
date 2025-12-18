"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, Card, Metric, Pill } from "@/components/ui";
import { saveToTimeline, type DealResult } from "@/lib/dealsDb";
import { useAuth } from "@/components/AuthProvider";
import { uploadDealImage } from "@/lib/uploadImage";
import { ErrorCard } from "@/components/ErrorCard";

export default function AnalyzePage() {
  const user = useAuth();
  const sp = useSearchParams();

  const [deal, setDeal] = useState<DealResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // image comes from sessionStorage (set in upload page)
  const img = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    return sessionStorage.getItem("dealai_upload_img") ?? undefined;
  }, []);

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

        if (!img) throw new Error("Missing uploaded image. Go back and upload again.");
        if (!user) throw new Error("Please sign in to analyze.");

        // 1) Upload screenshot (base64) to Firebase Storage => get a download URL
        const imageUrl = await uploadDealImage(user.uid, img);

        // 2) Call server route
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl, title, price, location: loc }),
        });

        const data = await res.json().catch(() => ({} as any));
        if (!res.ok) throw new Error(data?.detail ?? data?.error ?? "Analyze failed");

        // 3) Merge into DealResult shape (ensure required fields exist)
        const result: DealResult = {
          title: data.title ?? title ?? "Untitled listing",
          sellerPrice: typeof data.sellerPrice === "number" ? data.sellerPrice : price ?? 0,
          marketValue: typeof data.marketValue === "number" ? data.marketValue : 0,
          counterOffer: typeof data.counterOffer === "number" ? data.counterOffer : 0,
          dealScore: typeof data.dealScore === "number" ? data.dealScore : 50,
          condition: data.condition ?? "Unknown",
          scamRisk: data.scamRisk ?? "Medium",
          notes: Array.isArray(data.notes) ? data.notes : ["No notes returned."],
          location: data.location ?? loc ?? "Unknown",
          imageUrl,
          imageDataUrl: img, // UI-only (not stored)
        };

        if (!cancelled) {
          setDeal(result);
          setLoading(false);

          // clear temp image after analysis so it doesn't stick around
          if (typeof window !== "undefined") {
            sessionStorage.removeItem("dealai_upload_img");
          }
        }
      } catch (e: any) {
        console.error(e);
        if (!cancelled) {
          setErr(e?.message ?? "Analyze failed");
          setLoading(false);
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [img, sp, user]);

  async function onSave() {
    if (!deal || !user) return;

    try {
      let imageUrl = deal.imageUrl;

      // Upload screenshot to Firebase Storage (if we have base64 but no URL)
      if (!imageUrl && deal.imageDataUrl) {
        imageUrl = await uploadDealImage(user.uid, deal.imageDataUrl);
      }

      // Never store base64 in Firestore
      const { imageDataUrl, ...rest } = deal as any;

      await saveToTimeline(user.uid, { ...rest, imageUrl });
      // (Optional: swap to toast later)
      alert("Saved to Timeline ✅");
    } catch (e: any) {
      console.error(e);
      setErr(e?.message ?? "Save failed");
    }
  }

  if (loading) {
    return (
      <Card>
        <div className="text-2xl font-black tracking-tight">Analyzing…</div>
        <div className="mt-2 text-white/70 text-sm">
          Running comps, detecting red flags, generating a counter-offer.
        </div>
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
        title="No analysis result"
        message="Try uploading again."
        href="/app/upload"
        hrefLabel="Go to Upload"
      />
    );
  }

  const msg = `Hey! I'm interested. Based on similar listings, would you take $${deal.counterOffer.toLocaleString()} if I pick up today?`;

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-2xl font-black tracking-tight">{deal.title}</div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Pill>Condition: {deal.condition}</Pill>
              <Pill>Scam Risk: {deal.scamRisk}</Pill>
              <Pill>Location: {deal.location}</Pill>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={onSave}>Save</Button>
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
          <Metric label="Deal Score" value={`${deal.dealScore}/100`} />
          <Metric label="Seller Price" value={`$${deal.sellerPrice.toLocaleString()}`} />
          <Metric label="Market Value" value={`$${deal.marketValue.toLocaleString()}`} />
          <Metric label="Counter-Offer" value={`$${deal.counterOffer.toLocaleString()}`} />
        </div>
      </Card>

      <Card>
        <div className="text-sm font-semibold">AI Notes</div>
        <ul className="mt-3 space-y-2 text-sm text-white/70">
          {deal.notes.map((n, i) => (
            <li key={i} className="rounded-xl border border-white/10 bg-white/5 p-3">
              {n}
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <div className="text-sm font-semibold">Copy-paste negotiation message</div>
        <div className="mt-3 rounded-2xl border border-white/10 bg-zinc-950/40 p-4 text-sm text-white/80">
          {msg}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            onClick={() => {
              navigator.clipboard.writeText(msg);
              alert("Copied ✅");
            }}
          >
            Copy
          </Button>
          <Button href="/app/timeline" variant="ghost">
            Go to Timeline →
          </Button>
        </div>
      </Card>
    </div>
  );
}
