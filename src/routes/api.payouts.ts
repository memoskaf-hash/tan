import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
const schema = z.object({ vendorId: z.string().uuid(), amount: z.number().positive().max(100000), currency: z.string().length(3).default("USD") });
export const Route = createFileRoute("/api/payouts")({
  server: { handlers: {
    GET: async ({ request }) => { const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, ""); if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 }); const { data } = await supabaseAdmin.auth.getUser(token); if (!data.user) return Response.json({ error: "Unauthorized" }, { status: 401 }); const vendor = await supabaseAdmin.from("vendors").select("id").eq("user_id", data.user.id).maybeSingle(); if (!vendor.data) return Response.json({ error: "Vendor account required" }, { status: 403 }); const result = await supabaseAdmin.from("payouts").select("*").eq("vendor_id", vendor.data.id).order("requested_at", { ascending: false }); return Response.json({ payouts: result.data ?? [] }); },
    POST: async ({ request }) => {
      const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
      if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });
      const { data: auth } = await supabaseAdmin.auth.getUser(token);
      const parsed = schema.safeParse(await request.json().catch(() => null));
      if (!auth.user || !parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
      const vendor = await supabaseAdmin.from("vendors").select("id").eq("id", parsed.data.vendorId).eq("user_id", auth.user.id).maybeSingle();
      if (!vendor.data) return Response.json({ error: "Forbidden" }, { status: 403 });
      const [credits, debits, payouts] = await Promise.all([
        supabaseAdmin.from("commission_ledger").select("amount").eq("vendor_id", vendor.data.id).eq("currency", parsed.data.currency).in("entry_type", ["credit", "adjustment"]).in("status", ["available", "pending"]),
        supabaseAdmin.from("commission_ledger").select("amount").eq("vendor_id", vendor.data.id).eq("currency", parsed.data.currency).in("entry_type", ["debit", "clawback", "payout"]),
        supabaseAdmin.from("payouts").select("amount").eq("vendor_id", vendor.data.id).eq("currency", parsed.data.currency).in("status", ["requested", "processing", "paid"]),
      ]);
      const sum = (rows: { amount: number }[] | null) => (rows ?? []).reduce((total, row) => total + Number(row.amount), 0);
      const available = sum(credits.data) - sum(debits.data) - sum(payouts.data);
      if (parsed.data.amount > available) return Response.json({ error: "Payout exceeds available commission balance." }, { status: 422 });
      const { data, error } = await supabaseAdmin.from("payouts").insert({ ...parsed.data, vendor_id: vendor.data.id }).select().single();
      return error ? Response.json({ error: "Payout unavailable" }, { status: 409 }) : Response.json({ payout: data }, { status: 201 });
    },
  } },
});
