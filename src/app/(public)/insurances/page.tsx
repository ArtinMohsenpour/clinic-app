import { getInsurancesPageData } from "@/lib/data/insurances";
import { ShieldCheck, SearchX } from "lucide-react";
import Image from "next/image";

export const metadata = {
  title: "بیمه‌های طرف قرارداد | کلینیک تخصصی عصر سلامت",
  description: "لیست بیمه‌های پایه و تکمیلی طرف قرارداد با کلینیک عصر سلامت.",
};

export default async function InsurancesPage() {
  const insurances = await getInsurancesPageData();

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24 rtl font-yekan">
      {/* 1. HERO SECTION */}
      <div className="relative overflow-hidden px-6 py-16 bg-white border-b border-slate-200 text-center">
        <div className="mx-auto max-w-3xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50 text-blue-700 text-[11px] font-bold uppercase tracking-wider mb-4 border border-blue-100">
            <ShieldCheck size={14} /> پوشش‌های بیمه‌ای
          </div>
          <h1 className="text-3xl font-black text-slate-900 sm:text-4xl mb-4 tracking-tight">
            بیمه‌های طرف قرارداد
          </h1>
          <p className="text-slate-500 max-w-xl mx-auto font-medium text-sm sm:text-base leading-relaxed">
            ما برای رفاه حال مراجعین گرامی، با طیف گسترده‌ای از بیمه‌های پایه و
            تکمیلی قرارداد داریم. در لیست زیر می‌توانید شرکت‌های طرف قرارداد را
            مشاهده نمایید.
          </p>
        </div>

        {/* Background Pattern */}
        <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
          <div className="absolute left-10 top-10 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute right-10 bottom-10 w-64 h-64 bg-cyan-100 rounded-full mix-blend-multiply blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        </div>
      </div>

      {/* 2. INSURANCES GRID */}
      <div className="mx-auto max-w-6xl px-6 mt-12">
        {insurances.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {insurances.map((company) => (
              <div
                key={company.id}
                className="group bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col items-center text-center"
              >
                {/* Logo / Cover Image */}
                <div className="relative w-32 h-32 mb-6 bg-slate-50 rounded-full p-4 border border-slate-100 flex items-center justify-center overflow-hidden group-hover:border-blue-100 transition-colors">
                  {company.cover?.publicUrl ? (
                    <Image
                      src={company.cover.publicUrl}
                      alt={company.cover.alt || company.name}
                      fill
                      className="object-contain p-4"
                    />
                  ) : (
                    <ShieldCheck size={48} className="text-slate-300" />
                  )}
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-3 group-hover:text-blue-700 transition-colors">
                  {company.name}
                </h3>

                {/* Description or Coverage Text */}
                {company.description ? (
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {company.description}
                  </p>
                ) : (
                  <p className="text-sm text-slate-400 italic">
                    توضیحات تکمیلی ثبت نشده است.
                  </p>
                )}

                {/* Optional: Show Coverage Details if available */}
                {company.coverageText && (
                  <div className="mt-4 pt-4 border-t border-slate-100 w-full">
                    <span className="text-xs font-bold text-slate-400 block mb-1">
                      سقف پوشش:
                    </span>
                    <span className="text-sm font-bold text-slate-700">
                      {company.coverageText}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-slate-300">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <SearchX size={32} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              لیست بیمه‌ها یافت نشد
            </h3>
            <p className="text-slate-500 text-sm">
              در حال حاضر اطلاعات بیمه‌های طرف قرارداد در سیستم ثبت نشده است.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
