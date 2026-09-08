import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

function verify(raw: string, signature: string, secret: string) {
  const timestamp = signature.match(/(?:^|,)t=(\d+)/)?.[1];
  const provided = signature.match(/(?:^|,)v1=([a-f0-9]+)/)?.[1];
  if (!timestamp || !provided || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${raw}`).digest("hex");
  return expected.length === provided.length && timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
}

export const Route = createFileRoute("/api/payment-webhooks")({
  server: { handlers: {
    POST: async ({ request }) => {
      const provider = new URL(request.url).searchParams.get("provider");
      const raw = await request.text();
      let event: Record<string, unknown>;
      try { event = JSON.parse(raw) as Record<string, unknown>; } catch { return Response.json({ error: "Invalid JSON." }, { status: 400 }); }
      if (provider === "stripe") {
        const secret = process.env.STRIPE_WEBHOOK_SECRET;
        const signature = request.headers.get("stripe-signature");
        if (!secret || !signature) return Response.json({ error: "Stripe webhook verification is not configured." }, { status: 503 });
        if (!verify(raw, signature, secret)) return Response.json({ error: "Invalid Stripe signature." }, { status: 401 });
      } else if (provider === "paypal") {
        return Response.json({ error: "PayPal verification requires PAYPAL_WEBHOOK_ID and provider verification API; fulfillment is disabled." }, { status: 501 });
      } else if (provider === "moyasar") {
        const secret = process.env.MOYASAR_WEBHOOK_SECRET;
        if (!secret) return Response.json({ error: "Moyasar webhook verification is not configured." }, { status: 503 });
        const signature = request.headers.get("x-moyasar-signature");
        if (!signature || !verify(raw, `t=${Math.floor(Date.now() / 1000)},v1=${signature}`, secret)) return Response.json({ error: "Invalid Moyasar signature." }, { status: 401 });
      } else return Response.json({ error: "provider must be stripe, paypal, or moyasar." }, { status: 400 });
      const data = (event.data as { object?: Record<string, unknown> } | undefined)?.object ?? event;
      const reference = String(data.id ?? data.payment_id ?? data.order_id ?? "");
      const kind = String(event.type ?? data.status ?? "").toLowerCase();
      const paid = ["paid", "succeeded", "completed", "captured"].some((value) => kind.includes(value));
      const metadata = (data.metadata as Record<string, unknown> | undefined) ?? {};
      const orderId = String(metadata.order_id ?? data.client_reference_id ?? "");
      if (orderId) {
        await supabaseAdmin.from("orders").update({ status: paid ? "paid" : "payment_failed", provider: provider ?? "stripe", provider_reference: reference }).eq("id", orderId);
      } else if (reference) {
        await supabaseAdmin.from("orders").update({ status: paid ? "paid" : "payment_failed", provider: provider ?? "stripe", provider_reference: reference }).eq("provider_reference", reference);
      }
      const notificationUrl = process.env.EMAIL_AUTOMATION_WEBHOOK_URL;
      if (notificationUrl && (paid || kind.includes("refund") || kind.includes("abandon"))) {
        await fetch(notificationUrl, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ event: paid ? "receipt" : kind.includes("refund") ? "refund" : "abandoned_cart", provider, reference }) }).catch((error) => console.error("[notifications] webhook failed", error));
      } else if (!notificationUrl) {
        console.warn("[notifications] EMAIL_AUTOMATION_WEBHOOK_URL is not configured; no email was sent.");
      }
      return Response.json({ received: true, verified: true, status: paid ? "paid" : "ignored" });
    },
  } },
});
