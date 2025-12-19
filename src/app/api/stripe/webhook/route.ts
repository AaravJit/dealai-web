import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/firebase";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { cleanUndefinedDeep } from "@/lib/firestoreClean";

export const runtime = "nodejs";
const PRO_LIMIT = 10000;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function POST(req: Request) {
  try {
    const sig = req.headers.get("stripe-signature");
    if (!sig) return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });

    if (!process.env.STRIPE_WEBHOOK_SECRET || !process.env.STRIPE_SECRET_KEY) {
      console.error("Missing Stripe secrets for webhook");
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
    }

    const body = await req.text();

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {});

    const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET as string);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const uid = session.client_reference_id || (session.metadata?.uid as string | undefined);

      if (uid) {
        console.log("Webhook: checkout completed", { uid });
        await setDoc(
          doc(db, "users", uid),
          cleanUndefinedDeep({
            isPro: true,
            plan: "pro",
            quota: {
              day: today(),
              uploadsUsed: 0,
              uploadsLimit: PRO_LIMIT,
            },
            stripe: {
              customerId: session.customer,
              subscriptionId: session.subscription,
              updatedAt: serverTimestamp(),
            },
            updatedAt: serverTimestamp(),
          }),
          { merge: true }
        );
      }
    }

    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;
      const uid = invoice.metadata?.uid as string | undefined;
      const subscriptionId =
        (invoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null }).subscription || undefined;
      if (uid) {
        console.log("Webhook: invoice succeeded", { uid });
        await setDoc(
          doc(db, "users", uid),
          cleanUndefinedDeep({
            isPro: true,
            plan: "pro",
            quota: {
              uploadsLimit: PRO_LIMIT,
            },
            stripe: {
              customerId: invoice.customer,
              subscriptionId,
              updatedAt: serverTimestamp(),
            },
            updatedAt: serverTimestamp(),
          }),
          { merge: true }
        );
      }
    }

    return NextResponse.json({ received: true });
  } catch (e: unknown) {
    console.error("Webhook error:", e);
    const detail = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: detail }, { status: 400 });
  }
}
