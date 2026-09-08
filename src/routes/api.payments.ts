import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const schema = z.object({
  provider: z.enum(["stripe", "paypal", "moyasar"]),
  amount: z.number().positive().max(100000),
  currency: z.string().length(3).default("USD"),
  description: z.string().min(1).max(200),
  orderId: z.string().uuid().optional(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

const configured = (provider: string) =>
  provider === "stripe" ? Boolean(process.env.STRIPE_SECRET_KEY) :
  provider === "paypal" ? Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) :
  Boolean(process.env.MOYASAR_API_KEY);

export const Route = createFileRoute("/api/payments")({
  server: { handlers: {
    GET: () => Response.json({ providers: { stripe: configured("stripe"), paypal: configured("paypal"), moyasar: configured("moyasar") } }),
    POST: async ({ request }) => {
      const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
      if (!bearer) return Response.json({ error: "Authentication is required to start a payment." }, { status: 401 });
      const { data: authData } = await supabaseAdmin.auth.getUser(bearer);
      if (!authData.user) return Response.json({ error: "Unauthorized." }, { status: 401 });
      const parsed = schema.safeParse(await request.json().catch(() => null));
      if (!parsed.success) return Response.json({ error: "Invalid payment request." }, { status: 400 });
      const input = parsed.data;
      if (!configured(input.provider)) return Response.json({ error: `${input.provider} is not configured on the server.` }, { status: 503 });
      try {
        if (input.provider === "stripe") {
          const body = new URLSearchParams({
            mode: "payment", success_url: input.successUrl, cancel_url: input.cancelUrl,
            "line_items[0][price_data][currency]": input.currency.toLowerCase(),
            "line_items[0][price_data][product_data][name]": input.description,
            "line_items[0][price_data][unit_amount]": String(Math.round(input.amount * 100)),
            "line_items[0][quantity]": "1",
          });
          if (input.orderId) body.set("metadata[order_id]", input.orderId);
          if (input.orderId) body.set("client_reference_id", input.orderId);
          const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
            method: "POST",
            headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, "content-type": "application/x-www-form-urlencoded" },
            body,
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error?.message ?? "Stripe request failed");
          return Response.json({ redirectUrl: data.url, sessionId: data.id, status: "pending_verification" });
        }
        if (input.provider === "paypal") {
          const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64");
          const base = process.env.PAYPAL_API_BASE ?? "https://api-m.sandbox.paypal.com";
          const tokenResponse = await fetch(`${base}/v1/oauth2/token`, { method: "POST", headers: { Authorization: `Basic ${auth}`, "content-type": "application/x-www-form-urlencoded" }, body: "grant_type=client_credentials" });
          const token = await tokenResponse.json();
          if (!tokenResponse.ok) throw new Error("PayPal authentication failed");
          const response = await fetch(`${base}/v2/checkout/orders`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token.access_token}`, "content-type": "application/json" },
            body: JSON.stringify({ intent: "CAPTURE", purchase_units: [{ amount: { currency_code: input.currency, value: input.amount.toFixed(2) }, description: input.description }], application_context: { return_url: input.successUrl, cancel_url: input.cancelUrl } }),
          });
          const data = await response.json();
          if (!response.ok) throw new Error("PayPal order creation failed");
          return Response.json({ redirectUrl: data.links?.find((link: { rel: string }) => link.rel === "approve")?.href, sessionId: data.id, status: "pending_verification" });
        }
        const response = await fetch("https://api.moyasar.com/v1/payments", {
          method: "POST",
          headers: { Authorization: `Basic ${Buffer.from(`${process.env.MOYASAR_API_KEY}:`).toString("base64")}`, "content-type": "application/json" },
          body: JSON.stringify({ amount: Math.round(input.amount * 100), currency: input.currency, description: input.description, callback_url: input.successUrl }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message ?? "Moyasar request failed");
        return Response.json({ redirectUrl: data.source?.transaction_url, sessionId: data.id, status: "pending_verification" });
      } catch (error) {
        return Response.json({ error: error instanceof Error ? error.message : "Payment provider error." }, { status: 502 });
      }
    },
  } },
});
