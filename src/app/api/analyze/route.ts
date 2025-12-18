import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const body = await req.json();
    const imageUrl = String(body?.imageUrl ?? ""); // ✅ force string
    const title = body?.title ?? "";
    const price = body?.price;
    const location = body?.location ?? "";

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
      input: [
        {
          role: "user" as const,
          content: [
            { type: "input_text" as const, text: prompt },
            { type: "input_image" as const, image_url: imageUrl },
          ],
        },
      ],
    });

    const txt = String((r as any).output_text ?? "").trim();
    const start = txt.indexOf("{");
    const end = txt.lastIndexOf("}");

    if (start === -1 || end === -1) {
      return NextResponse.json(
        { error: "Model did not return JSON", raw: txt },
        { status: 500 }
      );
    }

    const json = JSON.parse(txt.slice(start, end + 1));
    return NextResponse.json(json);
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
          notes: ["AI is temporarily unavailable (quota). Add billing/credits to enable analysis."],
        },
        { status: 200 }
      );
    }

    console.error("Analyze failed:", e);
    return NextResponse.json({ error: "Analyze failed", detail: msg }, { status: 500 });
  }
}
