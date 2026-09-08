import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@/lib/products";

export const Route = createFileRoute("/store")({ component: StorefrontPage });

function StorefrontPage() {
  const search = Route.useSearch() as { vendor?: string };
  const [vendor, setVendor] = useState<{ id: string; business_name: string } | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  useEffect(() => {
    if (!search.vendor) return;
    (supabase as any).from("vendors").select("id,business_name").eq("id", search.vendor).eq("status", "active").maybeSingle().then(({ data }: { data: { id: string; business_name: string } | null }) => setVendor(data));
    (supabase as any).from("products").select("*").eq("vendor_id", search.vendor).eq("approval_status", "approved").order("created_at", { ascending: false }).then(({ data }: { data: Product[] | null }) => setProducts(data ?? []));
  }, [search.vendor]);
  if (!search.vendor || !vendor) return <div className="mx-auto max-w-xl px-4 py-24 text-center"><Store className="mx-auto h-12 w-12 text-primary" /><h1 className="mt-5 text-2xl font-extrabold">المتجر غير متاح</h1><Link to="/" className="mt-5 inline-block text-primary hover:underline">العودة للمتجر الرئيسي</Link></div>;
  return <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6"><div className="rounded-3xl bg-primary p-8 text-primary-foreground"><Store className="h-9 w-9 text-accent" /><h1 className="mt-4 text-3xl font-extrabold">{vendor.business_name}</h1><p className="mt-2 text-primary-foreground/75">منتجات رقمية وكورسات مختارة من هذا البائع.</p></div>{products.length === 0 ? <p className="py-16 text-center text-muted-foreground">لا توجد منتجات منشورة بعد.</p> : <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{products.map((product) => <ProductCard key={product.id} item={product} />)}</div>}</div>;
}
