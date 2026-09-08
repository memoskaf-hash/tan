import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
export const Route = createFileRoute("/profile")({ component: Profile });
function Profile() {
  const { user, loading } = useAuth(); const [name, setName] = useState(user?.user_metadata?.full_name ?? ""); const [phone, setPhone] = useState(user?.phone ?? ""); const [avatar, setAvatar] = useState(user?.user_metadata?.avatar_url ?? ""); const [password, setPassword] = useState("");
  useEffect(() => {
    if (user) {
      setName(user.user_metadata?.full_name ?? "");
      setPhone(user.phone ?? "");
      setAvatar(user.user_metadata?.avatar_url ?? "");
    }
  }, [user]);
  if (loading) return <div className="mx-auto max-w-xl px-4 py-12">جارٍ تحميل الملف الشخصي…</div>;
  if (!user) return <div className="mx-auto max-w-xl px-4 py-12 text-center">يرجى تسجيل الدخول للوصول إلى ملفك الشخصي.</div>;
  async function save() { const { error } = await supabase.auth.updateUser({ data: { full_name: name, avatar_url: avatar }, phone: phone || undefined }); if (error) toast.error(error.message); else { await supabase.from("profiles").upsert({ id: user!.id, full_name: name, phone, avatar_url: avatar }); toast.success("تم تحديث الملف الشخصي"); } }
  async function changePassword() { const { error } = await supabase.auth.updateUser({ password }); if (error) toast.error(error.message); else { setPassword(""); toast.success("تم تغيير كلمة المرور"); } }
  return <div className="mx-auto max-w-xl px-4 py-12"><h1 className="mb-6 text-2xl font-bold">الملف الشخصي</h1><div className="space-y-4 rounded-2xl border bg-card p-6"><label className="block text-sm">الاسم<input value={name} onChange={e=>setName(e.target.value)} className="mt-1 w-full rounded-lg border p-2" /></label><label className="block text-sm">الهاتف<input value={phone} onChange={e=>setPhone(e.target.value)} className="mt-1 w-full rounded-lg border p-2" dir="ltr" /></label><label className="block text-sm">رابط الصورة<input value={avatar} onChange={e=>setAvatar(e.target.value)} className="mt-1 w-full rounded-lg border p-2" dir="ltr" /></label><button onClick={save} className="rounded-lg bg-primary px-4 py-2 text-primary-foreground">حفظ البيانات</button><hr/><label className="block text-sm">كلمة المرور الجديدة<input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-1 w-full rounded-lg border p-2" dir="ltr" /></label><button onClick={changePassword} disabled={!password} className="rounded-lg border px-4 py-2 disabled:opacity-50">تغيير كلمة المرور</button></div></div>;
}
