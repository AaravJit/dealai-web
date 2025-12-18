import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

export const dynamic = "force-dynamic"; // avoid caching issues in Vercel

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const body = await req.json();

    const imageUrl = String(body?.imageUrl ?? "");
    const title = String(body?.title ?? "");
    const price = body?.price;
    const location = String(body?.location ?? "");

    if (!imageUrl) {
      return NextResponse.json({ error: "imageUrl is required" }, { status: 400 });
    }

    const prompt = `
Return ONLY valid JSON (no markdown) with EXACT keys:
{
  "dealScore": number,
  "marketValue": number,
  "counterOffer": number,
  "condition": "Excellent"|"Good"|"Fair"|"Poor"|"Unknown",
  "scamRisk": "Low"|"Medium"|"High",
  "notes": string[]
}

Context:
Title: ${title}
Seller Price: ${typeof price === "number" ? price : ""}
Location: ${location}

Rules:
- dealScore 0-100
- marketValue and counterOffer are USD numbers
- notes should be 4-8 short bullets
- if unsure: condition="Unknown", scamRisk="Medium"
`.trim();

    const r = await client.responses.create({
      model: "gpt-5.2",
      // If your SDK complains about the model name at runtime later,
      // switch to something you have access to, e.g. "gpt-4.1-mini"
      input: [
        {
          role: "user" as const,
          content: [
            { type: "input_text" as const, text: prompt },
            {
              type: "input_image" as const,
              image_url: imageUrl, // already a string
              detail: "auto" as const, // ✅ required by your TS types
            },
          ],
        },
      ],
    });

    const txt = String((r as any).output_text ?? "").trim();

    // Parse JSON safely from the response text
    const start = txt.indexOf("{");
    const end = txt.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      return NextResponse.json({ error: "Model did not return JSON", raw: txt }, { status: 500 });
    }

    let json: any;
    try {
      json = JSON.parse(txt.slice(start, end + 1));
    } catch {
      return NextResponse.json({ error: "Invalid JSON from model", raw: txt }, { status: 500 });
    }

    // Optional: minimal shape guard so UI never crashes
    return NextResponse.json({
      dealScore: Number(json.dealScore ?? 50),
      marketValue: Number(json.marketValue ?? 0),
      counterOffer: Number(json.counterOffer ?? 0),
      condition: String(json.condition ?? "Unknown"),
      scamRisk: String(json.scamRisk ?? "Medium"),
      notes: Array.isArray(json.notes) ? json.notes.map(String) : [],
    });
  } catch (e: any) {
    const status = e?.status ?? e?.response?.status ?? 500;
    const msg = e?.message ?? String(e);

    if (status === 429) {
      return NextResponse.json(
        {
          dealScore: 50,
          marketValue: 0,
          counterOffer: 0,
          condition: "Unknown",
          scamRisk: "Medium",
          notes: ["AI is temporarily unavailable (rate limit/quota). Try again soon."],
        },
        { status: 200 }
      );
    }

    console.error("Analyze failed:", e);
    return NextResponse.json({ error: "Analyze failed", detail: msg }, { status: 500 });
  }
}
