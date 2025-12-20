import { getCareersPageData } from "@/lib/data/jobs";
import {
  Briefcase,
  MapPin,
  Clock,
  Building2,
  ArrowLeft,
  SearchX,
} from "lucide-react";
import Link from "next/link";
import { EmploymentType } from "@prisma/client";

export const metadata = {
  title: "فرصت‌های شغلی | کلینیک تخصصی عصر سلامت",
  description: "به تیم متخصصین ما بپیوندید و در محیطی حرفه‌ای رشد کنید.",
};

const typeLabels: Record<EmploymentType, string> = {
  FULL_TIME: "تمام وقت",
  PART_TIME: "پاره وقت",
  CONTRACT: "قراردادی",
};

export default async function CareersPage() {
  // دریافت همزمان شغل‌ها و ایمیل
  const { jobs, email } = await getCareersPageData();

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24 rtl font-yekan">
      {/* 1. HERO SECTION */}
      <div className="relative overflow-hidden px-6 py-16 bg-white border-b border-slate-200 text-center">
        <div className="mx-auto max-w-3xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-bold uppercase tracking-wider mb-4 border border-emerald-100">
            <Briefcase size={14} /> همکاری با ما
          </div>
          <h1 className="text-3xl font-black text-slate-900 sm:text-4xl mb-4 tracking-tight">
            فرصت‌های شغلی
          </h1>
          <p className="text-slate-500 max-w-xl mx-auto font-medium text-sm sm:text-base leading-relaxed">
            ما در کلینیک عصر سلامت همواره به دنبال جذب افراد متخصص و باانگیزه
            هستیم. اگر به فعالیت در محیطی پویا و حرفه‌ای علاقه‌مندید، رزومه خود
            را برای ما ارسال کنید.
          </p>
        </div>

        {/* Background Pattern */}
        <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
          <div className="absolute right-10 top-10 w-64 h-64 bg-emerald-100 rounded-full mix-blend-multiply blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute left-10 bottom-10 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        </div>
      </div>

      {/* 2. JOBS LIST SECTION */}
      <div className="mx-auto max-w-5xl px-6 mt-10">
        {jobs.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="group relative bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 hover:border-emerald-200 flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                {/* Job Info */}
                <div className="flex flex-col gap-3 flex-1">
                  <div className="flex items-start justify-between">
                    <h2 className="text-lg font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
                      {job.title}
                    </h2>
                  </div>

                  <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-bold text-slate-500">
                    {/* Department */}
                    {job.department && (
                      <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-100">
                        <Building2 size={14} className="text-slate-400" />
                        <span>{job.department}</span>
                      </div>
                    )}

                    {/* Location */}
                    {job.location && (
                      <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-100">
                        <MapPin size={14} className="text-slate-400" />
                        <span>{job.location}</span>
                      </div>
                    )}

                    {/* Type */}
                    <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1.5 rounded-md border border-emerald-100">
                      <Clock size={14} />
                      <span>{typeLabels[job.employmentType] || "نامشخص"}</span>
                    </div>
                  </div>

                  {/* Short Description */}
                  {job.description && (
                    <p className="text-sm text-slate-500 line-clamp-2 leading-6 mt-1">
                      {job.description}
                    </p>
                  )}
                </div>

                {/* Action Button using Dynamic Email */}
                <div className="shrink-0">
                  <Link
                    href={`mailto:${email}?subject=درخواست همکاری: ${job.title}`}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-emerald-600 transition-all duration-300 shadow-lg shadow-slate-200 hover:shadow-emerald-200"
                  >
                    <span>ارسال رزومه</span>
                    <ArrowLeft size={16} />
                  </Link>
                </div>
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
              در حال حاضر فرصت شغلی بازی وجود ندارد
            </h3>
            <p className="text-slate-500 text-sm">
              لطفاً بعداً دوباره بررسی کنید یا رزومه خود را برای بانک اطلاعاتی
              ما به آدرس {email} ارسال کنید.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
