import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

function cleanBase(url: string) {
  return url.replace(/\/+$/, "");
}

export function getBaseUrl(req: Request): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) return cleanBase(explicit);

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${cleanBase(vercel)}`;

  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (host) return `${proto}://${cleanBase(host)}`;

  return "http://localhost:3000";
}

export async function POST(req: Request) {
  try {
    const payload = await req.json().catch(() => ({}));
    const { priceId, uid, email, next } = payload as {
      priceId?: string;
      uid?: string;
      email?: string;
      next?: string;
    };

    if (!uid) {
      return NextResponse.json({ error: "Missing uid" }, { status: 400 });
    }

    console.log("/api/stripe/checkout start", {
      uid,
      priceId,
      next,
      env: {
        hasAppUrl: Boolean(process.env.NEXT_PUBLIC_APP_URL),
        vercelUrl: process.env.VERCEL_URL ?? null,
        nodeEnv: process.env.NODE_ENV,
      },
    });

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
    }
    if (!priceId) {
      return NextResponse.json({ error: "Missing priceId" }, { status: 400 });
    }

    const baseUrl = getBaseUrl(req);
    const nextPath = typeof next === "string" && next.length > 0 ? next : "/app";
    const successUrl = `${baseUrl}/purchase/success?next=${encodeURIComponent(nextPath)}`;
    const cancelUrl = `${baseUrl}/purchase?next=${encodeURIComponent(nextPath)}`;

    console.log("/api/stripe/checkout urls", { baseUrl, successUrl, cancelUrl, uid });

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {});

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: email ?? undefined,
      client_reference_id: uid,
      metadata: { uid, plan: "pro", next: nextPath },
      subscription_data: {
        metadata: { uid, plan: "pro" },
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (e: unknown) {
    console.error("/api/stripe/checkout error", e);
    const detail = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "Checkout failed", detail }, { status: 500 });
  }
}
