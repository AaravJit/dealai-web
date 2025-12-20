import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildResponsesInput({
  prompt,
  title,
  sellerPrice,
  location,
  imageText,
  imageUrl,
}: {
  prompt: string;
  title: string;
  sellerPrice: number | null;
  location: string;
  imageText: string;
  imageUrl?: string;
}): string {
  const lines = [
    prompt,
    `Title: ${title}`,
    `Seller price: ${sellerPrice ?? "unknown"}`,
    `Location: ${location || "unknown"}`,
    `Image text: ${imageText || "not provided"}`,
  ];

  if (imageUrl) {
    lines.push(`Image URL: ${imageUrl}`);
  }

  return lines.join("\n");
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
  const scamFlags = [] as string[];
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
    negotiationMessage: "Thanks for the listing. Based on comps, would you consider a small discount if I pay today?",
    reasoning,
  };
}

type AnalyzeRequest = {
  title?: string;
  sellerPrice?: number;
  price?: number;
  location?: string;
  imageUrl?: string;
  imageText?: string;
};

export async function POST(req: Request) {
  console.log("/api/analyze start");

  let body: AnalyzeRequest | null = null;
  try {
    body = (await req.json()) as AnalyzeRequest;
  } catch (error: unknown) {
    console.error("Invalid JSON body", error);
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = typeof body?.title === "string" ? body.title : "";
  const sellerPrice =
    typeof body?.sellerPrice === "number"
      ? body.sellerPrice
      : Number(body?.price ?? body?.sellerPrice ?? 0) || null;
  const location = typeof body?.location === "string" ? body.location : "";
  const imageUrl = body?.imageUrl ? String(body.imageUrl) : "";
  const imageText = typeof body?.imageText === "string" ? body.imageText : "";

  const fallback = deterministicAnalysis({ title, sellerPrice, location, imageText });

  if (!process.env.OPENAI_API_KEY) {
    console.log("/api/analyze fallback: missing OPENAI_API_KEY");
    return NextResponse.json(fallback);
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `Return strict JSON with keys: title, sellerPrice, marketValue, dealScore (0-100), confidence (low|medium|high), condition (poor|fair|good|excellent), scamFlags (array), negotiationMessage (short), reasoning (array). Use listing hints below to stay concise.`;

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: buildResponsesInput({ prompt, title, sellerPrice, location, imageText, imageUrl }),
    });

    const raw = String((response as { output_text?: string } | undefined)?.output_text ?? "").trim();
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end === -1) {
      console.error("No JSON returned from model", raw);
      return NextResponse.json(fallback);
    }

    type ParsedAnalysis = {
      title?: string;
      sellerPrice?: number;
      marketValue?: number;
      dealScore?: number;
      confidence?: string;
      condition?: string;
      scamFlags?: unknown[];
      negotiationMessage?: string;
      reasoning?: unknown[];
    };

    let parsed: ParsedAnalysis | null = null;
    try {
      parsed = JSON.parse(raw.slice(start, end + 1)) as ParsedAnalysis;
    } catch (error: unknown) {
      console.error("JSON parse failed", error);
    }

    const result = {
      title: parsed?.title || fallback.title,
      sellerPrice: Number.isFinite(parsed?.sellerPrice) ? Number(parsed?.sellerPrice) : fallback.sellerPrice,
      marketValue: Number.isFinite(parsed?.marketValue) ? Number(parsed?.marketValue) : fallback.marketValue,
      dealScore: Math.max(0, Math.min(100, Number(parsed?.dealScore ?? fallback.dealScore))),
      confidence: parsed?.confidence ?? fallback.confidence,
      condition: parsed?.condition ?? fallback.condition,
      scamFlags: Array.isArray(parsed?.scamFlags) ? parsed?.scamFlags.map(String) : fallback.scamFlags,
      negotiationMessage: parsed?.negotiationMessage || fallback.negotiationMessage,
      reasoning: Array.isArray(parsed?.reasoning) ? parsed?.reasoning.map(String) : fallback.reasoning,
    };

    console.log("/api/analyze success");
    return NextResponse.json(result);
  } catch (error) {
    console.error("/api/analyze error", error);
    return NextResponse.json(fallback);
  }
}
