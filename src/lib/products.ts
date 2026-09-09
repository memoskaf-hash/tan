export type ProductType = "digital" | "course";

export interface Product {
  id: string;
  slug: string;
  title: string;
  description: string;
  longDescription: string;
  price: number;
  oldPrice?: number;
  type: ProductType;
  features: string[];
  curriculum: { title: string; duration: string }[];
  badge?: string;
  meta: string;
  instructor: string;
  rating: number;
  students: number;
  image_url?: string;
}

export const PRODUCTS: Product[] = [
  {
    id: "p1",
    slug: "notion-productivity-pack",
    title: "حزمة قوالب Notion للإنتاجية",
    description:
      "نظام متكامل لإدارة المهام والأهداف والمشاريع داخل Notion، جاهز للاستخدام فورًا.",
    longDescription:
      "حزمة عملية مصمّمة لمن يريد نظامًا واحدًا يجمع المهام اليومية والأهداف السنوية والمشاريع والملاحظات. كل قالب جاهز للنسخ إلى مساحتك خلال ثوانٍ، مع دليل مصوّر بالعربية يشرح طريقة الاستخدام والتخصيص خطوة بخطوة.",
    price: 29,
    oldPrice: 49,
    type: "digital",
    features: [
      "أكثر من 12 قالبًا احترافيًا",
      "تحديثات مجانية مدى الحياة",
      "دليل استخدام مصور بالعربية",
      "ترخيص استخدام شخصي وتجاري",
    ],
    curriculum: [
      { title: "لوحة التحكم الرئيسية", duration: "قالب" },
      { title: "إدارة المهام اليومية", duration: "قالب" },
      { title: "تتبع الأهداف السنوية", duration: "قالب" },
      { title: "إدارة المشاريع والعملاء", duration: "قالب" },
    ],
    badge: "الأكثر مبيعًا",
    meta: "تحميل فوري · PDF + رابط القالب",
    instructor: "فريق جود",
    rating: 4.9,
    students: 1840,
    image_url: "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: "p2",
    slug: "digital-marketing-course",
    title: "كورس التسويق الرقمي الشامل",
    description:
      "من الصفر إلى الاحتراف: إعلانات ممولة، تحليل بيانات، وبناء حملات تحقق مبيعات حقيقية.",
    longDescription:
      "كورس عملي يأخذك من أساسيات التسويق الرقمي حتى إدارة ميزانيات إعلانية حقيقية. تتعلم بناء الحملات على منصات الإعلانات، كتابة محتوى يبيع، قياس النتائج، وتحسين تكلفة الاستحواذ على العميل بالاعتماد على البيانات.",
    price: 199,
    oldPrice: 299,
    type: "course",
    features: [
      "أكثر من 40 ساعة تدريبية",
      "شهادة إتمام معتمدة",
      "مجموعة دعم خاصة بالطلاب",
      "ملفات وقوالب حملات جاهزة",
    ],
    curriculum: [
      { title: "مقدمة في التسويق الرقمي", duration: "4 ساعات" },
      { title: "إعلانات ميتا خطوة بخطوة", duration: "10 ساعات" },
      { title: "إعلانات جوجل والبحث المدفوع", duration: "9 ساعات" },
      { title: "تحليل البيانات وقياس الأداء", duration: "8 ساعات" },
      { title: "بناء قمع مبيعات متكامل", duration: "9 ساعات" },
    ],
    badge: "خصم 33%",
    meta: "40+ ساعة · وصول مدى الحياة",
    instructor: "م. سارة الحسن",
    rating: 4.8,
    students: 3120,
    image_url: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: "p3",
    slug: "ecommerce-ebook",
    title: "كتاب إلكتروني: أساسيات التجارة الإلكترونية",
    description: "دليل عملي لبناء متجرك الإلكتروني الأول وتحقيق أول ألف دولار مبيعات.",
    longDescription:
      "كتاب مركّز بلا حشو، يشرح اختيار المنتج، تجهيز المتجر، التسعير، الشحن، وأول حملة تسويقية. يحتوي على جداول جاهزة لحساب التكاليف والأرباح وقوائم تحقق لكل مرحلة.",
    price: 15,
    type: "digital",
    features: ["180 صفحة بمحتوى عملي", "قوالب جداول جاهزة", "نسخة PDF وEPUB", "أمثلة من متاجر عربية"],
    curriculum: [
      { title: "اختيار المنتج المناسب", duration: "فصل" },
      { title: "تجهيز المتجر والدفع", duration: "فصل" },
      { title: "التسعير والربحية", duration: "فصل" },
      { title: "أول حملة تسويقية", duration: "فصل" },
    ],
    meta: "تحميل فوري · PDF + EPUB",
    instructor: "أ. خالد منصور",
    rating: 4.7,
    students: 960,
    image_url: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: "p4",
    slug: "figma-ui-course",
    title: "كورس احتراف التصميم بـ Figma",
    description: "تعلّم تصميم واجهات الاستخدام من الأساسيات حتى بناء أنظمة تصميم كاملة.",
    longDescription:
      "من أول نقرة داخل Figma حتى تسليم نظام تصميم متكامل للمطورين. تتعلم الشبكات، التايبوغرافي، المكوّنات، المتغيرات، والنماذج التفاعلية، مع مشاريع عملية تُراجع أسبوعيًا.",
    price: 149,
    type: "course",
    features: [
      "مشاريع عملية واقعية",
      "ملفات عمل مفتوحة المصدر",
      "مراجعة أعمال الطلاب أسبوعيًا",
      "شهادة إتمام معتمدة",
    ],
    curriculum: [
      { title: "أساسيات Figma والواجهة", duration: "5 ساعات" },
      { title: "التايبوغرافي والألوان", duration: "4 ساعات" },
      { title: "المكوّنات والمتغيرات", duration: "7 ساعات" },
      { title: "النماذج التفاعلية والتسليم", duration: "9 ساعات" },
    ],
    meta: "25 ساعة · وصول مدى الحياة",
    instructor: "م. ليان عبد الله",
    rating: 4.9,
    students: 1470,
    image_url: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: "p5",
    slug: "arabic-icons-pack",
    title: "حزمة أيقونات عربية (500+ أيقونة)",
    description: "مكتبة أيقونات SVG عالية الجودة مصممة خصيصًا للواجهات العربية.",
    longDescription:
      "أيقونات موحّدة الأسلوب ومحسّنة للاتجاه من اليمين إلى اليسار، بأحجام وأوزان متعددة. تصل بصيغة SVG نظيفة وملف Figma منظّم يسهل تعديله واستخدامه في أي مشروع.",
    price: 39,
    type: "digital",
    features: ["500+ أيقونة بصيغة SVG", "ترخيص تجاري كامل", "ملفات Figma مرفقة", "دعم اتجاه RTL"],
    curriculum: [
      { title: "أيقونات الواجهة العامة", duration: "180 أيقونة" },
      { title: "أيقونات التجارة والدفع", duration: "120 أيقونة" },
      { title: "أيقونات التواصل الاجتماعي", duration: "100 أيقونة" },
      { title: "أيقونات متنوعة", duration: "100+ أيقونة" },
    ],
    meta: "تحميل فوري · SVG + Figma",
    instructor: "استوديو نقش",
    rating: 4.6,
    students: 720,
    image_url: "https://images.unsplash.com/photo-1559028012-481c04fa702d?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: "p6",
    slug: "python-beginners-course",
    title: "كورس البرمجة بلغة Python للمبتدئين",
    description: "ابدأ رحلتك في البرمجة بمشاريع تطبيقية خطوة بخطوة وباللغة العربية.",
    longDescription:
      "كورس يبدأ من الصفر تمامًا: المتغيرات، الشروط، الحلقات، الدوال، ثم مشاريع حقيقية مثل أدوات سطر أوامر وتحليل بيانات بسيط وأتمتة المهام اليومية.",
    price: 99,
    oldPrice: 149,
    type: "course",
    features: [
      "لا يتطلب خبرة سابقة",
      "10 مشاريع تطبيقية",
      "اختبارات تفاعلية بعد كل وحدة",
      "دعم مباشر من المدرّب",
    ],
    curriculum: [
      { title: "أساسيات اللغة", duration: "6 ساعات" },
      { title: "الدوال والهياكل البيانية", duration: "8 ساعات" },
      { title: "التعامل مع الملفات والبيانات", duration: "8 ساعات" },
      { title: "مشاريع تطبيقية", duration: "8 ساعات" },
    ],
    meta: "30 ساعة · وصول مدى الحياة",
    instructor: "م. عمر الديب",
    rating: 4.8,
    students: 2510,
    image_url: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=85",
  },
];

export function getProductBySlug(slug: string) {
  return PRODUCTS.find((p) => p.slug === slug);
}

export async function fetchProducts(): Promise<Product[]> {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data, error } = await supabase.from("products").select("*").order("created_at");
    if (error || !data?.length) return PRODUCTS;
    return data.map((p) => ({ ...p, longDescription: p.long_description, oldPrice: p.old_price, image_url: p.image_url, features: p.features ?? [], curriculum: p.curriculum ?? [] })) as Product[];
  } catch { return PRODUCTS; }
}
