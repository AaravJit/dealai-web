// src/app/api/analyze/route.ts
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, sellerPrice, location, imageUrl } = body as {
      title?: string;
      sellerPrice?: number;
      location?: string;
      imageUrl?: string;
    };

    if (!imageUrl) {
      return Response.json({ error: "Missing imageUrl" }, { status: 400 });
    }

    const prompt = `Analyze this marketplace listing screenshot and return JSON only.
Title: ${title ?? ""}
Seller price: ${sellerPrice ?? ""}
Location: ${location ?? ""}

Return fields:
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
            { type: "input_image", image_url: imageUrl },
          ],
        },
      ],
    });

    // Pull text output (Responses API)
    const text =
      resp.output_text ??
      resp.output
        ?.flatMap((o: any) => o.content ?? [])
        ?.map((c: any) => c.text ?? "")
        ?.join("") ??
      "";

    // If your model returns JSON text:
    const data = JSON.parse(text);

    return Response.json(data);
  } catch (err: any) {
    console.error(err);
    return Response.json(
      { error: "Analyze failed", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
