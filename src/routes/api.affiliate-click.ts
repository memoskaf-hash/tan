import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { createHash } from "node:crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const inputSchema = z.object({ code: z.string().min(3).max(80), path: z.string().max(500).optional() });
const digest = (value: string) => createHash("sha256").update(value).digest("hex");

export const Route = createFileRoute("/api/affiliate-click")({
  server: { handlers: { POST: async ({ request }) => {
    const parsed = inputSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return Response.json({ error: "Invalid referral." }, { status: 400 });
    const referral = await supabaseAdmin.from("referrals").select("id,affiliate_id,vendor_id").eq("code", parsed.data.code).eq("status", "active").maybeSingle();
    if (referral.error || !referral.data) return Response.json({ error: "Referral not found." }, { status: 404 });
    const userAgent = request.headers.get("user-agent") ?? "unknown";
    const forwarded = request.headers.get("x-forwarded-for") ?? "unknown";
    const visitorHash = digest(`${forwarded}|${userAgent}`);
    const recent = await supabaseAdmin.from("referral_clicks").select("id").eq("referral_id", referral.data.id).eq("visitor_hash", visitorHash).gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()).limit(1);
    if (!recent.data?.length) await supabaseAdmin.from("referral_clicks").insert({ referral_id: referral.data.id, visitor_hash: visitorHash, ip_hash: digest(forwarded), user_agent_hash: digest(userAgent), landing_path: parsed.data.path ?? "/" });
    return Response.json({ ok: true });
  } } },
});
