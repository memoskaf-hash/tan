import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { countries } from "@/lib/countries";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({ component: Profile });

function Profile() {
  const { user, loading } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [country, setCountry] = useState("");
  const [accountType, setAccountType] = useState<"buyer" | "seller">("buyer");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.user_metadata?.full_name ?? "");
    setPhone(user.phone ?? "");
    setAvatarUrl(user.user_metadata?.avatar_url ?? "");
    supabase.from("profiles").select("full_name, phone, avatar_url, account_type, bio, country").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (!data) return;
      setName(data.full_name ?? "");
      setPhone(data.phone ?? "");
      setAvatarUrl(data.avatar_url ?? "");
      setAccountType(data.account_type === "seller" ? "seller" : "buyer");
      setBio(data.bio ?? "");
      setCountry(data.country ?? "");
    });
  }, [user]);

  if (loading) return <div className="mx-auto max-w-xl px-4 py-12">جارٍ تحميل الملف الشخصي…</div>;
  if (!user) return <div className="mx-auto max-w-xl px-4 py-12 text-center">يرجى تسجيل الدخول للوصول إلى ملفك الشخصي.</div>;

  async function save() {
    setSaving(true);
    try {
      let nextAvatar = avatarUrl;
      if (avatar) {
        const path = `${user.id}/${crypto.randomUUID()}-${avatar.name}`;
        const upload = await supabase.storage.from("avatars").upload(path, avatar, { upsert: true, contentType: avatar.type });
        if (upload.error) throw upload.error;
        nextAvatar = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
      }
      const { error } = await supabase.auth.updateUser({ data: { full_name: name, avatar_url: nextAvatar, account_type: accountType, bio, country }, phone: phone || undefined });
      if (error) throw error;
      const profile = await supabase.from("profiles").upsert({ id: user.id, full_name: name, phone, avatar_url: nextAvatar, account_type: accountType, bio, country });
      if (profile.error) throw profile.error;
      setAvatarUrl(nextAvatar);
      setAvatar(null);
      toast.success("تم تحديث الملف الشخصي");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر حفظ البيانات");
    } finally {
      setSaving(false);
    }
  }

  async function changePassword() {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) toast.error(error.message);
    else { setPassword(""); toast.success("تم تغيير كلمة المرور"); }
  }

  return <div className="mx-auto max-w-xl px-4 py-12">
    <h1 className="mb-6 text-2xl font-bold">الملف الشخصي</h1>
    <div className="space-y-4 rounded-2xl border bg-card p-6">
      {avatarUrl && <img src={avatarUrl} alt="الصورة الشخصية" className="h-20 w-20 rounded-full object-cover" />}
      <label className="block text-sm">الاسم<input value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full rounded-lg border p-2" /></label>
      <label className="block text-sm">نوع الحساب<select value={accountType} onChange={e => setAccountType(e.target.value as "buyer" | "seller")} className="mt-1 w-full rounded-lg border p-2"><option value="buyer">مشتري</option><option value="seller">بائع</option></select></label>
      <label className="block text-sm">البلد<select value={country} onChange={e => setCountry(e.target.value)} className="mt-1 w-full rounded-lg border p-2"><option value="">اختر البلد</option>{countries.map(item => <option key={item}>{item}</option>)}</select></label>
      <label className="block text-sm">نبذة عنك<textarea value={bio} onChange={e => setBio(e.target.value)} maxLength={500} className="mt-1 min-h-24 w-full rounded-lg border p-2" /></label>
      <label className="block text-sm">الهاتف<input value={phone} onChange={e => setPhone(e.target.value)} className="mt-1 w-full rounded-lg border p-2" dir="ltr" /></label>
      <label className="block text-sm">الصورة الشخصية<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setAvatar(e.target.files?.[0] ?? null)} className="mt-1 w-full rounded-lg border p-2" /></label>
      <button onClick={save} disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50">{saving ? "جارٍ الحفظ…" : "حفظ البيانات"}</button>
      <hr />
      <label className="block text-sm">كلمة المرور الجديدة<input type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border p-2" dir="ltr" /></label>
      <button onClick={changePassword} disabled={!password} className="rounded-lg border px-4 py-2 disabled:opacity-50">تغيير كلمة المرور</button>
    </div>
  </div>;
}
