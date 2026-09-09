import { createFileRoute } from "@tanstack/react-router";
import { Check, Crown } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/membership")({ component: MembershipPage });
const fallbackPlans = [
  { id: "starter", name: "الأساسية", interval: "monthly", price: 9, entitlements: ["وصول للكورسات الأساسية", "نقاط ولاء شهرية"] },
  { id: "pro", name: "الاحترافية", interval: "monthly", price: 19, entitlements: ["كل الكورسات", "شهادة إتمام", "دعم وأولوية"] },
  { id: "annual", name: "السنوية", interval: "yearly", price: 190, entitlements: ["كل مزايا الاحترافية", "شهران مجاناً"] },
];
function MembershipPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<any[]>(fallbackPlans);
  const [current, setCurrent] = useState<any | null>(null);
  useEffect(() => {
    (supabase as any).from("membership_plans").select("*").eq("active", true).then(({ data }: any) => data?.length && setPlans(data));
    if (user) (supabase as any).from("memberships").select("status,plan_id,renews_at,membership_plans(name)").eq("user_id", user.id).in("status", ["active", "pending"]).maybeSingle().then(({ data }: any) => setCurrent(data));
  }, [user]);
  async function choose(plan: any) {
    if (!user) { toast.error("سجّل الدخول أولاً"); return; }
    const { error } = await (supabase as any).from("memberships").insert({ user_id: user.id, plan_id: plan.id, status: "pending" });
    if (error) toast.error("تعذر بدء الاشتراك. تحقق من إعداد Supabase.");
    else { toast.success("تم إرسال طلب الاشتراك للمراجعة؛ لم يتم تحصيل أي مبلغ."); setCurrent({ status: "pending", membership_plans: { name: plan.name } }); }
  }
  return <div className="mx-auto max-w-6xl px-4 py-14"><div className="text-center"><Crown className="mx-auto h-10 w-10 text-primary"/><h1 className="mt-3 text-3xl font-bold">العضويات</h1><p className="mt-2 text-muted-foreground">خطط شهرية وسنوية بصلاحيات واضحة. الدفع الفعلي يحتاج مزوداً خادمياً.</p>{current && <div className="mx-auto mt-5 max-w-md rounded-xl bg-primary/5 p-4 text-sm">اشتراكك الحالي: <strong>{current.membership_plans?.name}</strong> · {current.status === "pending" ? "قيد المراجعة" : "نشط"}</div>}</div>
    <div className="mt-10 grid gap-6 md:grid-cols-3">{plans.map((plan) => <article key={plan.id} className="rounded-2xl border bg-card p-6"><h2 className="text-xl font-bold">{plan.name}</h2><p className="mt-3 text-3xl font-bold">${plan.price}<small className="text-sm text-muted-foreground">/{plan.interval === "yearly" ? "سنة" : "شهر"}</small></p><ul className="my-6 space-y-3 text-sm">{(plan.entitlements || []).map((e: string) => <li key={e} className="flex gap-2"><Check className="h-4 w-4 text-primary"/>{e}</li>)}</ul><button onClick={() => choose(plan)} className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground">اختيار الخطة</button></article>)}</div>
  </div>;
}
