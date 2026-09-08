import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  CheckCircle2,
  Download,
  GraduationCap,
  Star,
  ShieldCheck,
  Clock,
  Users,
} from "lucide-react";
import { fetchProducts, PRODUCTS } from "@/lib/products";
import { useCart } from "@/lib/cart";
import { ProductCard } from "@/components/ProductCard";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ params }) => {
    const product = (await fetchProducts()).find((p) => p.slug === params.slug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "المنتج غير متوفر | جود" }, { name: "robots", content: "noindex" }],
      };
    }
    const { product } = loaderData;
    const title = `${product.title} | جود`;
    return {
      meta: [
        { title },
        { name: "description", content: product.description },
        { property: "og:title", content: title },
        { property: "og:description", content: product.description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: ProductNotFound,
  component: ProductPage,
});

function ProductNotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="text-2xl font-bold">هذا المنتج غير موجود</h1>
      <Link to="/" className="mt-6 inline-block text-primary hover:underline">
        العودة إلى المتجر
      </Link>
    </div>
  );
}

function ProductPage() {
  const { product } = Route.useLoaderData();
  const { add, has } = useCart();
  const { user } = useAuth();
  const [favorite, setFavorite] = useState(false);
  const [reviews, setReviews] = useState<{ id: string; rating: number; body: string }[]>([]);
  const [review, setReview] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const inCart = has(product.id);
  const related = PRODUCTS.filter((p) => p.type === product.type && p.id !== product.id).slice(0, 3);
  useEffect(() => {
    supabase.from("product_reviews").select("id,rating,body").eq("product_id", product.id).eq("approved", true)
      .then(({ data }) => setReviews((data ?? []) as typeof reviews));
    if (user) supabase.from("favorites").select("product_id").eq("user_id", user.id).eq("product_id", product.id).maybeSingle()
      .then(({ data }) => setFavorite(Boolean(data)));
  }, [product.id, user]);
  async function toggleFavorite() {
    if (!user) return;
    if (favorite) await supabase.from("favorites").delete().eq("user_id", user.id).eq("product_id", product.id);
    else await supabase.from("favorites").insert({ user_id: user.id, product_id: product.id });
    setFavorite(!favorite);
  }
  async function submitReview() {
    if (!user || review.trim().length < 3) return;
    const { data } = await supabase.from("product_reviews").insert({ product_id: product.id, user_id: user.id, rating: reviewRating, body: review.trim() }).select("id,rating,body").single();
    if (data) setReviews([...reviews, data as typeof reviews[number]]);
    setReview("");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="grid gap-10 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              product.type === "digital"
                ? "bg-secondary text-secondary-foreground"
                : "bg-primary/10 text-primary"
            }`}
          >
            {product.type === "digital" ? (
              <Download className="h-3.5 w-3.5" />
            ) : (
              <GraduationCap className="h-3.5 w-3.5" />
            )}
            {product.type === "digital" ? "منتج رقمي" : "كورس تدريبي"}
          </span>

          <h1 className="mt-4 text-3xl font-bold leading-snug">{product.title}</h1>
          {product.image_url && <img src={product.image_url} alt={product.title} className="mt-6 h-64 w-full rounded-3xl object-cover shadow-sm" />}

          <div className="mt-4 flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-accent text-accent" />
              {product.rating.toFixed(1)}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {product.students.toLocaleString("ar-EG")} متدرب
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {product.meta}
            </span>
          </div>

          <p className="mt-6 leading-relaxed text-muted-foreground">{product.longDescription}</p>

          <h2 className="mt-10 text-xl font-bold">ماذا ستحصل عليه</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {product.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {f}
              </li>
            ))}
          </ul>

          <h2 className="mt-10 text-xl font-bold">
            {product.type === "course" ? "محتوى الكورس" : "محتويات الحزمة"}
          </h2>
          <ul className="mt-4 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {product.curriculum.map((c, i) => (
              <li key={c.title} className="flex items-center justify-between gap-3 px-5 py-4">
                <span className="flex items-center gap-3 text-sm font-medium">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs">
                    {i + 1}
                  </span>
                  {c.title}
                </span>
                <span className="text-xs text-muted-foreground">{c.duration}</span>
              </li>
            ))}
          </ul>
        </div>

        <aside className="h-fit lg:sticky lg:top-24 lg:col-span-2">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-end gap-3">
              <span className="text-4xl font-bold">${product.price}</span>
              {product.oldPrice && (
                <span className="pb-1 text-lg text-muted-foreground line-through">
                  ${product.oldPrice}
                </span>
              )}
            </div>
            {product.badge && (
              <span className="mt-3 inline-block rounded-md bg-accent/20 px-2 py-0.5 text-xs font-semibold text-accent-foreground">
                {product.badge}
              </span>
            )}

            <button
              onClick={() => add(product.id)}
              disabled={inCart}
              className="mt-6 w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
            >
              {inCart ? "أُضيف إلى السلة" : "أضف إلى السلة"}
            </button>
            <button onClick={toggleFavorite} disabled={!user} className="mt-3 w-full rounded-xl border border-border py-3 text-sm font-medium hover:bg-muted disabled:opacity-50">
              {favorite ? "♥ محفوظ في المفضلة" : "♡ أضف إلى المفضلة"}
            </button>
            <Link
              to="/cart"
              className="mt-3 block rounded-xl border border-border py-3 text-center text-sm font-medium transition hover:bg-muted"
            >
              الذهاب إلى السلة
            </Link>

            <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" /> دفع آمن وضمان استرداد 14 يومًا
              </li>
              <li className="flex items-center gap-2">
                <Download className="h-4 w-4 text-primary" /> وصول فوري بعد الشراء
              </li>
              <li className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" /> المدرّب: {product.instructor}
              </li>
            </ul>
          </div>

          <section className="mt-16 rounded-2xl border border-border bg-card p-6">
            <h2 className="text-xl font-bold">التقييمات والمراجعات</h2>
            <div className="mt-4 space-y-3">
              {reviews.length === 0 ? <p className="text-sm text-muted-foreground">لا توجد مراجعات منشورة بعد.</p> : reviews.map((item) => (
                <article key={item.id} className="rounded-xl bg-muted/50 p-4"><div className="text-accent">{"★".repeat(item.rating)}{"☆".repeat(5 - item.rating)}</div><p className="mt-1 text-sm">{item.body}</p></article>
              ))}
            </div>
            {user && <div className="mt-6 grid gap-3 sm:grid-cols-[auto_1fr_auto]">
              <select value={reviewRating} onChange={(e) => setReviewRating(Number(e.target.value))} className="rounded-lg border bg-background p-2">{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} نجوم</option>)}</select>
              <input value={review} onChange={(e) => setReview(e.target.value)} maxLength={2000} placeholder="اكتب مراجعتك (ستُنشر بعد المراجعة)" className="rounded-lg border bg-background px-3" />
              <button onClick={submitReview} className="rounded-lg bg-primary px-4 py-2 text-primary-foreground">إرسال</button>
            </div>}
          </section>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-bold">قد يعجبك أيضًا</h2>
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <ProductCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
