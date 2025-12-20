import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY");
}

if (!process.env.NEXT_PUBLIC_APP_URL) {
  throw new Error("Missing NEXT_PUBLIC_APP_URL");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

export async function POST(req: Request) {
  try {
    const { priceId, uid, email, next } = await req.json();

    if (!priceId || !uid) {
      return NextResponse.json(
        { error: "Missing priceId or uid" },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    const redirectNext = encodeURIComponent(next ?? "/app");

    const successUrl = `${baseUrl}/purchase/success?next=${redirectNext}`;
    const cancelUrl = `${baseUrl}/purchase?next=${redirectNext}`;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: uid,
      customer_email: email,
      metadata: { uid },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
