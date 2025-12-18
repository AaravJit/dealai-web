// src/app/api/analyze/route.ts
import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AnalyzeRequest = {
  title?: string;
  sellerPrice?: number;
  price?: number;
  location?: string;
  imageUrl?: string;
  imageText?: string;
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function deterministicAnalysis({
  title,
  sellerPrice,
  location,
  imageText,
}: {
  title: string;
  sellerPrice: number | null;
  location: string;
  imageText: string;
}) {
  const safePrice = Number.isFinite(sellerPrice) ? Number(sellerPrice) : 0;
  const baseline = Math.max(35, Math.min(90, 80 - Math.min(20, safePrice / 5000)));
  const scamFlags: string[] = [];
  if (!location) scamFlags.push("Location not provided");
  if (!imageText) scamFlags.push("Limited listing details available");
  if (safePrice && safePrice < 500) scamFlags.push("Suspiciously low price");

  const reasoning = [
    safePrice ? `Seller price is $${safePrice.toLocaleString()}` : "Seller price not provided",
    location ? `Listing location: ${location}` : "Location missing; harder to verify legitimacy",
    imageText ? "Parsed listing text present" : "Using only metadata (no OCR text provided)",
  ];

  return {
    title: title || "Untitled listing",
    sellerPrice: safePrice,
    marketValue: Math.max(500, safePrice ? Math.round(safePrice * 1.12) : 1200),
    dealScore: Math.round(baseline),
    confidence: "medium" as const,
    condition: "good" as const,
    scamFlags,
    negotiationMessage:
      "Thanks for the listing. Based on comps, would you consider a small discount if I pay today?",
    reasoning,
    meta: { day: today(), mode: "fallback" as const },
  };
}

function safeJsonParse(text: string) {
  // 1) Direct parse
  try {
    return JSON.parse(text);
  } catch {}

  // 2) Extract first JSON object
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    const maybe = text.slice(start, end + 1);
    try {
      return JSON.parse(maybe);
    } catch {}
  }

  throw new Error("Model did not return valid JSON.");
}

export async function POST(req: Request) {
  console.log("/api/analyze start");

  let body: AnalyzeRequest;
  try {
    body = (await req.json()) as AnalyzeRequest;
  } catch (error) {
    console.error("Invalid JSON body", error);
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title : "";
  const sellerPrice =
    typeof body.sellerPrice === "number"
      ? body.sellerPrice
      : Number(body.price ?? body.sellerPrice ?? 0) || null;
  const location = typeof body.location === "string" ? body.location : "";
  const imageUrl = body.imageUrl ? String(body.imageUrl) : "";
  const imageText = typeof body.imageText === "string" ? body.imageText : "";

  const fallback = deterministicAnalysis({ title, sellerPrice, location, imageText });

  // If missing key, return deterministic fallback (still works on Vercel)
  if (!process.env.OPENAI_API_KEY) {
    console.log("/api/analyze fallback: missing OPENAI_API_KEY");
    return NextResponse.json(fallback);
  }

  // Require an image URL for real analysis
  if (!imageUrl) {
    return NextResponse.json({ error: "Missing imageUrl" }, { status: 400 });
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `Return STRICT JSON only (no markdown, no commentary).
Keys:
dealScore (0-100 number),
marketValue (number),
condition (string),
confidence ("low"|"medium"|"high"),
scamFlags (string[]),
negotiationMessage (string),
reasoning (string[]).

Use the screenshot + metadata:
Title: ${title || "N/A"}
Seller price: ${sellerPrice ?? "N/A"}
Location: ${location || "N/A"}
Image text: ${imageText || "N/A"}
`;

    const resp = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            // ✅ IMPORTANT: Responses API expects input_image and REQUIRES detail
            { type: "input_image", image_url: imageUrl, detail: "auto" },
          ],
        },
      ],
    });

    const text = (resp.output_text ?? "").trim();
    if (!text) {
      console.error("Empty model response");
      return NextResponse.json(fallback);
    }

    const parsed = safeJsonParse(text) as Partial<{
      dealScore: number;
      marketValue: number;
      condition: string;
      confidence: "low" | "medium" | "high";
      scamFlags: string[];
      negotiationMessage: string;
      reasoning: string[];
    }>;

    const result = {
      title: title || fallback.title,
      sellerPrice: sellerPrice ?? fallback.sellerPrice,
      dealScore: Number.isFinite(parsed.dealScore) ? Math.max(0, Math.min(100, Number(parsed.dealScore))) : fallback.dealScore,
      marketValue: Number.isFinite(parsed.marketValue) ? Number(parsed.marketValue) : fallback.marketValue,
      condition: typeof parsed.condition === "string" ? parsed.condition : fallback.condition,
      confidence:
        parsed.confidence === "low" || parsed.confidence === "medium" || parsed.confidence === "high"
          ? parsed.confidence
          : fallback.confidence,
      scamFlags: Array.isArray(parsed.scamFlags) ? parsed.scamFlags.map(String) : fallback.scamFlags,
      negotiationMessage:
        typeof parsed.negotiationMessage === "string" ? parsed.negotiationMessage : fallback.negotiationMessage,
      reasoning: Array.isArray(parsed.reasoning) ? parsed.reasoning.map(String) : fallback.reasoning,
      meta: { day: today(), mode: "openai" as const },
    };

    console.log("/api/analyze success");
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("/api/analyze error", error);
    return NextResponse.json(fallback);
  }
}
