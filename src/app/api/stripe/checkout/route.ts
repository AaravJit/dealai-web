import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

function cleanBase(url: string) {
  return url.replace(/\/+$/, "");
}

export function getBaseUrl(req: Request): string {
  let base: string | null = null;

  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) base = cleanBase(explicit);

  if (!base) {
    const originHeader = req.headers.get("origin")?.trim();
    if (originHeader) {
      try {
        const parsed = new URL(originHeader);
        base = cleanBase(parsed.origin);
      } catch (error) {
        console.error("Invalid origin header for base URL", { originHeader, error });
      }
    }
  }

  if (!base) {
    const proto = req.headers.get("x-forwarded-proto") ?? "https";
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    if (host) base = `${proto}://${cleanBase(host)}`;
  }

  if (!base) {
    const vercel = process.env.VERCEL_URL?.trim();
    if (vercel) base = `https://${cleanBase(vercel)}`;
  }

  if (!base) {
    base = "http://localhost:3000";
  }

  const isProd = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
  if (isProd && base.includes("localhost")) {
    console.error("Base URL resolved to localhost in production", { base });
    throw new Error("Invalid base URL resolution in production");
  }

  return cleanBase(base);
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
