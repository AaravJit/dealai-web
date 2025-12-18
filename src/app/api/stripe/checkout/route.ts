import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { priceId, uid, email, next } = await req.json();

    console.log("/api/stripe/checkout start", { uid, next });

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
    }
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      return NextResponse.json({ error: "Missing NEXT_PUBLIC_APP_URL" }, { status: 500 });
    }
    if (!priceId || !uid) {
      return NextResponse.json({ error: "Missing priceId or uid" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    const successUrl = `${baseUrl}/purchase/success?next=${encodeURIComponent(next ?? "/app")}`;
    const cancelUrl = `${baseUrl}/purchase?next=${encodeURIComponent(next ?? "/app")}`;

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {});

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: email ?? undefined,
      client_reference_id: uid,
      metadata: { uid, plan: "pro", next: next ?? "/app" },
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
