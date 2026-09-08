import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PackageOpen, Download, Loader2, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/purchases")({
  head: () => ({
    meta: [
      { title: "مشترياتي | جود" },
      { name: "description", content: "كل طلباتك ومنتجاتك الرقمية في مكان واحد." },
      { property: "og:title", content: "مشترياتي | جود" },
      { property: "og:description", content: "كل طلباتك ومنتجاتك الرقمية في مكان واحد." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PurchasesPage,
});

interface OrderItem {
  id: string;
  product_id: string;
  product_title: string;
  price: number;
}

interface Order {
  id: string;
  total: number;
  status: string;
  created_at: string;
  order_items: OrderItem[];
}

function PurchasesPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [openingChat, setOpeningChat] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/auth", search: { redirect: "/purchases" } });
      return;
    }
    if (!user) return;
    supabase
      .from("orders")
      .select("id, total, status, created_at, order_items(id, product_title, price)")
      .order("created_at", { ascending: false })
      .then(({ data }) => setOrders((data as Order[] | null) ?? []));
  }, [user, loading, navigate]);

  async function contactSeller(orderId: string, productId: string) {
    if (!user) return;
    setOpeningChat(productId);
    const { data: product } = await (supabase as any).from("products").select("id,vendor_id").eq("id", productId).maybeSingle();
    if (!product?.vendor_id) {
      setOpeningChat(null);
      return;
    }
    const { data: vendor } = await (supabase as any).from("vendors").select("user_id").eq("id", product.vendor_id).maybeSingle();
    if (!vendor?.user_id) {
      setOpeningChat(null);
      return;
    }
    await (supabase as any).from("conversations").upsert(
      { order_id: orderId, product_id: productId, buyer_id: user.id, seller_id: vendor.user_id },
      { onConflict: "order_id,product_id,buyer_id,seller_id" },
    );
    setOpeningChat(null);
    navigate({ to: "/messages" });
  }

  if (loading || !user || orders === null) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-14">
      <h1 className="text-3xl font-bold">مشترياتي</h1>
      <p className="mt-2 text-muted-foreground">
        كل منتجاتك الرقمية وكورساتك — وصول مدى الحياة.
      </p>

      {orders.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <PackageOpen className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-bold">لا مشتريات بعد</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            تصفّح المتجر واختر أول منتج رقمي لك.
          </p>
          <Link
            to="/"
            className="mt-6 inline-block rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground hover:opacity-90"
          >
            تصفّح المنتجات
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-5">
          {orders.map((order) => (
            <li key={order.id} className="rounded-2xl border border-border bg-card p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    طلب بتاريخ{" "}
                    {new Date(order.created_at).toLocaleDateString("ar", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground" dir="ltr">
                    #{order.id.slice(0, 8)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {order.status === "confirmed" ? "مؤكد" : order.status}
                  </span>
                  <span className="font-bold">${order.total}</span>
                </div>
              </div>
              <ul className="mt-4 space-y-3">
                {order.order_items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                    <span>{item.product_title}</span>
                    <span className="inline-flex items-center gap-2 text-muted-foreground">
                      <span className="font-semibold text-foreground">${item.price}</span>
                      <button onClick={() => void contactSeller(order.id, item.product_id)} disabled={openingChat === item.product_id} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                        <MessageCircle className="h-3.5 w-3.5" /> {openingChat === item.product_id ? "جارٍ الفتح…" : "تواصل مع البائع"}
                      </button>
                      <span className="inline-flex items-center gap-1 text-xs">
                        <Download className="h-3.5 w-3.5" /> تحميل متاح
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
