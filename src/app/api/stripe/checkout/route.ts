// src/app/api/stripe/checkout/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

function getBaseUrl(req: Request) {
  // 1) Preferred: explicit env var (set this in Vercel)
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (envUrl) return envUrl.replace(/\/+$/, "");

  // 2) Vercel auto domain (Preview/Prod)
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`.replace(/\/+$/, "");

  // 3) Fallback to request host (works in many deployments)
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  if (host) return `${proto}://${host}`.replace(/\/+$/, "");

  // 4) Local fallback
  return "https://dealai-flax.vercel.app/";
}

export async function POST(req: Request) {
  try {
    const { priceId, uid, email, next } = (await req.json()) as {
      priceId?: string;
      uid?: string;
      email?: string;
      next?: string;
    };

    console.log("/api/stripe/checkout start", { uid, next });

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
    }
    if (!priceId || !uid) {
      return NextResponse.json({ error: "Missing priceId or uid" }, { status: 400 });
    }

    const baseUrl = getBaseUrl(req);
    const safeNext = typeof next === "string" && next.startsWith("/") ? next : "/app";

    // Make sure these paths exist in your app:
    // - /purchase
    // - /purchase/success
    const successUrl = `${baseUrl}/purchase/success?next=${encodeURIComponent(safeNext)}`;
    const cancelUrl = `${baseUrl}/purchase?next=${encodeURIComponent(safeNext)}`;

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20",
    });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: email ?? undefined,
      client_reference_id: uid,
      metadata: { uid, plan: "pro", next: safeNext },
      subscription_data: {
        metadata: { uid, plan: "pro" },
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (e: unknown) {
    console.error(e);
    const detail = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "Checkout failed", detail }, { status: 500 });
  }
}
