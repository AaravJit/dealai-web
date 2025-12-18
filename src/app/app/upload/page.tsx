"use client";

import { useMemo, useState } from "react";
import { Button, Card } from "@/components/ui";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const router = useRouter();
  const [image, setImage] = useState<string | undefined>();
  const [title, setTitle] = useState("");
  const [sellerPrice, setSellerPrice] = useState<number | undefined>();
  const [location, setLocation] = useState("");

  const ready = useMemo(() => Boolean(image), [image]);

  function onFile(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result));
    reader.readAsDataURL(file);
  }

  function goAnalyze() {
    if (!image) return;
  
    // store the image temporarily for the next page
    sessionStorage.setItem("dealai_upload_img", image);
  
    const qs = new URLSearchParams();
    if (title.trim()) qs.set("title", title.trim());
    if (sellerPrice) qs.set("price", String(sellerPrice));
    if (location.trim()) qs.set("loc", location.trim());
  
    router.push(`/app/analyze?${qs.toString()}`);
  }
  

  return (
    <div className="space-y-6">
      <Card>
        <div className="text-2xl font-black tracking-tight">Upload screenshot</div>
        <div className="mt-2 text-white/70 text-sm">
          Facebook Marketplace / Craigslist / OfferUp — anything works.
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-semibold">Image</div>
            <input
              className="mt-3 block w-full text-sm text-white/70 file:mr-4 file:rounded-xl file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-white file:hover:bg-white/15"
              type="file"
              accept="image/*"
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
              <div className="text-xs text-white/60">Helps the analysis feel more realistic for now.</div>
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
              <Button onClick={goAnalyze} disabled={!ready}>Analyze</Button>
              <Button href="/app/analyze" variant="secondary">Analyze (demo)</Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
