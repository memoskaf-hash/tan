import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2, ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "سلة المشتريات | جود" },
      { name: "description", content: "راجع منتجاتك الرقمية والكورسات قبل إتمام عملية الشراء." },
      { property: "og:title", content: "سلة المشتريات | جود" },
      { property: "og:description", content: "راجع مشترياتك الرقمية قبل الدفع." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, total, remove } = useCart();

  return (
    <div className="mx-auto max-w-4xl px-4 py-14">
      <h1 className="text-3xl font-bold">سلة المشتريات</h1>

      {items.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-border bg-card p-12 text-center">
          <ShoppingCart className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">سلتك فارغة حاليًا.</p>
          <Link
            to="/"
            className="mt-6 inline-block rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground hover:opacity-90"
          >
            تصفّح المنتجات
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-8 space-y-4">
            {items.map(({ product }) => (
              <li
                key={product.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5"
              >
                <div>
                  <Link
                    to="/product/$slug"
                    params={{ slug: product.slug }}
                    className="font-semibold hover:text-primary"
                  >
                    {product.title}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">{product.meta}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold">${product.price}</span>
                  <button
                    onClick={() => remove(product.id)}
                    aria-label="إزالة"
                    className="rounded-lg border border-border p-2 text-muted-foreground transition hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-8 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between text-lg font-bold">
              <span>الإجمالي</span>
              <span>${total}</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              تصلك روابط التحميل مباشرة بعد إتمام الدفع.
            </p>
            <Link
              to="/checkout"
              className="mt-6 block rounded-xl bg-primary py-3 text-center font-semibold text-primary-foreground hover:opacity-90"
            >
              متابعة الدفع
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
