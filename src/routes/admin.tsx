import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/admin")({ component: Admin });
type ProductRow = { id: string; title: string; price: number; approval_status?: string };
type OrderRow = { id: string; customer_name: string; total: number; status: string };
type VendorRow = { id: string; business_name: string; status: string };
type DisputeRow = { id: string; reason: string; status: string; created_at: string };

function Admin() {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<ProductRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const authorized = user?.app_metadata?.role === "admin" || user?.app_metadata?.role === "super_admin";
  useEffect(() => {
    if (!loading && authorized) {
      void Promise.all([
        (supabase as any).from("products").select("id,title,price,approval_status").then(({ data }: { data: ProductRow[] | null }) => setItems(data ?? [])),
        (supabase as any).from("orders").select("id,customer_name,total,status").order("created_at", { ascending: false }).then(({ data }: { data: OrderRow[] | null }) => setOrders(data ?? [])),
        (supabase as any).from("vendors").select("id,business_name,status").order("created_at", { ascending: false }).then(({ data }: { data: VendorRow[] | null }) => setVendors(data ?? [])),
        (supabase as any).from("disputes").select("id,reason,status,created_at").order("created_at", { ascending: false }).then(({ data }: { data: DisputeRow[] | null }) => setDisputes(data ?? [])),
      ]);
    }
  }, [authorized, loading]);
  if (loading) return <div className="p-12 text-center">جارٍ التحقق من الصلاحيات…</div>;
  if (!authorized) return <div className="p-12 text-center text-destructive">غير مصرح لك بالوصول إلى لوحة الإدارة.</div>;
  const revenue = orders.filter((order) => ["confirmed", "paid"].includes(order.status)).reduce((sum, order) => sum + Number(order.total), 0);
  const pendingProducts = items.filter((item) => item.approval_status === "pending");
  async function updateVendor(id: string, status: string) { await (supabase as any).from("vendors").update({ status }).eq("id", id); setVendors((current) => current.map((item) => item.id === id ? { ...item, status } : item)); }
  async function reviewProduct(id: string, approval_status: string) { await (supabase as any).from("products").update({ approval_status }).eq("id", id); setItems((current) => current.map((item) => item.id === id ? { ...item, approval_status } : item)); }
  async function updateDispute(id: string, status: string) { await (supabase as any).from("disputes").update({ status, resolved_at: ["resolved", "rejected"].includes(status) ? new Date().toISOString() : null }).eq("id", id); setDisputes((current) => current.map((item) => item.id === id ? { ...item, status } : item)); }
  function exportOrders() {
    const csv = ["id,customer,total,status", ...orders.map((order) => [order.id, `"${order.customer_name.replaceAll('"', '""')}"`, order.total, order.status].join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "joud-orders.csv"; link.click(); URL.revokeObjectURL(url);
  }
  return <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-3xl font-extrabold">لوحة الإدارة والتحكم</h1><button onClick={exportOrders} className="rounded-xl border px-4 py-2 text-sm font-semibold">تصدير المبيعات CSV</button></div>
    <div className="mt-8 grid gap-4 sm:grid-cols-4">{[["المنتجات", items.length], ["الطلبات", orders.length], ["المبيعات المؤكدة", `$${revenue.toFixed(2)}`], ["البائعون", vendors.length]].map(([label, value]) => <div key={String(label)} className="rounded-2xl border bg-card p-5"><span className="text-sm text-muted-foreground">{label}</span><strong className="mt-2 block text-3xl">{value}</strong></div>)}</div>
    <section className="mt-8 rounded-3xl border bg-card p-6"><h2 className="text-xl font-bold">البائعون</h2><div className="mt-4 divide-y">{vendors.map((vendor) => <div key={vendor.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><strong>{vendor.business_name}</strong><select value={vendor.status} onChange={(event) => void updateVendor(vendor.id, event.target.value)} className="rounded-lg border px-3 py-2 text-sm"><option value="pending">قيد المراجعة</option><option value="active">نشط</option><option value="suspended">موقوف</option></select></div>)}</div></section>
    <section className="mt-8 rounded-3xl border bg-card p-6"><h2 className="text-xl font-bold">مراجعة المنتجات ({pendingProducts.length})</h2><div className="mt-4 space-y-3">{pendingProducts.length === 0 ? <p className="text-sm text-muted-foreground">لا توجد منتجات معلقة.</p> : pendingProducts.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"><span>{item.title}</span><div className="flex gap-2"><button onClick={() => void reviewProduct(item.id, "approved")} className="rounded-lg bg-primary px-3 py-2 text-xs text-primary-foreground">اعتماد</button><button onClick={() => void reviewProduct(item.id, "rejected")} className="rounded-lg border border-destructive px-3 py-2 text-xs text-destructive">رفض</button></div></div>)}</div></section>
    <section className="mt-8 rounded-3xl border bg-card p-6"><h2 className="text-xl font-bold">مركز الاعتراضات</h2><div className="mt-4 space-y-3">{disputes.length === 0 ? <p className="text-sm text-muted-foreground">لا توجد اعتراضات.</p> : disputes.map((dispute) => <div key={dispute.id} className="rounded-xl border p-4"><div className="flex flex-wrap justify-between gap-3"><span className="text-xs text-muted-foreground">{new Date(dispute.created_at).toLocaleString("ar")}</span><select value={dispute.status} onChange={(event) => void updateDispute(dispute.id, event.target.value)} className="rounded-lg border px-2 py-1 text-xs"><option value="open">مفتوح</option><option value="investigating">قيد التحقيق</option><option value="resolved">تم الحل</option><option value="rejected">مرفوض</option></select></div><p className="mt-3 text-sm leading-7">{dispute.reason}</p></div>)}</div></section>
  </div>;
}
