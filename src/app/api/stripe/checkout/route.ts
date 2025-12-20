import { NextResponse } from "next/server";
import Stripe from "stripe";

import { getBaseUrlFromRequest, getEnvBaseUrl, safeNextPath } from "@/lib/baseUrl";

export const runtime = "nodejs";

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

    const isProd = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
    let baseUrl: string | null = null;
    try {
      baseUrl = getBaseUrlFromRequest(req);
    } catch (error) {
      console.warn("/api/stripe/checkout base URL from request failed", { error });
    }

    if (!baseUrl) {
      baseUrl = getEnvBaseUrl();
    }

    if (!baseUrl) {
      if (isProd) {
        console.error("/api/stripe/checkout unable to resolve base URL in production");
        return NextResponse.json({ error: "Unable to resolve base URL" }, { status: 500 });
      }
      baseUrl = "http://localhost:3000";
    }

    if (isProd && baseUrl.includes("localhost")) {
      console.error("Base URL resolved to localhost in production", { baseUrl });
      return NextResponse.json({ error: "Invalid base URL resolution in production" }, { status: 500 });
    }

    const nextPath = safeNextPath(next);
    const successUrl = new URL(`/purchase/success?next=${encodeURIComponent(nextPath)}`, baseUrl).toString();
    const cancelUrl = new URL(`/purchase?next=${encodeURIComponent(nextPath)}`, baseUrl).toString();

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
