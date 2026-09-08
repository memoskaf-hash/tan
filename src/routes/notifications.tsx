import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/notifications")({ component: NotificationsPage });
type Notification = { id: string; title: string; body: string; href: string | null; read_at: string | null; created_at: string };
function NotificationsPage() {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  async function load() {
    if (!user) return;
    const { data } = await (supabase as any).from("notifications").select("id,title,body,href,read_at,created_at").order("created_at", { ascending: false });
    setItems(data ?? []);
  }
  useEffect(() => { void load(); }, [user]);
  async function markRead(id: string) { await (supabase as any).from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id); setItems((current) => current.map((item) => item.id === id ? { ...item, read_at: new Date().toISOString() } : item)); }
  if (loading) return <div className="p-20 text-center">جارٍ التحميل…</div>;
  if (!user) return <div className="p-20 text-center">يرجى تسجيل الدخول.</div>;
  return <div className="mx-auto max-w-3xl px-4 py-12"><div className="flex items-center justify-between"><div><Bell className="h-7 w-7 text-primary" /><h1 className="mt-3 text-3xl font-extrabold">الإشعارات</h1></div><button onClick={async () => { await (supabase as any).from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", user.id).is("read_at", null); await load(); }} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm"><CheckCheck className="h-4 w-4" /> تحديد الكل كمقروء</button></div><div className="mt-8 divide-y rounded-2xl border bg-card">{items.length === 0 ? <p className="p-8 text-center text-muted-foreground">لا توجد إشعارات.</p> : items.map((item) => <button key={item.id} onClick={() => void markRead(item.id)} className={`block w-full p-5 text-right transition hover:bg-muted ${!item.read_at ? "bg-primary/5" : ""}`}><div className="flex items-center justify-between gap-3"><strong>{item.title}</strong><time className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString("ar")}</time></div><p className="mt-2 text-sm text-muted-foreground">{item.body}</p></button>)}</div></div>;
}
