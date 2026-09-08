import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@/lib/products";

export const Route = createFileRoute("/favorites")({ component: FavoritesPage });

function FavoritesPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  useEffect(() => {
    if (!loading && !user) { navigate({ to: "/auth", search: { redirect: "/favorites" } }); return; }
    if (!user) return;
    (supabase as any).from("favorites").select("product_id, products(*)").eq("user_id", user.id).then(({ data }: { data: Array<{ products: Product }> | null }) => setProducts((data ?? []).map((item) => item.products).filter(Boolean)));
  }, [user, loading, navigate]);
  if (loading || !user) return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  return <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6"><div className="flex items-center gap-3"><Heart className="h-7 w-7 text-primary" /><div><h1 className="text-3xl font-extrabold">المفضلة</h1><p className="mt-1 text-muted-foreground">المنتجات التي حفظتها للعودة إليها لاحقًا.</p></div></div>{products.length === 0 ? <div className="mt-12 rounded-3xl border border-dashed p-12 text-center"><p className="text-muted-foreground">لم تحفظ منتجات بعد.</p><Link to="/" className="mt-5 inline-block rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground">تصفح المنتجات</Link></div> : <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{products.map((product) => <ProductCard key={product.id} item={product} />)}</div>}</div>;
}
