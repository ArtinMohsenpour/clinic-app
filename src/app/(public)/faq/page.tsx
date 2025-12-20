import { getFaqData } from "../../../lib/data/faq";
import FaqList from "@/components/public/FAQ/FaqList";
import {
  MessageCircleQuestion,
  HelpCircle,
  ArrowLeftCircle,
} from "lucide-react";

export const metadata = {
  title: "سوالات متداول | کلینیک تخصصی عصر سلامت",
  description:
    "پاسخ به پرسش‌های معمول مراجعین درباره خدمات درمانی، نوبت‌دهی و بیمه‌های طرف قرارداد.",
};

export default async function FaqPage() {
  const rawData = await getFaqData();
  const faqs = Array.isArray(rawData) ? rawData : [];

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24 rtl">
      {/* 1. HERO SECTION */}
      <div className="relative overflow-hidden px-6 py-12 bg-white border-b border-slate-200 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50 text-blue-700 text-[11px] font-bold uppercase tracking-wider mb-4 border border-blue-100">
            <MessageCircleQuestion size={14} /> مرکز راهنمایی و پشتیبانی
          </div>
          <h1 className="text-3xl font-black text-slate-900 sm:text-4xl mb-3 tracking-tight">
            سوالات متداول
          </h1>
          <p className="text-slate-500 max-w-xl mx-auto font-medium text-sm sm:text-base leading-relaxed">
            در این بخش می‌توانید پاسخ سریع به سوالات پرتکرار مراجعین کلینیک عصر
            سلامت را مشاهده کنید.
          </p>
        </div>
      </div>

      {/* 2. FAQ LIST SECTION */}
      <div className="mx-auto max-w-4xl px-6 mt-10">
        {faqs.length > 0 ? (
          /* Pass data to the Client Component */
          <FaqList faqs={faqs} />
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-slate-200">
            <HelpCircle size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-400 font-bold text-lg">
              هنوز سوالی ثبت نشده است.
            </p>
          </div>
        )}

        {/* 3. SUPPORT CARD */}
        <div className="mt-12 p-8 rounded-xl bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="relative z-10 text-right">
            <h2 className="text-xl font-black mb-2">هنوز سوالی دارید؟</h2>
            <p className="text-slate-400 text-sm font-medium">
              کارشناسان ما آماده پاسخگویی به سوالات اختصاصی شما هستند.
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap gap-3">
            <a
              href="contact"
              className="px-6 py-2.5 bg-white/10 text-white text-sm font-bold rounded-lg hover:bg-white/20 transition-all border border-white/10 backdrop-blur-md flex items-center gap-2"
            >
              <ArrowLeftCircle size={16} /> تماس مستقیم
            </a>
          </div>
          <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl" />
        </div>
      </div>
    </div>
  );
}