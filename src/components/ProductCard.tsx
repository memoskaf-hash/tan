import { Link } from "@tanstack/react-router";
import { CheckCircle2, Download, GraduationCap, Star } from "lucide-react";
import type { Product } from "@/lib/products";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";

export function ProductCard({ item }: { item: Product }) {
  const { add, has } = useCart();
  const inCart = has(item.id);
  const { t } = useI18n();

  return (
    <article className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-border/80 bg-card/90 p-5 shadow-sm transition duration-300 hover:-translate-y-1.5 hover:border-primary/25 hover:shadow-xl hover:shadow-primary/10">
      <div>
        {item.image_url && (
          <img src={item.image_url} alt={item.title} loading="lazy" className="mb-5 h-40 w-full rounded-2xl object-cover transition duration-500 group-hover:scale-[1.02]" />
        )}
        <div className="mb-4 flex items-start justify-between">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              item.type === "digital"
                ? "bg-secondary text-secondary-foreground"
                : "bg-primary/10 text-primary"
            }`}
          >
            {item.type === "digital" ? (
              <Download className="h-3.5 w-3.5" />
            ) : (
              <GraduationCap className="h-3.5 w-3.5" />
            )}
            {item.type === "digital" ? t("digital") : t("course")}
          </span>
          <div className="text-left">
            <span className="text-2xl font-extrabold text-primary">${item.price}</span>
            {item.oldPrice && (
              <span className="mr-2 text-sm text-muted-foreground line-through">
                ${item.oldPrice}
              </span>
            )}
          </div>
        </div>

        {item.badge && (
          <span className="mb-2 inline-block rounded-md bg-accent/20 px-2 py-0.5 text-xs font-semibold text-accent-foreground">
            {item.badge}
          </span>
        )}

        <h3 className="mb-2 text-lg font-bold leading-relaxed">
          <Link to="/product/$slug" params={{ slug: item.slug }} className="transition-colors hover:text-primary">
            {item.title}
          </Link>
        </h3>

        <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Star className="h-4 w-4 fill-accent text-accent" />
          {item.rating.toFixed(1)}
          <span>· {item.students.toLocaleString("ar-EG")} متدرب</span>
        </div>

        <p className="mb-4 min-h-12 text-sm leading-7 text-muted-foreground">{item.description}</p>

        <ul className="mb-4 space-y-2">
          {item.features.slice(0, 3).map((feat) => (
            <li key={feat} className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
              {feat}
            </li>
          ))}
        </ul>
        <p className="mb-6 text-xs text-muted-foreground">{item.meta}</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => add(item.id)}
          disabled={inCart}
          className="flex-1 rounded-xl bg-primary py-3 font-semibold text-primary-foreground shadow-md shadow-primary/15 transition hover:-translate-y-0.5 hover:opacity-90 disabled:opacity-60"
        >
          {inCart ? t("inCart") : t("add")}
        </button>
        <Link
          to="/product/$slug"
          params={{ slug: item.slug }}
          className="rounded-xl border border-border px-4 py-3 text-sm font-medium transition hover:bg-muted"
        >
          {t("details")}
        </Link>
      </div>
    </article>
  );
}
