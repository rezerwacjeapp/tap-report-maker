/**
 * Stripe webhook for Cloudflare Pages Functions: POST /api/stripe-webhook
 *
 * Same logic as the Vercel version in api/stripe-webhook.ts, adapted to the
 * Workers runtime: Web Request/Response, env bindings instead of process.env,
 * a fetch-based Stripe client and Web Crypto signature verification.
 *
 * Set in Cloudflare (Settings → Variables and Secrets, as Secret):
 * STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_SERVICE_ROLE_KEY
 */
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export interface Env {
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}

const SUPABASE_URL = "https://iqlpnankcwiluvmollfr.supabase.co";

/**
 * Billing period of a subscription. Since API version 2025-03-31 (basil) Stripe
 * keeps current_period_start/end on the subscription items, not on the
 * subscription itself — the older top-level fields are only a fallback.
 */
export function periodOf(sub: Stripe.Subscription): { current_period_start: string | null; current_period_end: string | null } {
  const item = sub.items?.data?.[0];
  const legacy = sub as unknown as { current_period_start?: number; current_period_end?: number };
  const toISO = (t: unknown) => (typeof t === "number" && Number.isFinite(t) ? new Date(t * 1000).toISOString() : null);
  return {
    current_period_start: toISO(item?.current_period_start ?? legacy.current_period_start),
    current_period_end: toISO(item?.current_period_end ?? legacy.current_period_end),
  };
}

/** Stripe status → our status. past_due keeps access during Stripe's retry period. */
export function statusOf(sub: Stripe.Subscription): "active" | "cancelled" | "expired" {
  if (sub.status === "active" || sub.status === "trialing" || sub.status === "past_due") return "active";
  if (sub.status === "canceled") return "cancelled";
  return "expired";
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

/** fetchImpl is only swapped in tests; production uses the global fetch. */
export async function handleStripeWebhook(request: Request, env: Env, fetchImpl: typeof fetch = fetch): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: { Allow: "POST" } });
  }

  // 1. Read raw body and verify Stripe signature
  const sig = request.headers.get("stripe-signature");
  if (!sig) return new Response("Missing stripe-signature header", { status: 400 });
  const rawBody = await request.text();

  const stripe = new Stripe(env.STRIPE_SECRET_KEY || "", {
    httpClient: Stripe.createFetchHttpClient(fetchImpl),
  });

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      sig,
      env.STRIPE_WEBHOOK_SECRET || "",
      undefined,
      Stripe.createSubtleCryptoProvider(),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Webhook signature verification failed:", message);
    return new Response(`Webhook Error: ${message}`, { status: 400 });
  }

  const supabase = createClient(SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || "", {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: fetchImpl },
  });

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
          .update({ status: "cancelled", updated_at: new Date().toISOString() })
          .eq("autopay_subscription_id", subscription.id);
        if (error) throw error;

        console.log(`Subscription ${subscription.id} cancelled`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    // 500 → Stripe retries the event and marks the delivery as failed in the Dashboard,
    // so a broken activation is visible instead of silently lost.
    console.error("Error processing webhook event:", event.type, event.id, err);
    return json({ received: false }, 500);
  }

  return json({ received: true });
}

/** Cloudflare Pages entry point (all methods; non-POST gets 405). */
export const onRequest = (context: { request: Request; env: Env }) =>
  handleStripeWebhook(context.request, context.env);
