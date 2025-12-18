import type { DealResult } from "./storage";

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export function mockAnalyze(params: { imageDataUrl?: string; sellerPrice?: number; title?: string; location?: string }): DealResult {
  const seller = params.sellerPrice ?? Math.floor(80 + Math.random() * 900);
  const variance = (Math.random() * 0.35 - 0.12); // -12% to +23%
  const market = Math.max(20, Math.round(seller * (1 + variance)));

  const rawScore = 100 - Math.abs(seller - market) / Math.max(1, market) * 120;
  const dealScore = Math.round(clamp(rawScore, 5, 98));

  const scamRoll = Math.random();
  const scamRisk = scamRoll < 0.12 ? "High" : scamRoll < 0.38 ? "Medium" : "Low";

  const conditionPool: DealResult["condition"][] = ["Fair", "Good", "Great", "Excellent", "Poor"];
  const condition = conditionPool[Math.floor(Math.random() * conditionPool.length)];

  const counterOffer = Math.max(10, Math.round(Math.min(seller, market) * (0.86 + Math.random() * 0.06)));

  const notes: string[] = [];
  if (seller > market) notes.push("Seller price looks above market for similar listings.");
  else notes.push("Price looks competitive vs market comps.");
  if (scamRisk !== "Low") notes.push("Potential red flags detected — verify profile, meet safely, request proof.");
  notes.push("Ask for: VIN/serial, maintenance receipts, and a quick demo video.");
  notes.push("Use a friendly low anchor, then move up once you confirm condition.");

  return {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    title: params.title?.trim() || "Marketplace listing",
    sellerPrice: seller,
    marketValue: market,
    dealScore,
    condition,
    scamRisk,
    counterOffer,
    notes,
    imageDataUrl: params.imageDataUrl,
    location: params.location?.trim() || "Near you",
  };
}
