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
        const subscriptionId = session.subscription as string;

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
        const { data: existing } = await supabase
          .from("subscriptions")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();

        const subData = {
          user_id: userId,
          plan: "solo",
          status: "active",
          current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
          current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
          autopay_subscription_id: subscriptionId, // stores Stripe subscription ID
          updated_at: new Date().toISOString(),
        };

        if (existing) {
          await supabase
            .from("subscriptions")
            .update(subData)
            .eq("id", existing.id);
        } else {
          await supabase.from("subscriptions").insert(subData);
        }

        console.log(`Subscription activated for user ${userId}`);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const stripeSubId = subscription.id;

        const status =
          subscription.status === "active" ? "active" :
          subscription.status === "past_due" ? "active" : // still allow during grace period
          "expired";

        await supabase
          .from("subscriptions")
          .update({
            status,
            current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
            current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("autopay_subscription_id", stripeSubId);

        console.log(`Subscription ${stripeSubId} updated: ${status}`);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        await supabase
          .from("subscriptions")
          .update({
            status: "cancelled",
            updated_at: new Date().toISOString(),
          })
          .eq("autopay_subscription_id", subscription.id);

        console.log(`Subscription ${subscription.id} cancelled`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (err: any) {
    console.error("Error processing webhook event:", err);
    // Still return 200 to avoid Stripe retries for processing errors
  }

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ received: true }));
}
