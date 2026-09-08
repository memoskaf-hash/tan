import { createFileRoute } from "@tanstack/react-router";
import { PRODUCTS } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";

export const Route = createFileRoute("/courses")({
  head: () => ({
    meta: [
      { title: "الكورسات التدريبية | جود" },
      {
        name: "description",
        content:
          "كورسات تدريبية بالعربية في التسويق الرقمي، التصميم، والبرمجة مع شهادات إتمام ووصول مدى الحياة.",
      },
      { property: "og:title", content: "الكورسات التدريبية | جود" },
      {
        property: "og:description",
        content: "دورات احترافية بالعربية مع وصول مدى الحياة وشهادة إتمام.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CoursesPage,
});

function CoursesPage() {
  const courses = PRODUCTS.filter((p) => p.type === "course");

  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <h1 className="text-3xl font-bold">الكورسات التدريبية</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        دورات عملية بالعربية يقدّمها مدرّبون بخبرة ميدانية، مع مشاريع تطبيقية وشهادة إتمام ووصول مدى
        الحياة.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((item) => (
          <ProductCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
