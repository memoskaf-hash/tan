import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export const LANGUAGES = { ar: "العربية", en: "English", fr: "Français", es: "Español", nl: "Nederlands", de: "Deutsch", sv: "Svenska" } as const;
export type Language = keyof typeof LANGUAGES;
type Dict = Record<string, string>;
const dictionaries: Record<Language, Dict> = {
  ar: { home: "الرئيسية", courses: "الكورسات", about: "من نحن", contact: "تواصل معنا", seller: "بع منتجاتك", messages: "المحادثات", cart: "السلة", purchases: "مشترياتي", login: "دخول", logout: "تسجيل الخروج", profile: "الملف الشخصي", admin: "الإدارة", secure: "دفع آمن", search: "ابحث عن منتج أو كورس...", details: "التفاصيل", digital: "منتج رقمي", course: "كورس تدريبي", add: "أضف إلى السلة", inCart: "في السلة", noResults: "لا توجد نتائج مطابقة لبحثك.", chat: "مساعد المتجر", send: "إرسال" },
  en: { home: "Home", courses: "Courses", about: "About", contact: "Contact", seller: "Sell with us", cart: "Cart", purchases: "My purchases", login: "Login", logout: "Log out", profile: "Profile", admin: "Admin", secure: "Secure payment", search: "Search products or courses...", details: "Details", digital: "Digital product", course: "Training course", add: "Add to cart", inCart: "In cart", noResults: "No matching results.", chat: "Store assistant", send: "Send" },
  fr: { home: "Accueil", courses: "Cours", about: "À propos", contact: "Contact", cart: "Panier", purchases: "Mes achats", login: "Connexion", logout: "Déconnexion", profile: "Profil", admin: "Administration", secure: "Paiement sécurisé", search: "Rechercher...", details: "Détails", digital: "Produit numérique", course: "Cours", add: "Ajouter au panier", inCart: "Dans le panier", noResults: "Aucun résultat.", chat: "Assistant", send: "Envoyer" },
  es: { home: "Inicio", courses: "Cursos", about: "Nosotros", contact: "Contacto", cart: "Carrito", purchases: "Mis compras", login: "Entrar", logout: "Salir", profile: "Perfil", admin: "Admin", secure: "Pago seguro", search: "Buscar...", details: "Detalles", digital: "Producto digital", course: "Curso", add: "Añadir", inCart: "En el carrito", noResults: "Sin resultados.", chat: "Asistente", send: "Enviar" },
  nl: { home: "Home", courses: "Cursussen", about: "Over ons", contact: "Contact", cart: "Winkelmand", purchases: "Mijn aankopen", login: "Inloggen", logout: "Uitloggen", profile: "Profiel", admin: "Beheer", secure: "Veilig betalen", search: "Zoeken...", details: "Details", digital: "Digitaal product", course: "Cursus", add: "Toevoegen", inCart: "In winkelmand", noResults: "Geen resultaten.", chat: "Assistent", send: "Versturen" },
  de: { home: "Startseite", courses: "Kurse", about: "Über uns", contact: "Kontakt", cart: "Warenkorb", purchases: "Meine Käufe", login: "Anmelden", logout: "Abmelden", profile: "Profil", admin: "Admin", secure: "Sichere Zahlung", search: "Suchen...", details: "Details", digital: "Digitales Produkt", course: "Kurs", add: "In den Warenkorb", inCart: "Im Warenkorb", noResults: "Keine Ergebnisse.", chat: "Assistent", send: "Senden" },
  sv: { home: "Hem", courses: "Kurser", about: "Om oss", contact: "Kontakt", cart: "Varukorg", purchases: "Mina köp", login: "Logga in", logout: "Logga ut", profile: "Profil", admin: "Admin", secure: "Säker betalning", search: "Sök...", details: "Detaljer", digital: "Digital produkt", course: "Kurs", add: "Lägg i varukorg", inCart: "I varukorgen", noResults: "Inga resultat.", chat: "Assistent", send: "Skicka" },
};
const I18nContext = createContext<{ language: Language; setLanguage: (l: Language) => void; t: (key: string) => string }>({ language: "ar", setLanguage: () => {}, t: (k) => dictionaries.ar[k] ?? k });
export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("ar");
  const setLanguage = (l: Language) => { setLanguageState(l); localStorage.setItem("language", l); };
  useEffect(() => {
    const stored = localStorage.getItem("language") as Language | null;
    if (stored && stored in LANGUAGES) setLanguageState(stored);
  }, []);
  useEffect(() => { document.documentElement.lang = language; document.documentElement.dir = language === "ar" ? "rtl" : "ltr"; }, [language]);
  return <I18nContext.Provider value={{ language, setLanguage, t: (key) => dictionaries[language][key] ?? dictionaries.ar[key] ?? key }}>{children}</I18nContext.Provider>;
}
export const useI18n = () => useContext(I18nContext);
