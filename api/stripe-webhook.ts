import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import type { IncomingMessage, ServerResponse } from "http";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

const supabase = createClient(
  "https://iqlpnankcwiluvmollfr.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// Disable Vercel's automatic body parsing — Stripe needs raw body for signature verification
export const config = {
  api: { bodyParser: false },
};

async function readRawBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

/**
 * Billing period of a subscription. Since API version 2025-03-31 (basil) Stripe
 * keeps current_period_start/end on the subscription items, not on the
 * subscription itself — the older top-level fields are only a fallback.
 */
function periodOf(sub: Stripe.Subscription): { current_period_start: string | null; current_period_end: string | null } {
  const item = sub.items?.data?.[0];
  const legacy = sub as unknown as { current_period_start?: number; current_period_end?: number };
  const toISO = (t: unknown) => (typeof t === "number" && Number.isFinite(t) ? new Date(t * 1000).toISOString() : null);
  return {
    current_period_start: toISO(item?.current_period_start ?? legacy.current_period_start),
    current_period_end: toISO(item?.current_period_end ?? legacy.current_period_end),
  };
}

/** Stripe status → our status. past_due keeps access during Stripe's retry period. */
function statusOf(sub: Stripe.Subscription): "active" | "cancelled" | "expired" {
  if (sub.status === "active" || sub.status === "trialing" || sub.status === "past_due") return "active";
  if (sub.status === "canceled") return "cancelled";
  return "expired";
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "POST") {
    res.writeHead(405, { Allow: "POST" });
    res.end("Method Not Allowed");
    return;
  }

  // 1. Read raw body and verify Stripe signature
  const rawBody = await readRawBody(req);
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    res.writeHead(400);
    res.end("Missing stripe-signature header");
    return;
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    res.writeHead(400);
    res.end(`Webhook Error: ${err.message}`);
    return;
  }

  // 2. Handle the event
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        const subscriptionId =
          typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

        if (!userId || !subscriptionId) {
          console.warn("checkout.session.completed: missing userId or subscriptionId");
          break;
        }

        // Verify the user actually exists in Supabase Auth
        const { data: userCheck, error: userError } = await supabase.auth.admin.getUserById(userId);
        if (userError || !userCheck?.user) {
          console.error(`checkout.session.completed: user ${userId} not found in auth`);
          break;
        }

        // Get subscription details from Stripe
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        // Check if user already has a subscription row
        const { data: existing, error: findError } = await supabase
          .from("subscriptions")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();
        if (findError) throw findError;

        const subData = {
          user_id: userId,
          plan: "solo",
          status: statusOf(subscription),
          ...periodOf(subscription),
          autopay_subscription_id: subscriptionId, // stores Stripe subscription ID
          updated_at: new Date().toISOString(),
        };

        const { error: saveError } = existing
          ? await supabase.from("subscriptions").update(subData).eq("id", existing.id)
          : await supabase.from("subscriptions").insert(subData);
        if (saveError) throw saveError;

        console.log(`Subscription activated for user ${userId}`);
        break;
      }

      case "customer.subscription.updated": {
        // Events can arrive out of order — read the current state from Stripe
        const fromEvent = event.data.object as Stripe.Subscription;
        const subscription = await stripe.subscriptions.retrieve(fromEvent.id);
        const status = statusOf(subscription);

        const { error } = await supabase
          .from("subscriptions")
          .update({ status, ...periodOf(subscription), updated_at: new Date().toISOString() })
          .eq("autopay_subscription_id", subscription.id);
        if (error) throw error;

        console.log(`Subscription ${subscription.id} updated: ${status}`);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        const { error } = await supabase
          .from("subscriptions")
          .update({
            status: "cancelled",
            updated_at: new Date().toISOString(),
          })
          .eq("autopay_subscription_id", subscription.id);
        if (error) throw error;

        console.log(`Subscription ${subscription.id} cancelled`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (err: any) {
    // 500 → Stripe retries the event and marks the delivery as failed in the Dashboard,
    // so a broken activation is visible instead of silently lost.
    console.error("Error processing webhook event:", event.type, event.id, err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ received: false }));
    return;
  }

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ received: true }));
}
