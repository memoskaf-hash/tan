import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BadgeCheck, Banknote, Box, CircleDollarSign, Loader2, Plus, Store, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/seller")({ component: SellerPage });

type Vendor = {
  id: string;
  user_id: string;
  business_name: string;
  status: "pending" | "active" | "suspended";
  payout_currency: string;
  payout_email: string | null;
};

type SellerProduct = {
  id: string;
  title: string;
  price: number;
  type: string;
  status?: string;
};
type Sale = { id: string; total: number; status: string; created_at: string };

function SellerPage() {
  const { user, loading } = useAuth();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [businessName, setBusinessName] = useState("");
  const [payoutEmail, setPayoutEmail] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [saving, setSaving] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [productTitle, setProductTitle] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productType, setProductType] = useState<"digital" | "course">("digital");
  const [productDescription, setProductDescription] = useState("");
  const [productImage, setProductImage] = useState("");
  const [productFile, setProductFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [digitalFile, setDigitalFile] = useState<File | null>(null);

  async function loadSeller() {
    if (!user) return;
    setLoadingData(true);
    const client = supabase as any;
    const { data: vendorData, error: vendorError } = await client
      .from("vendors")
      .select("id,user_id,business_name,status,payout_currency,payout_email")
      .eq("user_id", user.id)
      .maybeSingle();
    if (vendorError) {
      toast.error("تعذر تحميل بيانات البائع");
      setLoadingData(false);
      return;
    }
    setVendor(vendorData);
    if (!vendorData) {
      const { data: createdVendor, error: createError } = await client.from("vendors").insert({
        user_id: user.id,
        business_name: user.user_metadata?.full_name ?? "متجر جديد",
        payout_email: user.email,
        payout_currency: "USD",
      }).select("id,user_id,business_name,status,payout_currency,payout_email").single();
      if (!createError && createdVendor) {
        setVendor(createdVendor);
        setBusinessName(createdVendor.business_name);
      }
    }
    if (vendorData) {
      setBusinessName(vendorData.business_name);
      setPayoutEmail(vendorData.payout_email ?? user.email ?? "");
      setCurrency(vendorData.payout_currency);
      const { data: productData } = await client
        .from("products")
        .select("id,title,price,type")
        .eq("vendor_id", vendorData.id)
        .order("created_at", { ascending: false });
      setProducts(productData ?? []);
      const productIds = (productData ?? []).map((product: SellerProduct) => product.id);
      if (productIds.length > 0) {
        const { data: itemData } = await client.from("order_items").select("order_id").in("product_id", productIds);
        const orderIds = (itemData ?? []).map((item: { order_id: string }) => item.order_id);
        if (orderIds.length > 0) {
          const { data: salesData } = await client.from("orders").select("id,total,status,created_at").in("id", orderIds).order("created_at", { ascending: false });
          setSales(salesData ?? []);
        }
      }
    }
    setLoadingData(false);
  }

  useEffect(() => {
    if (!loading) void loadSeller();
  }, [loading, user]);

  async function createVendor(event: React.FormEvent) {
    event.preventDefault();
    if (!user || businessName.trim().length < 2) return;
    setSaving(true);
    const { data, error } = await (supabase as any)
      .from("vendors")
      .insert({
        user_id: user.id,
        business_name: businessName.trim(),
        payout_email: payoutEmail.trim() || user.email,
        payout_currency: currency,
      })
      .select("id,user_id,business_name,status,payout_currency,payout_email")
      .single();
    setSaving(false);
    if (error) {
      toast.error(error.code === "23505" ? "لديك حساب بائع بالفعل" : "تعذر إنشاء حساب البائع");
      return;
    }
    setVendor(data);
    toast.success("تم إنشاء حساب البائع وإرساله للمراجعة");
  }

  async function createProduct(event: React.FormEvent) {
    event.preventDefault();
    const wordCount = productDescription.trim().split(/\s+/).filter(Boolean).length;
    if (!vendor || !productTitle.trim() || wordCount < 50 || (!productImage.trim() && !productFile) || Number(productPrice) <= 0) {
      toast.error("أدخل عنوانًا وسعرًا، ووصفًا لا يقل عن 50 كلمة، وأضف صورة للمنتج");
      return;
    }
    if (productFile && (!productFile.type.startsWith("image/") || productFile.size > 5 * 1024 * 1024)) {
      toast.error("يجب أن تكون صورة المنتج بصيغة صحيحة وحجم أقل من 5 ميجابايت");
      return;
    }
    if (digitalFile && digitalFile.size > 250 * 1024 * 1024) {
      toast.error("حجم ملف التسليم يجب ألا يتجاوز 250 ميجابايت");
      return;
    }
    if (videoFile && (!videoFile.type.startsWith("video/") || videoFile.size > 500 * 1024 * 1024)) {
      toast.error("يجب أن يكون الفيديو بصيغة صحيحة وأقل من 500 ميجابايت");
      return;
    }
    setSaving(true);
    let imageUrl = productImage.trim();
    if (productFile) {
      const safeName = productFile.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const path = `${vendor.id}/${Date.now()}-${safeName}`;
      const { error: uploadError } = await supabase.storage.from("product-assets").upload(path, productFile, { upsert: false });
      if (uploadError) {
        setSaving(false);
        toast.error("تعذر رفع الملف. تحقق من إعدادات التخزين.");
        return;
      }
      imageUrl = supabase.storage.from("product-assets").getPublicUrl(path).data.publicUrl;
    }
    const slug = `${productTitle.toLowerCase().trim().replace(/\s+/g, "-")}-${Date.now()}`;
    let videoUrl = "";
    if (videoFile) {
      const videoPath = `${vendor.id}/videos/${Date.now()}-${videoFile.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
      const upload = await supabase.storage.from("product-assets").upload(videoPath, videoFile, { upsert: false });
      if (upload.error) { setSaving(false); toast.error("تعذر رفع فيديو المنتج"); return; }
      videoUrl = supabase.storage.from("product-assets").getPublicUrl(videoPath).data.publicUrl;
    }
    const { data, error } = await (supabase as any)
      .from("products")
      .insert({
        vendor_id: vendor.id,
        slug,
        title: productTitle.trim(),
        description: productDescription.trim(),
        long_description: productDescription.trim(),
        price: Number(productPrice),
        type: productType,
        features: [],
        curriculum: [],
        instructor: businessName,
        image_url: imageUrl,
        image_urls: [imageUrl],
        video_url: videoUrl || null,
        submitted_by: user?.id,
        approval_status: "pending",
        rating: 0,
        students: 0,
      })
      .select("id,title,price,type")
      .single();
    setSaving(false);
    if (error) {
      toast.error("تعذر إضافة المنتج. تأكد من تطبيق تحديثات قاعدة البيانات.");
      return;
    }
    if (digitalFile && data?.id) {
      const safeName = digitalFile.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const filePath = `${vendor.id}/${data.id}/${Date.now()}-${safeName}`;
      const { error: fileError } = await supabase.storage.from("product-assets").upload(filePath, digitalFile, { upsert: false });
      if (fileError) {
        toast.error("تم إنشاء المنتج لكن تعذر رفع ملف التسليم");
      } else {
        await (supabase as any).from("digital_files").insert({ product_id: data.id, storage_path: filePath, label: digitalFile.name });
      }
    }
    setProducts((current) => [data, ...current]);
    setProductTitle("");
    setProductPrice("");
    setProductDescription("");
    setProductImage("");
    setProductFile(null);
    setVideoFile(null);
    setDigitalFile(null);
    setShowProductForm(false);
    toast.success("تم إرسال المنتج للمراجعة");
  }

  if (loading || loadingData) return <div className="mx-auto max-w-7xl px-4 py-20 text-center text-muted-foreground">جارٍ تحميل حساب البائع…</div>;
  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <Store className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-5 text-3xl font-extrabold">ابدأ البيع على جود</h1>
        <p className="mt-3 text-muted-foreground">سجّل دخولك أولًا لإنشاء حساب البائع وإدارة منتجاتك.</p>
        <Link to="/auth" search={{ redirect: "/seller" }} className="mt-7 inline-flex rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground">تسجيل الدخول</Link>
      </div>
    );
  }

  if (!vendor) return <div className="mx-auto max-w-xl px-4 py-20 text-center">جارٍ تجهيز مساحة إرسال العروض…</div>;

  const statusLabel = vendor.status === "active" ? "نشط" : vendor.status === "pending" ? "قيد المراجعة" : "موقوف";
  const confirmedRevenue = sales.filter((sale) => sale.status === "paid" || sale.status === "confirmed").reduce((sum, sale) => sum + Number(sale.total), 0);
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><span className="text-xs font-bold uppercase tracking-widest text-primary">بوابة البائع</span><h1 className="mt-2 text-3xl font-extrabold">{vendor.business_name}</h1><p className="mt-2 text-muted-foreground">أدر منتجاتك وتابع أرباحك من مكان واحد.</p></div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-accent/15 px-4 py-2 text-sm font-semibold text-accent-foreground"><span className="h-2 w-2 rounded-full bg-accent" />{statusLabel}</span>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5"><Box className="h-5 w-5 text-primary" /><span className="mt-4 block text-sm text-muted-foreground">منتجاتك</span><strong className="mt-1 block text-3xl">{products.length}</strong></div>
        <div className="rounded-2xl border bg-card p-5"><CircleDollarSign className="h-5 w-5 text-accent" /><span className="mt-4 block text-sm text-muted-foreground">المبيعات المؤكدة</span><strong className="mt-1 block text-3xl">{confirmedRevenue.toFixed(2)} <small className="text-sm">{vendor.payout_currency}</small></strong></div>
        <div className="rounded-2xl border bg-card p-5"><WalletCards className="h-5 w-5 text-primary" /><span className="mt-4 block text-sm text-muted-foreground">طلبات الشراء</span><strong className="mt-1 block text-3xl">{sales.length}</strong></div>
      </div>
      <section className="mt-8 rounded-3xl border bg-card p-5 sm:p-7">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="text-xl font-bold">منتجاتك</h2><p className="mt-1 text-sm text-muted-foreground">أرسل منتجًا جديدًا ليقوم فريق جود بمراجعته.</p></div><button onClick={() => setShowProductForm((value) => !value)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 font-semibold text-primary-foreground"><Plus className="h-4 w-4" />إضافة منتج</button></div>
        {showProductForm && <form onSubmit={createProduct} className="mt-6 grid gap-3 rounded-2xl bg-muted p-4 sm:grid-cols-2">
          <input required value={productTitle} onChange={(event) => setProductTitle(event.target.value)} placeholder="عنوان الكورس أو المنتج" className="rounded-xl border bg-background px-3 py-2.5" />
          <input required min="1" type="number" value={productPrice} onChange={(event) => setProductPrice(event.target.value)} placeholder="السعر" className="rounded-xl border bg-background px-3 py-2.5" />
          <select value={productType} onChange={(event) => setProductType(event.target.value as "digital" | "course")} className="rounded-xl border bg-background px-3 py-2.5"><option value="digital">منتج رقمي</option><option value="course">كورس</option></select>
          <div className="space-y-2"><input type="url" value={productImage} onChange={(event) => setProductImage(event.target.value)} placeholder="رابط صورة المنتج (اختياري مع رفع صورة)" className="w-full rounded-xl border bg-background px-3 py-2.5" /><input required={!productImage} type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setProductFile(event.target.files?.[0] ?? null)} className="w-full rounded-xl border bg-background px-3 py-2 text-sm" /></div>
          <label className="rounded-xl border bg-background px-3 py-2.5 text-sm"><span className="mb-2 block font-semibold">فيديو المنتج (اختياري)</span><input type="file" accept="video/*" onChange={(event) => setVideoFile(event.target.files?.[0] ?? null)} /></label>
          <label className="rounded-xl border bg-background px-3 py-2.5 text-sm"><span className="mb-2 block font-semibold">ملف التسليم للمشتري (اختياري)</span><input type="file" onChange={(event) => setDigitalFile(event.target.files?.[0] ?? null)} /></label>
          <textarea required value={productDescription} onChange={(event) => setProductDescription(event.target.value)} placeholder="وصف دقيق لا يقل عن 50 كلمة" className="min-h-32 rounded-xl border bg-background px-3 py-2.5 sm:col-span-2" />
          <p className="text-xs leading-6 text-muted-foreground sm:col-span-2">سيبقى العرض قيد المراجعة حتى موافقة الإدارة.</p>
          <button disabled={saving} className="rounded-xl bg-primary px-4 py-2.5 font-semibold text-primary-foreground sm:col-span-2">{saving ? "جارٍ الإرسال…" : "إرسال العرض للمراجعة"}</button>
        </form>}
        <div className="mt-6 divide-y divide-border rounded-2xl border">{products.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">لم تضف منتجات بعد.</p> : products.map((product) => <div key={product.id} className="flex items-center justify-between gap-4 p-4"><div><strong>{product.title}</strong><span className="mt-1 block text-xs text-muted-foreground">{product.type === "course" ? "كورس تدريبي" : "منتج رقمي"} · قيد المراجعة</span></div><span className="font-bold text-primary">{product.price} {vendor.payout_currency}</span></div>)}</div>
      </section>
      <section className="mt-6 rounded-3xl border bg-card p-5 sm:p-7"><h2 className="text-xl font-bold">إدارة المبيعات</h2><div className="mt-5 overflow-x-auto"><table className="w-full text-right text-sm"><thead><tr className="border-b"><th className="p-3">الطلب</th><th className="p-3">التاريخ</th><th className="p-3">المبلغ</th><th className="p-3">الحالة</th></tr></thead><tbody>{sales.length === 0 ? <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">لا توجد مبيعات بعد.</td></tr> : sales.map((sale) => <tr key={sale.id} className="border-b last:border-0"><td className="p-3" dir="ltr">#{sale.id.slice(0, 8)}</td><td className="p-3">{new Date(sale.created_at).toLocaleDateString("ar")}</td><td className="p-3 font-semibold">{sale.total} {vendor.payout_currency}</td><td className="p-3">{sale.status}</td></tr>)}</tbody></table></div></section>
      <section className="mt-6 rounded-3xl border border-primary/15 bg-primary/5 p-5"><div className="flex items-start gap-3"><Banknote className="mt-1 h-5 w-5 text-primary" /><div><h2 className="font-bold">كيف تحصل على أرباحك؟</h2><p className="mt-1 text-sm leading-7 text-muted-foreground">بعد اعتماد المبيعات، تظهر العمولة في رصيدك المتاح. يمكنك طلب السحب من خلال فريق الدعم بعد استكمال بيانات الدفع.</p></div></div></section>
    </div>
  );
}
