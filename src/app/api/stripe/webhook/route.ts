// src/app/api/stripe/webhook/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/firebase";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

export const runtime = "nodejs";

const PRO_LIMIT = 10000;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// Safely normalize subscription ID across Stripe object variants
function normalizeSubscriptionId(sub: unknown): string | null {
  if (!sub) return null;
  if (typeof sub === "string") return sub;
  if (typeof sub === "object" && sub !== null && "id" in sub) {
    return String((sub as any).id);
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const sig = req.headers.get("stripe-signature");
    if (!sig) {
      return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
    }

    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
      console.error("Stripe env vars missing");
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
    }

    const body = await req.text();

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
    });

    const event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    // ✅ Checkout completed (first purchase)
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const uid =
        session.client_reference_id ||
        (session.metadata?.uid as string | undefined);

      if (uid) {
        const subscriptionId = normalizeSubscriptionId((session as any).subscription);
        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : (session.customer as any)?.id ?? null;

        console.log("Stripe checkout completed", { uid, subscriptionId });

        await setDoc(
          doc(db, "users", uid),
          {
            isPro: true,
            plan: "pro",
            quota: {
              day: today(),
              uploadsUsed: 0,
              uploadsLimit: PRO_LIMIT,
            },
            stripe: {
              customerId,
              subscriptionId,
              updatedAt: serverTimestamp(),
            },
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
    }

    // ✅ Recurring invoice payment
    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;

      const uid = invoice.metadata?.uid as string | undefined;

      if (uid) {
        const subscriptionId = normalizeSubscriptionId((invoice as any).subscription);
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : (invoice.customer as any)?.id ?? null;

        console.log("Stripe invoice succeeded", { uid, subscriptionId });

        await setDoc(
          doc(db, "users", uid),
          {
            isPro: true,
            plan: "pro",
            quota: {
              uploadsLimit: PRO_LIMIT,
            },
            stripe: {
              customerId,
              subscriptionId,
              updatedAt: serverTimestamp(),
            },
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    console.error("Stripe webhook error:", err);
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: detail }, { status: 400 });
  }
}
