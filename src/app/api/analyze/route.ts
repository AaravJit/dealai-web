import { NextResponse } from "next/server";
import OpenAI from "openai";
import { db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export const runtime = "nodejs";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { image, title, uid } = await req.json();

    if (!image || !uid) {
      return NextResponse.json(
        { error: "Missing image or uid" },
        { status: 400 }
      );
    }

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: title ?? "Analyze this deal" },
            { type: "input_image", image_url: image },
          ],
        },
      ],
    });

    const text =
      response.output_text ??
      "Unable to analyze image. Please try again.";

    const docRef = await addDoc(collection(db, "deals"), {
      uid,
      title: title ?? null,
      image,
      analysis: text,
      createdAt: serverTimestamp(),
    });

    return NextResponse.json({
      ok: true,
      id: docRef.id,
      analysis: text,
    });
  } catch (err) {
    console.error("Analyze API error:", err);
    return NextResponse.json(
      { error: "Analysis failed" },
      { status: 500 }
    );
  }
}
