import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/affiliate-referral")({
  server: { handlers: { POST: async ({ request }) => {
    const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const { data: auth } = await supabaseAdmin.auth.getUser(token);
    if (!auth.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    await supabaseAdmin.from("vendors").upsert({ user_id: auth.user.id, business_name: "Partner", status: "pending" }, { onConflict: "user_id", ignoreDuplicates: true });
    const vendor = await supabaseAdmin.from("vendors").select("id").eq("user_id", auth.user.id).maybeSingle();
    if (!vendor.data) return Response.json({ error: "Vendor setup unavailable." }, { status: 503 });
    const existing = await supabaseAdmin.from("referrals").select("*").eq("affiliate_id", auth.user.id).eq("status", "active").maybeSingle();
    if (existing.data) return Response.json({ referral: existing.data });
    const code = `REF-${auth.user.id.slice(0, 8).toUpperCase()}`;
    const { data, error } = await supabaseAdmin.from("referrals").insert({ affiliate_id: auth.user.id, vendor_id: vendor.data.id, code, coupon_code: code }).select().single();
    return error ? Response.json({ error: "Referral unavailable." }, { status: 409 }) : Response.json({ referral: data }, { status: 201 });
  } } },
});
