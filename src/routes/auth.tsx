import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Lock, UserRound, LogIn } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول | جود" },
      { name: "description", content: "سجّل دخولك لإتمام مشترياتك والوصول إلى منتجاتك الرقمية." },
      { property: "og:title", content: "تسجيل الدخول | جود" },
      { property: "og:description", content: "سجّل دخولك لإتمام مشترياتك والوصول إلى منتجاتك الرقمية." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search["redirect"] === "string" ? search["redirect"] : "/",
  }),
  component: AuthPage,
});

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  if (!loading && user) {
    navigate({ to: redirect as "/" });
    return null;
  }

  const safeRedirect = redirect.startsWith("/") ? redirect : "/";

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: `${window.location.origin}${safeRedirect}`,
          },
        });
        if (error) throw error;
        toast.success("تم إنشاء حسابك! تحقق من بريدك الإلكتروني لتأكيد الحساب.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("أهلًا بعودتك!");
        navigate({ to: safeRedirect as "/" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ، حاول مجددًا");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("تعذّر تسجيل الدخول عبر Google");
      return;
    }
    async function handleApple() {
      const result = await lovable.auth.signInWithOAuth("apple", { redirect_uri: window.location.origin });
      if (result.error) toast.error("Apple OAuth غير مفعّل — أضف مفاتيح Apple في Supabase Auth");
    }
    if (result.redirected) return;
    navigate({ to: safeRedirect as "/" });
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <div className="rounded-2xl border border-border bg-card p-8">
        <div className="text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <LogIn className="h-6 w-6 text-primary" />
          </span>
          <h1 className="mt-4 text-2xl font-bold">
            {mode === "login" ? "تسجيل الدخول" : "إنشاء حساب جديد"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "login"
              ? "سجّل دخولك للوصول إلى مشترياتك وإتمام الطلبات."
              : "أنشئ حسابًا لحفظ مشترياتك والوصول إليها مدى الحياة."}
          </p>
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold transition hover:bg-muted"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.63h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.09 3.57-5.16 3.57-8.8Z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3c-1.07.72-2.44 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.1A12 12 0 0 0 12 24Z"
            />
            <path
              fill="#FBBC05"
              d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28v-3.1H1.29a12 12 0 0 0 0 10.76l3.98-3.1Z"
            />
            <path
              fill="#EA4335"
              d="M12 4.76c1.76 0 3.34.6 4.58 1.8l3.44-3.44A11.97 11.97 0 0 0 12 0 12 12 0 0 0 1.29 6.62l3.98 3.1C6.22 6.87 8.87 4.76 12 4.76Z"
            />
          </svg>
          المتابعة عبر Google
        </button>
        <button
          type="button"
          onClick={handleApple}
          className="mt-2 flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold transition hover:bg-muted"
        >
          <span className="text-lg">●</span>
          المتابعة عبر Apple (يتطلب إعداد Supabase)
        </button>

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          أو عبر البريد الإلكتروني
          <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleEmail} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium">الاسم الكامل</label>
              <div className="relative">
                <UserRound className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background py-2.5 pr-10 pl-4 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-medium">البريد الإلكتروني</label>
            <div className="relative">
              <Mail className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                required
                type="email"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-input bg-background py-2.5 pr-10 pl-4 text-left text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">كلمة المرور</label>
            <div className="relative">
              <Lock className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                required
                type="password"
                dir="ltr"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-input bg-background py-2.5 pr-10 pl-4 text-left text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            {busy ? "جارٍ المعالجة…" : mode === "login" ? "دخول" : "إنشاء الحساب"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "login" ? "ليس لديك حساب؟" : "لديك حساب بالفعل؟"}{" "}
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="font-semibold text-primary hover:underline"
          >
            {mode === "login" ? "أنشئ حسابًا" : "سجّل دخولك"}
          </button>
        </p>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        بالمتابعة أنت توافق على شروط الاستخدام.{" "}
        <Link to="/" className="text-primary hover:underline">
          العودة للمتجر
        </Link>
      </p>
    </div>
  );
}
