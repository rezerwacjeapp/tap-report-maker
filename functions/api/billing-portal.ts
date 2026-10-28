/**
 * Stripe customer portal for the signed-in user: POST /api/billing-portal
 *
 * The app sends the user's Supabase access token. The Worker finds that user's
 * subscription and opens the Stripe portal for the Stripe customer who paid for it.
 * So "Zarządzaj subskrypcją" works even when the payment was made with another email
 * than the RaportON account - Stripe's own portal login link only emails a link to
 * the address used at checkout.
 *
 * Uses the webhook's secrets: STRIPE_SECRET_KEY (restricted key with Subscriptions: Read
 * and Customer portal: Write) and SUPABASE_SERVICE_ROLE_KEY.
 */
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import type { Env } from "./stripe-webhook";

// Supabase project "raporton" (raporton.pl), the same as in stripe-webhook.ts
const SUPABASE_URL = "https://iqlpnankcwiluvmollfr.supabase.co";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

/** fetchImpl is only swapped in tests; production uses the global fetch. */
export async function handleBillingPortal(request: Request, env: Env, fetchImpl: typeof fetch = fetch): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: { Allow: "POST" } });
  }

  // 1. Who is asking: the Supabase session of the app (a header, not a cookie, so no CSRF)
  const token = /^Bearer\s+(\S+)$/i.exec((request.headers.get("authorization") || "").trim())?.[1];
  if (!token) return json({ error: "not_signed_in" }, 401);
  if (!env.SUPABASE_SERVICE_ROLE_KEY || !env.STRIPE_SECRET_KEY) {
    console.error("billing-portal: STRIPE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY is not set");
    return json({ error: "server_error" }, 500);
  }
  try {
    return await openPortal(request, env, token, fetchImpl);
  } catch (err) {
    console.error("billing-portal:", err instanceof Error ? err.message : String(err));
    return json({ error: "server_error" }, 500);
  }
}

async function openPortal(request: Request, env: Env, token: string, fetchImpl: typeof fetch): Promise<Response> {
  const supabase = createClient(SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: fetchImpl },
  });
  const { data: auth, error: authError } = await supabase.auth.getUser(token);
  if (authError || !auth?.user) return json({ error: "not_signed_in" }, 401);

  // 2. That user's subscription (saved by the webhook)
  const { data: sub, error: subError } = await supabase
    .from("subscriptions")
    .select("autopay_subscription_id")
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (subError) {
    console.error("billing-portal: reading subscription failed:", subError.message);
    return json({ error: "server_error" }, 500);
  }
  if (!sub?.autopay_subscription_id) return json({ error: "no_subscription" }, 404);

  // 3. Portal session for the Stripe customer of that subscription
  const stripe = new Stripe(env.STRIPE_SECRET_KEY!, {
    httpClient: Stripe.createFetchHttpClient(fetchImpl),
  });
  try {
    const subscription = await stripe.subscriptions.retrieve(sub.autopay_subscription_id);
    const customer = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
    const session = await stripe.billingPortal.sessions.create({
      customer,
      return_url: `${new URL(request.url).origin}/upgrade`,
    });
    return json({ url: session.url });
  } catch (err) {
    // e.g. the key lacks "Customer portal: Write" - Stripe's message names the missing permission
    console.error("billing-portal: Stripe error:", err instanceof Error ? err.message : String(err));
    return json({ error: "stripe_error" }, 502);
  }
}
