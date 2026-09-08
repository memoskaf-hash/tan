import { createFileRoute } from "@tanstack/react-router";
import { Copy, ExternalLink, Gift, Link2, MousePointerClick, Wallet } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/affiliate")({ component: AffiliatePage });

type Referral = { id: string; code: string; clicks: number; conversions: number; earnings: number; vendor_id?: string };
type Vendor = { id: string; business_name: string; status: string; payout_currency: string };

function AffiliatePage() {
  const { user } = useAuth();
  const [referral, setReferral] = useState<Referral | null>(null);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<{ id: string; title: string; price: number; slug: string }[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const client = supabase as any;
      const [{ data: ref }, { data: ven }, { data: catalog }] = await Promise.all([
        client.from("referrals").select("*").eq("affiliate_id", user.id).eq("status", "active").maybeSingle(),
        client.from("vendors").select("id,business_name,status,payout_currency").eq("user_id", user.id).maybeSingle(),
        client.from("products").select("id,title,price,slug").limit(12),
      ]);
      setReferral(ref);
      setVendor(ven);
      setProducts(catalog ?? []);
    })();
  }, [user]);

  async function createReferral() {
    if (!user) return;
    setBusy(true);
    const session = await supabase.auth.getSession();
    const response = await fetch("/api/affiliate-referral", { method: "POST", headers: { Authorization: `Bearer ${session.data.session?.access_token ?? ""}` } });
    const result = await response.json();
    setBusy(false);
    if (!response.ok) alert("تعذر إنشاء الرابط حالياً. قد يكون لديك رابط موجود بالفعل.");
    else setReferral(result.referral);
  }

  const link = referral && `${window.location.origin}/?ref=${encodeURIComponent(referral.code)}`;
  if (!user) return <div className="mx-auto max-w-4xl px-4 py-14"><Gift className="h-10 w-10 text-primary" /><h1 className="mt-3 text-3xl font-bold">شراكات البائعين</h1><p className="mt-2 rounded-xl bg-muted p-4">سجّل الدخول لعرض لوحة الشراكة الخاصة بك.</p></div>;

  return <div className="mx-auto max-w-6xl px-4 py-12" dir="rtl">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-medium text-primary">Vendor / Affiliate Partnership</p><h1 className="mt-2 text-3xl font-bold">لوحة الشراكة</h1><p className="mt-2 text-muted-foreground">روابط آمنة، إحالة موثوقة، واحتساب عمولات من الخادم فقط.</p></div>{vendor && <span className="rounded-full border px-3 py-1 text-sm">{vendor.business_name} · {vendor.status}</span>}</div>
    {!referral ? <div className="mt-8 rounded-2xl border bg-card p-6"><h2 className="text-xl font-semibold">ابدأ التسويق</h2><p className="mt-2 text-muted-foreground">أنشئ رابط إحالة فريد لمشاركة المنتجات.</p><button disabled={busy} onClick={createReferral} className="mt-5 rounded-xl bg-primary px-5 py-3 text-primary-foreground">{busy ? "جارٍ الإنشاء..." : "إنشاء رابط الإحالة"}</button></div> :
      <><div className="mt-8 rounded-2xl border bg-card p-6"><label className="text-sm font-medium">رابطك (وكود الخصم: {referral.code})</label><div className="mt-2 flex gap-2" dir="ltr"><input readOnly value={link ?? ""} className="min-w-0 flex-1 rounded-lg border bg-muted p-3" /><button aria-label="نسخ الرابط" onClick={() => navigator.clipboard.writeText(link ?? "")} className="rounded-lg border p-3"><Copy className="h-4 w-4" /></button></div></div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3"><Metric icon={<MousePointerClick />} label="النقرات" value={referral.clicks ?? 0} /><Metric icon={<Link2 />} label="التحويلات" value={referral.conversions ?? 0} /><Metric icon={<Wallet />} label="الأرباح المعلّقة" value={`${vendor?.payout_currency ?? "USD"} ${Number(referral.earnings ?? 0).toFixed(2)}`} /></div>
        <section className="mt-8"><h2 className="text-xl font-semibold">المنتجات المتاحة للترويج</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{products.map((product) => <div key={product.id} className="flex items-center justify-between rounded-xl border p-4"><div><p className="font-medium">{product.title}</p><p className="text-sm text-muted-foreground">${product.price}</p></div><a className="rounded-lg border p-2" href={`${link}&product=${product.slug}`} target="_blank" rel="noreferrer" aria-label="فتح رابط المنتج"><ExternalLink className="h-4 w-4" /></a></div>)}</div></section>
      </>}
    <p className="mt-10 text-xs text-muted-foreground">العمولة تتدرج تلقائياً: خصم المنصة 15% أساساً، 12% عند 101–500، و8% بعد 501. تتم مراجعة الاستردادات والاحتيال قبل الدفع.</p>
  </div>;
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return <div className="rounded-2xl border bg-card p-5"><div className="flex items-center gap-2 text-primary">{icon}<span className="text-sm text-muted-foreground">{label}</span></div><b className="mt-3 block text-2xl">{value}</b></div>;
}
