import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
});

export async function POST(req: Request) {
  try {
    const sig = req.headers.get("stripe-signature");
    if (!sig) return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });

    const body = await req.text();

    const event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );

    // Subscription paid / created
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const uid = session.client_reference_id || (session.metadata?.uid as string | undefined);

      if (uid) {
        await setDoc(
          doc(db, "users", uid),
          {
            isPro: true,
            stripe: {
              customerId: session.customer,
              subscriptionId: session.subscription,
              updatedAt: Date.now(),
            },
          },
          { merge: true }
        );
      }
    }

    // Subscription canceled/expired (optional)
    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;
      // You’d need to map sub.customer -> uid (store mapping on checkout).
      // Skipping for now.
    }

    return NextResponse.json({ received: true });
  } catch (e: any) {
    console.error("Webhook error:", e);
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 400 });
  }
}
