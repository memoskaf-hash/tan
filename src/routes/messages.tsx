import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/messages")({ component: MessagesPage });

type Conversation = { id: string; order_id: string | null; product_id: string | null; buyer_id: string; seller_id: string; status: string; updated_at: string };
type Message = { id: string; sender_id: string; body: string; created_at: string };

function MessagesPage() {
  const { user, loading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [reason, setReason] = useState("");
  const [showDispute, setShowDispute] = useState(false);
  const [busy, setBusy] = useState(false);

  async function loadConversations() {
    if (!user) return;
    const { data, error } = await (supabase as any).from("conversations").select("*").order("updated_at", { ascending: false });
    if (error) toast.error("تعذر تحميل المحادثات");
    setConversations(data ?? []);
  }

  async function loadMessages(conversation: Conversation) {
    setSelected(conversation);
    const { data } = await (supabase as any).from("conversation_messages").select("id,sender_id,body,created_at,read_at").eq("conversation_id", conversation.id).order("created_at");
    setMessages(data ?? []);
    if (user) await (supabase as any).from("conversation_messages").update({ read_at: new Date().toISOString() }).eq("conversation_id", conversation.id).neq("sender_id", user.id).is("read_at", null);
  }

  useEffect(() => {
    if (user) void loadConversations();
  }, [user]);

  useEffect(() => {
    if (!selected) return;
    const channel = supabase.channel(`conversation-${selected.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "conversation_messages", filter: `conversation_id=eq.${selected.id}` }, (payload) => {
        const incoming = payload.new as Message;
        setMessages((current) => current.some((item) => item.id === incoming.id) ? current : [...current, incoming]);
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [selected]);

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    if (!user || !selected || !body.trim()) return;
    setBusy(true);
    const { data, error } = await (supabase as any).from("conversation_messages").insert({ conversation_id: selected.id, sender_id: user.id, body: body.trim() }).select("id,sender_id,body,created_at").single();
    setBusy(false);
    if (error) { toast.error("تعذر إرسال الرسالة"); return; }
    setMessages((current) => [...current, data]);
    setBody("");
  }

  async function openDispute(event: React.FormEvent) {
    event.preventDefault();
    if (!user || !selected || reason.trim().length < 10) return;
    setBusy(true);
    const { error } = await (supabase as any).from("disputes").insert({ conversation_id: selected.id, order_id: selected.order_id, opened_by: user.id, reason: reason.trim() });
    if (!error) await (supabase as any).from("conversations").update({ status: "under_review" }).eq("id", selected.id);
    setBusy(false);
    if (error) { toast.error("تعذر تسجيل الاعتراض"); return; }
    setReason("");
    setShowDispute(false);
    toast.success("تم رفع الاعتراض. أصبحت المحادثة متاحة للمراجعة من الإدارة.");
    await loadConversations();
  }

  if (loading) return <div className="mx-auto max-w-6xl px-4 py-20 text-center">جارٍ تحميل الرسائل…</div>;
  if (!user) return <div className="mx-auto max-w-xl px-4 py-20 text-center">يرجى تسجيل الدخول للوصول إلى محادثاتك.</div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div><span className="text-xs font-bold uppercase tracking-widest text-primary">التواصل الآمن</span><h1 className="mt-2 text-3xl font-extrabold">محادثاتي</h1><p className="mt-2 text-muted-foreground">تواصل مع الطرف الآخر حول الطلب، ولا تظهر المحادثة للإدارة إلا عند تقديم اعتراض.</p></div>
      <div className="mt-8 grid min-h-[520px] overflow-hidden rounded-3xl border bg-card md:grid-cols-[280px_1fr]">
        <aside className="border-b md:border-b-0 md:border-l">
          <div className="border-b p-4 font-bold">المحادثات ({conversations.length})</div>
          <div className="divide-y">{conversations.map((conversation) => <button key={conversation.id} onClick={() => void loadMessages(conversation)} className={`w-full p-4 text-right transition hover:bg-muted ${selected?.id === conversation.id ? "bg-primary/5" : ""}`}><span className="flex items-center gap-2 text-sm font-semibold"><MessageCircle className="h-4 w-4 text-primary" />طلب #{conversation.order_id?.slice(0, 8) ?? "عام"}</span><span className="mt-1 block text-xs text-muted-foreground">{conversation.status === "under_review" ? "قيد مراجعة الإدارة" : "محادثة مفتوحة"}</span></button>)}</div>
          {conversations.length === 0 && <p className="p-5 text-sm text-muted-foreground">لا توجد محادثات بعد. يمكنك بدء محادثة من صفحة مشترياتك.</p>}
        </aside>
        <section className="flex flex-col">
          {!selected ? <div className="flex flex-1 items-center justify-center p-8 text-center text-muted-foreground"><MessageCircle className="mb-3 h-10 w-10 text-primary/40" /><p>اختر محادثة للبدء</p></div> : <><div className="flex items-center justify-between border-b p-4"><div><h2 className="font-bold">محادثة الطلب</h2><p className="text-xs text-muted-foreground">{selected.status === "under_review" ? "الإدارة تملك صلاحية المراقبة لهذا الاعتراض" : "محادثة خاصة بين المشتري والبائع"}</p></div><button onClick={() => setShowDispute((value) => !value)} className="inline-flex items-center gap-2 rounded-xl border border-destructive/30 px-3 py-2 text-xs font-semibold text-destructive"><AlertTriangle className="h-4 w-4" />رفع اعتراض</button></div><div className="flex-1 space-y-3 overflow-y-auto p-5">{messages.length === 0 && <p className="text-center text-sm text-muted-foreground">ابدأ المحادثة برسالة واضحة.</p>}{messages.map((message) => <div key={message.id} className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-7 ${message.sender_id === user.id ? "mr-auto bg-primary text-primary-foreground" : "bg-muted"}`}>{message.body}</div>)}</div>{showDispute && <form onSubmit={openDispute} className="border-t bg-destructive/5 p-4"><label className="block text-sm font-semibold">سبب الاعتراض</label><textarea required minLength={10} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="اشرح المشكلة بالتفصيل..." className="mt-2 min-h-20 w-full rounded-xl border bg-background p-3 text-sm" /><button disabled={busy} className="mt-2 rounded-xl bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground">إرسال الاعتراض للإدارة</button></form>}<form onSubmit={sendMessage} className="flex gap-2 border-t p-4"><input value={body} onChange={(event) => setBody(event.target.value)} placeholder="اكتب رسالتك..." className="min-w-0 flex-1 rounded-xl border bg-background px-4 py-3 text-sm" /><button disabled={busy} className="rounded-xl bg-primary px-4 text-primary-foreground"><Send className="h-4 w-4" /></button></form></>}
        </section>
      </div>
    </div>
  );
}
