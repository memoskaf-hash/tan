import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-slate-950 text-slate-200">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-3 sm:px-6">
        <div>
          <h2 className="text-xl font-extrabold text-white">جود</h2>
          <p className="mt-3 max-w-xs text-sm leading-7 text-slate-400">
            منتجات رقمية وكورسات تدريبية بالعربية، بتحميل فوري ودفع آمن.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">روابط سريعة</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-400">
            <li><Link to="/" className="hover:text-foreground">الرئيسية</Link></li>
            <li><Link to="/courses" className="hover:text-foreground">الكورسات</Link></li>
            <li><Link to="/about" className="hover:text-foreground">من نحن</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">تواصل معنا</Link></li>
            <li><Link to="/privacy" className="hover:text-foreground">الخصوصية</Link></li>
            <li><Link to="/terms" className="hover:text-foreground">الشروط</Link></li>
            <li><Link to="/refunds" className="hover:text-foreground">الاسترداد</Link></li>
            <li><Link to="/cookies" className="hover:text-foreground">ملفات الارتباط</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">الدعم</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-400">
            <li>ضمان استرداد خلال 14 يومًا</li>
            <li>دعم فني عبر البريد الإلكتروني</li>
            <li>تحديثات مجانية للمنتجات</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-6 text-center text-sm text-slate-500">
        جميع الحقوق محفوظة © {new Date().getFullYear()} جود
      </div>
    </footer>
  );
}
