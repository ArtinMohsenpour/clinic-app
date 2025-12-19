import { getFaqData } from "../../../lib/data/faq";
import RichTextRenderer from "../../../components/common/RichTextRenderer";
import {
  ChevronDown,
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
      {/* 1. HERO SECTION - Clean and Professional */}
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

      {/* 2. FAQ LIST - Single Column Wide Design */}
      <div className="mx-auto max-w-4xl px-6 mt-10">
        {faqs.length > 0 ? (
          <div className="flex flex-col gap-3">
            {faqs.map((faq) => (
              <details
                key={faq.id}
                name="faq-group"
                className="group overflow-hidden rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-all duration-300 shadow-sm"
              >
                <summary className="flex items-center justify-between p-4 sm:p-5 cursor-pointer list-none outline-none select-none">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400 transition-all duration-300 group-open:bg-blue-600 group-open:text-white group-open:rotate-180">
                      <ChevronDown size={18} />
                    </div>
                    <span className="text-base font-bold text-slate-800 transition-colors group-open:text-blue-700 text-right leading-relaxed">
                      {faq.question}
                    </span>
                  </div>

                  {faq.categories?.[0]?.category?.name && (
                    <span className="hidden md:inline-block px-2 py-0.5 bg-slate-100 text-[10px] font-bold text-slate-500 rounded border border-slate-200 mr-4">
                      {faq.categories[0].category.name}
                    </span>
                  )}
                </summary>

                {/* ANIMATION WRAPPER: Smooth transition for Server Components */}
                <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-in-out group-open:grid-rows-[1fr]">
                  <div className="overflow-hidden">
                    <div className="px-5 pb-6 pt-2 border-t border-slate-50 mr-12 ml-4">
                      <div className="prose prose-blue max-w-none text-slate-600 leading-8 text-justify font-medium pt-3 text-sm md:text-base">
                        {/* Safe rendering of Rich Text with justification */}
                        {faq.answer && (
                          <RichTextRenderer content={faq.answer} />
                        )}
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-bold">
                        <span className="opacity-70">
                          آخرین بروزرسانی:{" "}
                          {faq.updatedAt
                            ? new Date(faq.updatedAt).toLocaleDateString(
                                "fa-IR"
                              )
                            : "---"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </details>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-slate-200">
            <HelpCircle size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-400 font-bold text-lg">
              هنوز سوالی ثبت نشده است.
            </p>
          </div>
        )}

        {/* 3. SUPPORT / CTA CARD - Professional Wide Layout */}
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

          {/* Subtle Decorative Gradient */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl" />
        </div>
      </div>
    </div>
  );
}
