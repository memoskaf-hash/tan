import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const schema = z.object({ orderId: z.string().uuid(), referralCode: z.string().min(3), idempotencyKey: z.string().min(8).max(120), currency: z.string().length(3).default("USD") });

function serverExchangeRate(currency: string): number | null {
  if (currency === "USD") return 1;
  try {
    const rates = JSON.parse(process.env.AFFILIATE_FX_RATES_JSON ?? "{}") as Record<string, unknown>;
    const rate = rates[currency];
    return typeof rate === "number" && Number.isFinite(rate) && rate > 0 ? rate : null;
  } catch (error) {
    console.error("[affiliate] invalid AFFILIATE_FX_RATES_JSON", error);
    return null;
  }
}
export const Route = createFileRoute("/api/affiliate-conversion")({
  server: { handlers: { POST: async ({ request }) => {
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return Response.json({ error: "Invalid conversion." }, { status: 400 });
    const input = parsed.data;
    const exchangeRate = serverExchangeRate(input.currency);
    if (exchangeRate === null) return Response.json({ error: "Currency conversion is not configured for this currency." }, { status: 503 });
    const existing = await supabaseAdmin.from("affiliate_sales").select("*").eq("idempotency_key", input.idempotencyKey).maybeSingle();
    if (existing.data) return Response.json({ sale: existing.data, idempotent: true });
    const [{ data: referral }, { data: order }] = await Promise.all([
      supabaseAdmin.from("referrals").select("id,affiliate_id,vendor_id").eq("code", input.referralCode).eq("status", "active").maybeSingle(),
      supabaseAdmin.from("orders").select("id,user_id,total,status,country").eq("id", input.orderId).maybeSingle(),
    ]);
    if (!referral?.vendor_id || !order || !["paid", "confirmed"].includes(order.status)) return Response.json({ error: "Conversion cannot be attributed." }, { status: 409 });
    if (referral.affiliate_id === order.user_id) {
      await supabaseAdmin.from("fraud_flags").insert({ vendor_id: referral.vendor_id, referral_id: referral.id, reason: "self_referral", severity: "high" });
      return Response.json({ error: "Self-referrals are not eligible." }, { status: 422 });
    }
    const { data: tier } = await supabaseAdmin.rpc("evaluate_affiliate_tier", { p_gross: order.total }).maybeSingle();
    const platformCut = Number(tier?.platform_cut_percent ?? 15);
    const gross = Number(order.total);
    const platformFee = Math.round(gross * platformCut) / 100;
    const commission = Math.round((gross - platformFee) * exchangeRate * 100) / 100;
    const { data: sale, error } = await supabaseAdmin.from("affiliate_sales").insert({ referral_id: referral.id, vendor_id: referral.vendor_id, order_id: order.id, customer_id: order.user_id, currency: input.currency, gross_amount: gross, platform_fee_amount: platformFee, commission_amount: commission, exchange_rate: exchangeRate, tier_id: tier?.tier_id ?? null, idempotency_key: input.idempotencyKey, status: "pending" }).select().single();
    if (error) return Response.json({ error: "Conversion already recorded or unavailable." }, { status: 409 });
    await supabaseAdmin.from("commission_ledger").insert({ vendor_id: referral.vendor_id, affiliate_sale_id: sale.id, entry_type: "credit", amount: commission, currency: input.currency, description: "Affiliate sale pending approval", idempotency_key: `sale:${sale.id}` });
    return Response.json({ sale });
  } } },
});
