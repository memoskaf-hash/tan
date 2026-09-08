import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, ShieldCheck, Zap, BadgePercent, Clock, Quote, ArrowLeft, Sparkles, Users, BookOpenCheck } from "lucide-react";
import { PRODUCTS, fetchProducts, type Product } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";

const TABS = [
  { key: "all", label: "الكل" },
  { key: "digital", label: "منتجات رقمية" },
  { key: "course", label: "كورسات تدريبية" },
] as const;

const TESTIMONIALS = [
  {
    name: "ريم العتيبي",
    role: "مصممة واجهات",
    text: "كورس Figma غيّر طريقة عملي بالكامل، صرت أسلّم مشاريعي بنصف الوقت السابق.",
  },
  {
    name: "أحمد نصر",
    role: "صاحب متجر إلكتروني",
    text: "كتاب التجارة الإلكترونية عملي جدًا، طبّقت خطواته وحققت أول مبيعات خلال شهر.",
  },
  {
    name: "سلمى قاسم",
    role: "مسوّقة رقمية",
    text: "قوالب Notion وفّرت عليّ ساعات أسبوعيًا في تنظيم حملات العملاء.",
  },
];

const FAQ = [
  {
    q: "كيف أستلم المنتج بعد الشراء؟",
    a: "تصلك روابط التحميل على بريدك الإلكتروني مباشرة بعد إتمام الدفع، ويبقى الوصول متاحًا دائمًا.",
  },
  {
    q: "هل يمكنني استرداد المبلغ؟",
    a: "نعم، لديك 14 يومًا لطلب استرداد كامل إذا لم يكن المحتوى مناسبًا لك.",
  },
  {
    q: "هل الكورسات محدّثة؟",
    a: "نحدّث محتوى الكورسات دوريًا، والتحديثات مجانية لمن اشترى الكورس سابقًا.",
  },
  {
    q: "هل أحصل على شهادة؟",
    a: "كل كورس تدريبي يمنحك شهادة إتمام بعد إنهاء جميع الوحدات.",
  },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "جود | منتجات رقمية وكورسات تدريبية" },
      {
        name: "description",
        content:
          "تصفح منتجاتنا الرقمية وكورساتنا التدريبية بالعربية: قوالب، كتب إلكترونية، ودورات احترافية بأسعار منافسة وتحميل فوري.",
      },
      { property: "og:title", content: "جود | منتجات رقمية وكورسات تدريبية" },
      {
        property: "og:description",
        content: "قوالب، كتب إلكترونية، ودورات احترافية بالعربية — تحميل فوري ودفع آمن.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [filter, setFilter] = useState<(typeof TABS)[number]["key"]>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("featured");
  const [maxPrice, setMaxPrice] = useState("");
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  useEffect(() => { fetchProducts().then(setProducts); }, []);

  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          (filter === "all" || p.type === filter) &&
          (!maxPrice || p.price <= Number(maxPrice)) &&
          (p.title.includes(search) || p.description.includes(search)),
      ).sort((a, b) => sort === "price-low" ? a.price - b.price : sort === "price-high" ? b.price - a.price : b.rating - a.rating),
    [filter, search, products, maxPrice, sort],
  );

  return (
    <>
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 pb-14 pt-10 sm:px-6 sm:pt-16">
        <div className="relative overflow-hidden rounded-[2rem] bg-primary px-6 py-12 text-primary-foreground shadow-2xl shadow-primary/20 sm:px-12 sm:py-16">
          <div className="absolute -left-20 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-32 right-1/3 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
          <div className="relative grid items-center gap-12 lg:grid-cols-[1.25fr_0.75fr]">
            <div>
              <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold">
                <Sparkles className="h-4 w-4 text-accent" /> منصتك العربية للتطور المستمر
              </span>
              <h1 className="max-w-3xl text-3xl font-extrabold leading-[1.6] sm:text-5xl">
                تعلّم مهارات تصنع <span className="text-accent">فرقًا حقيقيًا</span> في مستقبلك
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-8 text-primary-foreground/75 sm:text-base">
                محتوى عملي ومنتجات رقمية مختارة بعناية تساعدك على الإنجاز أسرع، وبناء مهاراتك بثقة، من أي مكان.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="#catalog"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-primary shadow-lg transition hover:-translate-y-0.5 hover:bg-white/90"
          >
            تصفّح المنتجات <ArrowLeft className="h-4 w-4" />
          </a>
          <Link
            to="/courses"
            className="rounded-xl border border-white/25 bg-white/10 px-6 py-3 font-semibold transition hover:bg-white/15"
          >
            شاهد الكورسات
          </Link>
        </div>
            </div>
            <div className="hidden lg:block">
              <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
                <div className="mb-5 flex items-center justify-between">
                  <span className="text-sm font-semibold">لماذا جود؟</span>
                  <span className="rounded-full bg-accent/20 px-3 py-1 text-xs text-accent">موثوق</span>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 rounded-2xl bg-black/10 p-3"><BookOpenCheck className="h-5 w-5 text-accent" /><span className="text-sm">محتوى عربي عملي ومحدّث</span></div>
                  <div className="flex items-center gap-3 rounded-2xl bg-black/10 p-3"><Users className="h-5 w-5 text-accent" /><span className="text-sm">مجتمع متعلم يدعم نجاحك</span></div>
                  <div className="flex items-center gap-3 rounded-2xl bg-black/10 p-3"><ShieldCheck className="h-5 w-5 text-accent" /><span className="text-sm">دفع آمن وضمان استرداد</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-border/70 bg-card/70 p-4 text-center"><strong className="block text-2xl font-extrabold text-primary">+6K</strong><span className="text-xs text-muted-foreground">متعلم يثق بنا</span></div>
          <div className="rounded-2xl border border-border/70 bg-card/70 p-4 text-center"><strong className="block text-2xl font-extrabold text-primary">4.9/5</strong><span className="text-xs text-muted-foreground">متوسط التقييم</span></div>
          <div className="rounded-2xl border border-border/70 bg-card/70 p-4 text-center"><strong className="block text-2xl font-extrabold text-primary">100%</strong><span className="text-xs text-muted-foreground">وصول مدى الحياة</span></div>
          <div className="rounded-2xl border border-border/70 bg-card/70 p-4 text-center"><strong className="block text-2xl font-extrabold text-primary">24/7</strong><span className="text-xs text-muted-foreground">تحميل فوري</span></div>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-accent" /> وصول فوري
          </span>
          <span className="flex items-center gap-2">
            <BadgePercent className="h-4 w-4 text-accent" /> خصومات دورية
          </span>
          <span className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-accent" /> وصول مدى الحياة
          </span>
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-accent" /> ضمان استرداد 14 يومًا
          </span>
        </div>
      </section>

      {/* Catalog */}
      <section id="catalog" className="mx-auto max-w-7xl scroll-mt-24 px-4 pb-20 sm:px-6">
        <div className="mb-8 flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="text-right">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">اكتشف مجموعتنا</span>
            <h2 className="mt-2 text-2xl font-extrabold">ابدأ رحلتك الآن</h2>
          </div>
          <div className="flex rounded-xl bg-muted p-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`rounded-lg px-5 py-2 text-sm font-medium transition ${
                  filter === tab.key
                    ? "bg-card text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-xl border border-input bg-card px-3 py-2.5 text-sm"><option value="featured">الأكثر تميزًا</option><option value="price-low">السعر: الأقل أولًا</option><option value="price-high">السعر: الأعلى أولًا</option></select>
            <input type="number" min="0" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="أقصى سعر" className="w-full rounded-xl border border-input bg-card px-3 py-2.5 text-sm sm:w-28" />
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="ابحث عن منتج أو كورس..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-input bg-card py-2.5 pr-10 pl-4 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="py-20 text-center text-muted-foreground">لا توجد نتائج مطابقة لبحثك.</p>
        ) : (
           <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item) => (
              <ProductCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      {/* Testimonials */}
      <section className="border-y border-border bg-card/60 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <span className="block text-center text-xs font-bold uppercase tracking-widest text-primary">قصص نجاح حقيقية</span>
          <h2 className="mt-2 text-center text-2xl font-extrabold">ماذا يقول عملاؤنا</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
                <Quote className="h-6 w-6 text-accent" />
                <blockquote className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {t.text}
                </blockquote>
                <figcaption className="mt-4 text-sm font-semibold">
                  {t.name}
                  <span className="block text-xs font-normal text-muted-foreground">{t.role}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-16">
        <h2 className="text-center text-2xl font-bold">الأسئلة الشائعة</h2>
        <div className="mt-8 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {FAQ.map((item) => (
            <details key={item.q} className="group px-6 py-4">
              <summary className="cursor-pointer list-none font-semibold">{item.q}</summary>
              <p className="mt-3 text-sm text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
