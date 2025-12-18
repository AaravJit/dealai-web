// src/app/api/analyze/route.ts
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

function safeJsonParse(text: string) {
  // 1) Try direct parse
  try {
    return JSON.parse(text);
  } catch {}

  // 2) Try to extract the first JSON object block
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    const maybe = text.slice(start, end + 1);
    try {
      return JSON.parse(maybe);
    } catch {}
  }

  // 3) Give up with a helpful error
  throw new Error("Model did not return valid JSON.");
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      title?: string;
      sellerPrice?: number;
      location?: string;
      imageUrl?: string;
    };

    const { title, sellerPrice, location, imageUrl } = body;

    if (!imageUrl) {
      return Response.json({ error: "Missing imageUrl" }, { status: 400 });
    }

    const prompt = `Analyze this marketplace listing screenshot and return JSON only.

Title: ${title ?? ""}
Seller price: ${sellerPrice ?? ""}
Location: ${location ?? ""}

Return fields (JSON only):
dealScore (number 0-100), marketValue (number), condition (string),
confidence ("low"|"medium"|"high"), scamFlags (string[]),
negotiationMessage (string), reasoning (string[]).`;

    const resp = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            // ✅ REQUIRED: detail is required for input_image in the typed SDK
            { type: "input_image", image_url: imageUrl, detail: "auto" },
          ],
        },
      ],
    });

    // Responses API convenience field (best option)
    const text = (resp.output_text ?? "").trim();

    if (!text) {
      return Response.json(
        { error: "Analyze failed", detail: "Empty model response" },
        { status: 500 }
      );
    }

    const data = safeJsonParse(text);
    return Response.json(data);
  } catch (err: any) {
    console.error(err);
    return Response.json(
      { error: "Analyze failed", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
