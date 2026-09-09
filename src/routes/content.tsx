import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
export const Route = createFileRoute("/content")({ component: ContentPage });
const fallback = [{ slug: "welcome", title: "مرحباً بك في أكاديمية المتجر", body: "مقالات ودروس عملية تُحدّث باستمرار." }, { slug: "faq", title: "الأسئلة الشائعة", body: "يمكنك الوصول إلى مشترياتك مدى الحياة. تواصل معنا لطلبات الاسترداد." }];
function ContentPage() {
  const [pages, setPages] = useState(fallback);
  useEffect(() => { (supabase as any).from("content_pages").select("slug,title,body").eq("published", true).order("updated_at", { ascending: false }).then(({ data }: any) => data?.length && setPages(data)); }, []);
  return <div className="mx-auto max-w-4xl px-4 py-14"><h1 className="text-3xl font-bold">المقالات والأسئلة الشائعة</h1><div className="mt-8 space-y-5">{pages.map(page => <article key={page.slug} className="rounded-2xl border bg-card p-6"><h2 className="text-xl font-bold">{page.title}</h2><p className="mt-3 whitespace-pre-wrap text-muted-foreground">{page.body}</p></article>)}</div></div>;
}
