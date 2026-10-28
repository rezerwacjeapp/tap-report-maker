/**
 * Cloudflare Worker entry for raporton.pl.
 * Static files (the app, landing, legal pages) are served from ./dist by Cloudflare;
 * this script runs only for /api/* (see run_worker_first in wrangler.jsonc):
 * /api/stripe-webhook (Stripe events) and /api/billing-portal ("Zarządzaj subskrypcją").
 */
import { handleStripeWebhook, type Env as WebhookEnv } from "../functions/api/stripe-webhook";
import { handleBillingPortal } from "../functions/api/billing-portal";

interface Env extends WebhookEnv {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname === "/api/stripe-webhook") return handleStripeWebhook(request, env);
    if (pathname === "/api/billing-portal") return handleBillingPortal(request, env);
    return env.ASSETS.fetch(request);
  },
};
