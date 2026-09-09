import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/cookies")({ component: () => <Legal title="سياسة ملفات الارتباط"><p>نستخدم التخزين المحلي للسلة وتفضيلات اللغة، وملفات ضرورية لتسجيل الدخول. لا نستخدم ملفات إعلانية اختيارية دون موافقة.</p></Legal> });
function Legal({ title, children }: { title: string; children: React.ReactNode }) { return <article className="mx-auto max-w-3xl px-4 py-16 leading-8"><h1 className="mb-8 text-3xl font-bold">{title}</h1><div className="space-y-5 text-muted-foreground">{children}</div></article>; }
