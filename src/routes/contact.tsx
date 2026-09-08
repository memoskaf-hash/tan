import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, MessageCircle, Clock, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "تواصل معنا | جود" },
      {
        name: "description",
        content: "أرسل استفسارك عن المنتجات الرقمية أو الكورسات وسنرد خلال يوم عمل واحد.",
      },
      { property: "og:title", content: "تواصل معنا | جود" },
      { property: "og:description", content: "فريق الدعم يجيب على استفساراتك خلال يوم عمل واحد." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [sent, setSent] = useState(false);

  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <h1 className="text-3xl font-bold">تواصل معنا</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        عندك سؤال عن منتج أو كورس؟ اكتب لنا وسنرد خلال يوم عمل واحد.
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          {[
            { icon: Mail, title: "البريد الإلكتروني", text: "support@example.com" },
            { icon: MessageCircle, title: "الدعم المباشر", text: "من الأحد إلى الخميس" },
            { icon: Clock, title: "زمن الرد", text: "خلال 24 ساعة عمل" },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-5">
              <Icon className="h-5 w-5 text-primary" />
              <h2 className="mt-3 font-semibold">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            ملاحظة: بيانات التواصل أعلاه تجريبية — أرسل لي بريدك الحقيقي وأرقامك لأضعها مكانها.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
          className="space-y-4 rounded-2xl border border-border bg-card p-6 lg:col-span-2"
        >
          {sent && (
            <p className="flex items-center gap-2 rounded-xl bg-primary/10 p-3 text-sm text-primary">
              <CheckCircle2 className="h-4 w-4" /> تم استلام رسالتك، سنعود إليك قريبًا.
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">الاسم</label>
              <input
                required
                className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">البريد الإلكتروني</label>
              <input
                required
                type="email"
                dir="ltr"
                className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">الموضوع</label>
            <input
              required
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">رسالتك</label>
            <textarea
              required
              rows={6}
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground transition hover:opacity-90"
          >
            إرسال الرسالة
          </button>
        </form>
      </div>
    </div>
  );
}
