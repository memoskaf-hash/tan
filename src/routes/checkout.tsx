import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, CheckCircle2, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "إتمام الشراء | جود" },
      { name: "description", content: "أكمل بياناتك واحصل على روابط التحميل فور إتمام الدفع." },
      { property: "og:title", content: "إتمام الشراء | جود" },
      { property: "og:description", content: "دفع آمن وتحميل فوري للمنتجات الرقمية." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { items, total, clear } = useCart();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [provider, setProvider] = useState<"stripe" | "paypal" | "moyasar" | "manual">("manual");
  const [available, setAvailable] = useState<Record<string, boolean>>({});
  const [invoice, setInvoice] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState("");
  useEffect(() => {
    fetch("/api/payments").then((response) => response.ok ? response.json() : null)
      .then((data) => data && setAvailable(data.providers)).catch(() => setAvailable({}));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <ShieldCheck className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-4 text-2xl font-bold">سجّل دخولك لإتمام الشراء</h1>
        <p className="mt-3 text-muted-foreground">
          نحفظ مشترياتك في حسابك لتصل إليها في أي وقت ومن أي جهاز.
        </p>
        <button
          onClick={() => navigate({ to: "/auth", search: { redirect: "/checkout" } })}
          className="mt-6 rounded-xl bg-primary px-8 py-3 font-semibold text-primary-foreground hover:opacity-90"
        >
          تسجيل الدخول / إنشاء حساب
        </button>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    try {
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          customer_name: name,
          country,
          total,
          status: provider === "manual" ? "pending" : "pending",
          provider: provider === "manual" ? null : provider,
        })
        .select("id")
        .single();
      if (orderError) throw orderError;
      const { error: itemsError } = await supabase.from("order_items").insert(
        items.map(({ product }) => ({
          order_id: order.id,
          product_id: product.id,
          product_title: product.title,
          price: product.price,
        })),
      );
      if (itemsError) throw itemsError;
      if (provider !== "manual") {
        const response = await fetch("/api/payments", {
          method: "POST",
          headers: { "content-type": "application/json", Authorization: `Bearer ${ (await supabase.auth.getSession()).data.session?.access_token ?? "" }` },
          body: JSON.stringify({
            provider, amount: total, currency: "USD",
            orderId: order.id,
            description: items.map(({ product }) => product.title).join(", "),
            successUrl: `${window.location.origin}/checkout?payment=success`,
            cancelUrl: `${window.location.origin}/checkout?payment=cancelled`,
          }),
        });
        const payment = await response.json();
        if (!response.ok) throw new Error(payment.error ?? "تعذر بدء الدفع");
        if (!payment.redirectUrl) throw new Error("لم يرسل مزود الدفع رابطًا صالحًا");
        window.location.assign(payment.redirectUrl);
        return;
      }
      clear();
      setOrderId(order.id);
      setInvoice(`INV-${order.id.slice(0, 8).toUpperCase()}`);
      setDone(true);
      toast.success("تم تسجيل طلبك بنجاح");
    } catch {
      toast.error("تعذّر حفظ الطلب، حاول مجددًا");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
        <h1 className="mt-6 text-3xl font-bold">تم تأكيد طلبك</h1>
        <p className="mt-3 text-muted-foreground">
          تم حفظ طلبك في حسابك — يمكنك الوصول إلى منتجاتك من صفحة مشترياتك في أي وقت.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/purchases"
            className="rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground hover:opacity-90"
          >
            عرض مشترياتي
          </Link>
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Download className="h-4 w-4" /> التحميل متاح مدى الحياة
          </span>
          {invoice && <button onClick={() => window.print()} className="rounded-xl border px-4 py-3 text-sm">طباعة الفاتورة {invoice}</button>}
        </div>
        <div className="mx-auto mt-8 max-w-md rounded-xl border p-4 text-right">
          <label className="text-sm font-semibold">طلب إلغاء/استرداد</label>
          <textarea value={refundReason} onChange={e => setRefundReason(e.target.value)} className="mt-2 w-full rounded-lg border p-2" placeholder="اذكر السبب" />
          <button onClick={async () => { if (!refundReason || !user || !orderId) return; const { error } = await (supabase as any).from("refund_requests").insert({ order_id: orderId, user_id: user.id, reason: refundReason }); toast(error ? "تعذر إرسال الطلب" : "تم إرسال الطلب للمراجعة"); }} className="mt-2 rounded-lg border px-3 py-2 text-sm">إرسال الطلب</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-14">
      <h1 className="text-3xl font-bold">إتمام الشراء</h1>

      {items.length === 0 ? (
        <p className="mt-8 text-muted-foreground">
          سلتك فارغة.{" "}
          <Link to="/" className="text-primary hover:underline">
            تصفّح المنتجات
          </Link>
        </p>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-5">
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-2xl border border-border bg-card p-6 lg:col-span-3"
          >
            <h2 className="text-lg font-bold">بيانات المشتري</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium">الاسم الكامل</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">البريد الإلكتروني</label>
                <input
                  readOnly
                  value={user.email ?? ""}
                  type="email"
                  dir="ltr"
                  className="w-full rounded-xl border border-input bg-muted px-4 py-2.5 text-left text-sm text-muted-foreground outline-none"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">الدولة</label>
              <input
                required
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <p className="flex items-center gap-2 rounded-xl bg-muted p-3 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              سيُحفظ طلبك في حسابك فورًا. الدفع الفعلي بالبطاقات يمكن تفعيله لاحقًا.
            </p>
            <fieldset className="space-y-2">
              <legend className="text-sm font-semibold">طريقة الدفع</legend>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border p-3">
                <input type="radio" checked={provider === "manual"} onChange={() => setProvider("manual")} />
                <span>تسجيل الطلب (بانتظار الدفع)</span>
              </label>
              {(["stripe", "paypal", "moyasar"] as const).map((name) => (
                <label key={name} className={`flex items-center gap-2 rounded-lg border p-3 ${available[name] ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}>
                  <input type="radio" disabled={!available[name]} checked={provider === name} onChange={() => setProvider(name)} />
                  <span className="capitalize">{name}</span>
                  {!available[name] && <span className="text-xs text-muted-foreground">(غير مفعّل)</span>}
                </label>
              ))}
              <p className="text-xs text-muted-foreground">لن يتم اعتبار الطلب مدفوعًا قبل تأكيد مزود الدفع. أضف مفاتيح الخادم لتفعيل البطاقات.</p>
            </fieldset>
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
            >
              {busy ? "جارٍ المعالجة…" : provider === "manual" ? `تسجيل الطلب · $${total}` : `المتابعة إلى ${provider} · $${total}`}
            </button>
          </form>

          <aside className="h-fit rounded-2xl border border-border bg-card p-6 lg:col-span-2">
            <h2 className="text-lg font-bold">ملخص الطلب</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {items.map(({ product }) => (
                <li key={product.id} className="flex justify-between gap-3">
                  <span className="text-muted-foreground">{product.title}</span>
                  <span className="font-semibold">${product.price}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-between border-t border-border pt-4 font-bold">
              <span>الإجمالي</span>
              <span>${total}</span>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
