import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Lock, UserRound, LogIn } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { countries } from "@/lib/countries";

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
  const [accountType, setAccountType] = useState<"buyer" | "seller">("buyer");
  const [bio, setBio] = useState("");
  const [country, setCountry] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  if (!loading && user) {
    navigate({ to: redirect as "/" });
    return null;
  }

  const safeRedirect = redirect.startsWith("/") ? redirect : "/";

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (mode === "signup" && name.trim().length < 2) errors.name = "اكتب اسمًا صحيحًا";
    if (!email.includes("@")) errors.email = "أدخل بريدًا إلكترونيًا صحيحًا";
    if (password.length < 6) errors.password = "كلمة المرور يجب أن تكون 6 أحرف على الأقل";
    if (mode === "signup" && !country) errors.country = "اختر بلدك";
    if (mode === "signup" && bio.trim().length < 10) errors.bio = "اكتب نبذة لا تقل عن 10 أحرف";
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      toast.error(Object.values(errors)[0]);
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name, account_type: accountType, bio, country },
            emailRedirectTo: `${window.location.origin}${safeRedirect}`,
          },
        });
        if (error) throw error;
        if (data.user) {
          let avatarUrl = "";
          if (avatar) {
            const path = `${data.user.id}/${crypto.randomUUID()}-${avatar.name}`;
            const upload = await supabase.storage.from("avatars").upload(path, avatar, { upsert: true, contentType: avatar.type });
            if (upload.error) throw upload.error;
            avatarUrl = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
          }
          const profile = await supabase.from("profiles").upsert({ id: data.user.id, full_name: name, account_type: accountType, bio, country, avatar_url: avatarUrl }).select().single();
          if (profile.error) throw profile.error;
        }
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

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          أو عبر البريد الإلكتروني
          <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleEmail} className="space-y-4">
          {mode === "signup" && (
            <>
            <div>
              <label className="mb-1.5 block text-sm font-medium">نوع الحساب</label>
              <select value={accountType} onChange={(e) => setAccountType(e.target.value as "buyer" | "seller")} className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm">
                <option value="buyer">حساب مشتري</option>
                <option value="seller">حساب بائع</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">الاسم الكامل</label>
              <div className="relative">
                <UserRound className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full rounded-xl border bg-background py-2.5 pr-10 pl-4 text-sm outline-none focus:ring-2 focus:ring-ring ${fieldErrors.name ? "border-red-500 ring-1 ring-red-500" : "border-input"}`}
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">نبذة عنك</label>
              <textarea required value={bio} onChange={(e) => setBio(e.target.value)} maxLength={500} className="min-h-20 w-full rounded-xl border border-input bg-background p-3 text-sm" placeholder={accountType === "seller" ? "اكتب نبذة عن خبرتك ومنتجاتك" : "اكتب نبذة مختصرة عنك"} />
              {fieldErrors.bio && <p className="mt-1 text-xs text-red-600">{fieldErrors.bio}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">البلد</label>
              <select required value={country} onChange={(e) => setCountry(e.target.value)} className={`w-full rounded-xl border bg-background px-3 py-2.5 text-sm ${fieldErrors.country ? "border-red-500" : "border-input"}`}>
                <option value="">اختر البلد</option>
                {countries.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">الصورة الشخصية</label>
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setAvatar(e.target.files?.[0] ?? null)} className="w-full rounded-xl border border-input bg-background p-2 text-sm" />
            </div>
            </>
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
                className={`w-full rounded-xl border bg-background py-2.5 pr-10 pl-4 text-left text-sm outline-none focus:ring-2 focus:ring-ring ${fieldErrors.email ? "border-red-500" : "border-input"}`}
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
                className={`w-full rounded-xl border bg-background py-2.5 pr-10 pl-4 text-left text-sm outline-none focus:ring-2 focus:ring-ring ${fieldErrors.password ? "border-red-500" : "border-input"}`}
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
