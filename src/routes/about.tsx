import { createFileRoute } from "@tanstack/react-router";
import { Users, Sparkles, ShieldCheck, HeartHandshake } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "من نحن | جود" },
      {
        name: "description",
        content:
          "تعرّف على فريق جود ورسالتنا في تقديم منتجات رقمية وكورسات تدريبية عربية عالية الجودة.",
      },
      { property: "og:title", content: "من نحن | جود" },
      {
        property: "og:description",
        content: "رسالتنا: محتوى رقمي عربي عملي يوفّر وقتك ويطوّر مهاراتك.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

const VALUES = [
  { icon: Sparkles, title: "جودة قبل الكمية", text: "كل منتج يمرّ بمراجعة تحريرية وتقنية قبل نشره." },
  { icon: ShieldCheck, title: "دفع وتحميل آمن", text: "روابط تحميل خاصة لكل عملية شراء وحماية للملفات." },
  { icon: HeartHandshake, title: "دعم حقيقي", text: "فريق يجيب على أسئلتك خلال يوم عمل واحد." },
  { icon: Users, title: "مجتمع متعلّمين", text: "أكثر من 10 آلاف متدرب يشاركون خبراتهم ونتائجهم." },
];

function AboutPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <h1 className="text-3xl font-bold">من نحن</h1>
      <p className="mt-4 max-w-3xl text-muted-foreground">
        بدأنا جود من فكرة بسيطة: المحتوى العربي العملي نادر، ومن يجده غالبًا يدفع كثيرًا
        مقابل قليل. نبني اليوم مكتبة من القوالب والكتب والدورات التي تُختصر بها شهور من التجربة
        والخطأ، بلغة واضحة وأمثلة من السوق العربي.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {VALUES.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-2xl border border-border bg-card p-6">
            <Icon className="h-6 w-6 text-primary" />
            <h2 className="mt-4 text-lg font-bold">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{text}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-6 rounded-2xl border border-border bg-card p-8 sm:grid-cols-3 text-center">
        <div>
          <p className="text-3xl font-bold text-primary">10,600+</p>
          <p className="mt-1 text-sm text-muted-foreground">متدرّب ومشترٍ</p>
        </div>
        <div>
          <p className="text-3xl font-bold text-primary">24</p>
          <p className="mt-1 text-sm text-muted-foreground">منتجًا وكورسًا</p>
        </div>
        <div>
          <p className="text-3xl font-bold text-primary">4.8/5</p>
          <p className="mt-1 text-sm text-muted-foreground">متوسط تقييم العملاء</p>
        </div>
      </div>
    </div>
  );
}
