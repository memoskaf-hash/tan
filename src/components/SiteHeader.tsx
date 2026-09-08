import { Link, useNavigate } from "@tanstack/react-router";
import { ShoppingCart, ShieldCheck, Menu, X, UserRound, LogOut, PackageOpen, Sparkles, Heart, Bell } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { LANGUAGES, useI18n } from "@/lib/i18n";

const NAV = [
  { to: "/", label: "الرئيسية" },
  { to: "/courses", label: "الكورسات" },
  { to: "/membership", label: "العضويات" },
  { to: "/content", label: "المحتوى" },
  { to: "/about", label: "من نحن" },
  { to: "/contact", label: "تواصل معنا" },
  { to: "/seller", label: "بع منتجاتك" },
  { to: "/messages", label: "المحادثات" },
] as const;

export function SiteHeader() {
  const { count } = useCart();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { language, setLanguage, t } = useI18n();

  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
        <Link to="/" className="group flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition group-hover:rotate-3">
            <Sparkles className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-lg font-extrabold leading-none">{language === "ar" ? "جود" : "Joud"}</span>
            <span className="mt-1 block text-[10px] font-medium text-muted-foreground">تعلّم، أنجز، ارتقِ</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 rounded-2xl border border-border/70 bg-card/60 p-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              activeProps={{ className: "bg-muted text-foreground" }}
              className="rounded-xl px-3.5 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              {t(item.to === "/" ? "home" : item.to.slice(1))}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-2 rounded-full bg-primary/5 px-3 py-2 text-xs font-medium text-primary lg:flex">
            <ShieldCheck className="h-4 w-4 text-primary" />
            {t("secure")}
          </span>

          {user ? (
            <>
              <Link
                to="/profile"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5"
              ><UserRound className="h-4 w-4" /><span className="hidden sm:inline">{t("profile")}</span></Link>
              <Link
                to="/purchases"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5"
              >
                <PackageOpen className="h-4 w-4" />
                <span className="hidden sm:inline">{t("purchases")}</span>
              </Link>
              <Link to="/favorites" className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium shadow-sm transition hover:border-primary/30 hover:bg-primary/5"><Heart className="h-4 w-4" /><span className="hidden sm:inline">المفضلة</span></Link>
              <Link to="/notifications" className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium shadow-sm transition hover:border-primary/30 hover:bg-primary/5"><Bell className="h-4 w-4" /><span className="hidden sm:inline">الإشعارات</span></Link>
              <button
                onClick={async () => {
                  await signOut();
                  navigate({ to: "/" });
                }}
                title={t("logout")}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              search={{ redirect: "/" }}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5"
            >
              <UserRound className="h-4 w-4" />
              <span className="hidden sm:inline">{t("login")}</span>
            </Link>
          )}

          <Link
            to="/cart"
            className="relative inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-sm font-semibold text-primary transition hover:-translate-y-0.5 hover:bg-primary/10"
          >
            <ShoppingCart className="h-4 w-4" />
            {t("cart")}
            {count > 0 && (
              <span className="absolute -top-2 -left-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-bold text-primary-foreground">
                {count}
              </span>
            )}
          </Link>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="القائمة"
            className="rounded-xl border border-border p-2 md:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
          <select value={language} onChange={e => setLanguage(e.target.value as keyof typeof LANGUAGES)} className="rounded-lg border bg-background px-2 py-2 text-xs" aria-label="Language">{Object.entries(LANGUAGES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
        </div>
      </div>

      {open && (
        <nav className="border-t border-border bg-card px-4 py-2 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
