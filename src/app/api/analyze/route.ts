import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { imageUrl, title, price, location } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }
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
Title: ${title ?? ""}
Seller Price: ${typeof price === "number" ? price : ""}
Location: ${location ?? ""}

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
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            { type: "input_image", image_url: imageUrl },
          ],
        },
      ],
    });

    const txt = (r.output_text ?? "").trim();
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

    // Quota / billing / rate-limit friendly fallback
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
        { status: 200 } // return 200 so your UI renders
      );
    }

    console.error("Analyze failed:", e);
    return NextResponse.json({ error: "Analyze failed", detail: msg }, { status: 500 });
  }
}
