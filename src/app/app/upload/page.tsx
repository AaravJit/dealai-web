"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import { Button, Card, Pill } from "@/components/ui";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { consumeUpload, refreshQuota, type QuotaState } from "@/lib/quota";

export default function UploadPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [image, setImage] = useState<string | undefined>();
  const [title, setTitle] = useState("");
  const [sellerPrice, setSellerPrice] = useState<number | undefined>();
  const [location, setLocation] = useState("");
  const [quota, setQuota] = useState<QuotaState | null>(null);
  const [checkingQuota, setCheckingQuota] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = useMemo(() => Boolean(image), [image]);
  const remaining = quota ? Math.max(0, quota.uploadsLimit - quota.uploadsUsed) : null;

  useEffect(() => {
    let active = true;
    async function sync() {
      if (!user) return;
      try {
        const profile = await refreshQuota(user.uid);
        if (active && profile?.quota) setQuota(profile.quota);
      } catch (err) {
        console.error("Failed to refresh quota", err);
      }
    }
    sync();
    return () => {
      active = false;
    };
  }, [user]);

  function onFile(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result));
    reader.readAsDataURL(file);
  }

  async function goAnalyze() {
    if (!image || !user) return;
    setCheckingQuota(true);
    setError(null);
    try {
      const { blocked, profile } = await consumeUpload(user.uid);
      if (profile?.quota) setQuota(profile.quota);
      if (blocked) {
        router.replace(`/purchase?next=${encodeURIComponent("/app/upload")}`);
        return;
      }

      sessionStorage.setItem("dealai_upload_img", image);

      const qs = new URLSearchParams();
      if (title.trim()) qs.set("title", title.trim());
      if (sellerPrice) qs.set("price", String(sellerPrice));
      if (location.trim()) qs.set("loc", location.trim());

      router.push(`/app/analyze?${qs.toString()}`);
    } catch (err: unknown) {
      console.error("Upload consume failed", err);
      setError(err instanceof Error ? err.message : "Could not start analysis");
    } finally {
      setCheckingQuota(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-2xl font-black tracking-tight">Upload screenshot</div>
            <div className="mt-2 text-white/70 text-sm">Upload the listing image and we’ll run the full analysis.</div>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/60">
            <Pill>{remaining !== null ? `${remaining} uploads left today` : "Checking quota"}</Pill>
          </div>
        </div>

        {error ? (
          <div className="mt-3 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-100">{error}</div>
        ) : null}

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-semibold">Image</div>
            <input
              className="mt-3 block w-full text-sm text-white/70 file:mr-4 file:rounded-xl file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-white file:hover:bg-white/15"
              type="file"
              accept="image/*"
              disabled={checkingQuota}
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            />
            {image && (
              <img
                src={image}
                alt="upload preview"
                className="mt-4 w-full rounded-2xl border border-white/10 object-cover"
              />
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
            <div>
              <div className="text-sm font-semibold">Optional details</div>
              <div className="text-xs text-white/60">Helps the AI match comps faster.</div>
            </div>

            <label className="block">
              <div className="text-xs text-white/60">Title</div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., 2014 BMW 320i xDrive"
                className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-950/40 px-3 py-2 text-sm outline-none focus:border-cyan-300/30"
              />
            </label>

            <label className="block">
              <div className="text-xs text-white/60">Seller price ($)</div>
              <input
                value={sellerPrice ?? ""}
                onChange={(e) => setSellerPrice(e.target.value ? Number(e.target.value) : undefined)}
                inputMode="numeric"
                placeholder="e.g., 8500"
                className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-950/40 px-3 py-2 text-sm outline-none focus:border-cyan-300/30"
              />
            </label>

            <label className="block">
              <div className="text-xs text-white/60">Location</div>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Sacramento, CA"
                className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-950/40 px-3 py-2 text-sm outline-none focus:border-cyan-300/30"
              />
            </label>

            <div className="pt-2 flex flex-wrap gap-3">
              <Button onClick={goAnalyze} disabled={!ready || checkingQuota}>
                {checkingQuota ? "Checking quota…" : "Analyze"}
              </Button>
              <Button href="/purchase" variant="secondary">Need more uploads?</Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
