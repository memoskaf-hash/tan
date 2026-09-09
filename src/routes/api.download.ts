import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

export const Route = createFileRoute("/api/download")({
  server: { handlers: {
    POST: async ({ request }) => {
      const parsed = z.object({ fileId: z.string().uuid() }).safeParse(await request.json().catch(() => null));
      const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
      if (!parsed.success || !token) return Response.json({ error: "Authentication and fileId are required." }, { status: 400 });
      const { data: userData } = await supabaseAdmin.auth.getUser(token);
      if (!userData.user) return Response.json({ error: "Unauthorized." }, { status: 401 });
      const { data: file } = await supabaseAdmin.from("digital_files").select("storage_path, product_id").eq("id", parsed.data.fileId).single();
      if (!file) return Response.json({ error: "File not found." }, { status: 404 });
      const { data: purchase } = await supabaseAdmin.from("order_items").select("order_id, orders!inner(user_id,status)").eq("product_id", file.product_id).eq("orders.user_id", userData.user.id).in("orders.status", ["confirmed", "paid"]).limit(1).maybeSingle();
      const isAdmin = ["admin", "super_admin"].includes(String(userData.user.app_metadata?.role ?? ""));
      if (!purchase && !isAdmin) return Response.json({ error: "Purchase required." }, { status: 403 });
      const { data, error } = await supabaseAdmin.storage.from("product-assets").createSignedUrl(file.storage_path, 300);
      if (error) return Response.json({ error: "Unable to create download link." }, { status: 500 });
      return Response.json({ url: data.signedUrl, expiresIn: 300 });
    },
  } },
});
