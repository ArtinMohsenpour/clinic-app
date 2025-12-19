/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
// اصلاح مسیر وارد کردن داده‌ها بر اساس ساختار پوشه‌بندی استاندارد پروژه
import { getFormsData } from "../../../lib/data/forms";
import {
  FileText,
  Download,
  Search,
  FileType,
  Calendar,
  ShieldCheck,
  Info,
  Paperclip,
  FileDown,
  ArrowLeftCircle,
  FileArchive,
  Image as ImageIcon,
  Languages,
  Layers,
} from "lucide-react";

export const metadata = {
  title: "فرم‌ها و دانلودها | کلینیک تخصصی عصر سلامت",
  description:
    "مرکز دریافت مدارک پزشکی، فرم‌های پذیرش و دستورالعمل‌های درمانی کلینیک عصر سلامت.",
};

/**
 * نگاشت نوع فایل به آیکون و استایل بصری
 */
const getFileMetaData = (mimeType: string | null) => {
  const defaultMeta = {
    icon: <Paperclip size={14} />,
    label: "ضمیمه",
    color: "text-slate-400",
  };
  if (!mimeType) return defaultMeta;

  if (mimeType.includes("pdf"))
    return {
      icon: <FileText size={14} />,
      label: "PDF",
      color: "text-red-500",
    };
  if (mimeType.includes("image"))
    return {
      icon: <ImageIcon size={14} />,
      label: "تصویر",
      color: "text-orange-500",
    };
  if (mimeType.includes("word") || mimeType.includes("officedocument"))
    return {
      icon: <FileText size={14} />,
      label: "Word",
      color: "text-blue-500",
    };
  if (mimeType.includes("zip") || mimeType.includes("rar"))
    return {
      icon: <FileArchive size={14} />,
      label: "فشرده",
      color: "text-purple-500",
    };

  return defaultMeta;
};

/**
 * تبدیل Kind به برچسب فارسی
 */
const getKindLabel = (kind: string | null) => {
  switch (kind) {
    case "ADMISSION":
      return "پذیرش و بستری";
    case "CONSENT":
      return "رضایت‌نامه";
    case "GUIDELINE":
      return "دستورالعمل";
    case "EDUCATION":
      return "آموزشی";
    default:
      return "عمومی";
  }
};

export default async function FormsPage() {
  const forms = await getFormsData();
  console.log("Fetched forms data:", forms);

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24 rtl text-right font-yekan">
      {/* 1. HERO SECTION */}
      <div className="relative overflow-hidden px-6 py-14 bg-white border-b border-slate-200">
        <div className="mx-auto max-w-5xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50 text-blue-700 text-[11px] font-bold uppercase tracking-wider mb-4 border border-blue-100">
            <FileDown size={14} /> مرکز دریافت مستندات
          </div>
          <h1 className="text-3xl font-black text-slate-900 sm:text-4xl mb-3 tracking-tight">
            فرم‌ها و فایل‌های پیوست
          </h1>
          <p className="text-slate-500 max-w-2xl font-medium text-sm sm:text-base leading-relaxed">
            لطفاً پیش از مراجعه حضوری، فرم‌های مورد نیاز را دریافت و تکمیل
            نمایید تا فرآیند پذیرش شما با سرعت بیشتری انجام شود.
          </p>
        </div>
      </div>

      {/* 2. LIST CONTAINER */}
      <div className="mx-auto max-w-5xl px-6 mt-10">
        {/* Search Bar - Sleek Design */}
        <div className="relative mb-10 group max-w-2xl">
          <Search
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"
            size={20}
          />
          <input
            type="text"
            placeholder="جستجو در عنوان یا توضیحات فرم‌ها..."
            className="w-full pr-12 pl-4 py-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all text-sm font-medium shadow-sm"
          />
        </div>

        {/* FORMS LIST - Single Column Wide Rows */}
        {forms && forms.length > 0 ? (
          <div className="flex flex-col gap-4">
            {forms.map((form) => (
              <div
                key={form.id}
                className="group bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-blue-300 hover:shadow-md transition-all duration-300"
              >
                <div className="p-3 md:p-5 flex flex-col lg:flex-row items-start gap-8">
                  {/* Visual Identifier Area */}
                  <div className="hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors border border-slate-100 shadow-inner">
                    <FileType size={28} strokeWidth={1.5} />
                  </div>

                  {/* Core Information Section */}
                  <div className="flex-1 overflow-hidden">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded border border-blue-100 uppercase">
                        {getKindLabel(form.kind)}
                      </span>

                      {form.language && (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded border border-slate-200">
                          <Languages size={10} />
                          {form.language === "Farsi" ? "فارسی" : form.language}
                        </div>
                      )}

                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold border-r border-slate-100 pr-3 mr-1">
                        <Calendar size={12} />
                        {new Date(form.createdAt).toLocaleDateString("fa-IR")}
                      </div>

                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold border-r border-slate-100 pr-3 mr-1">
                        <Download size={12} />
                        {form.downloads || 0} دریافت
                      </div>
                    </div>

                    <h3 className="text-xl font-black text-slate-800 mb-2 group-hover:text-blue-700 transition-colors">
                      {form.title}
                    </h3>

                    {/* Justified Persian Text */}
                    <p className="text-slate-500 text-sm leading-7 font-medium text-justify mb-6">
                      {form.description || ""}
                    </p>

                    {/* ATTACHMENTS GRID - Multiple Sub-files */}
                    {form.assets && form.assets.length > 0 && (
                      <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100 mt-2">
                        <div className="flex items-center gap-2 mb-3 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                          <Paperclip size={14} className="text-blue-500" />
                          <span>
                            فایل‌های ضمیمه و راهنما ({form.assets.length})
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {form.assets.map((asset: any) => {
                            const meta = getFileMetaData(asset.media?.mimeType);
                            return (
                              <a
                                key={asset.media?.id}
                                href={asset.media?.publicUrl || "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between gap-3 px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm group/file"
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <span className={meta.color}>
                                    {meta.icon}
                                  </span>
                                  <span className="truncate text-[11px] font-bold">
                                    {asset.media?.alt || "فایل پیوست"}
                                  </span>
                                </div>
                                <Download
                                  size={12}
                                  className="opacity-30 group-hover/file:opacity-100 transition-opacity"
                                />
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Primary Action Column */}
                  <div className="w-full lg:w-56 shrink-0 flex flex-row lg:flex-col gap-3 border-t lg:border-t-0 lg:border-r border-slate-100 pt-6 lg:pt-0 lg:pr-8 self-stretch justify-center">
                    <div className="flex-1 lg:flex-none">
                      <a
                        href={form.primaryFile?.publicUrl || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-3 w-full py-4 bg-blue-600 text-white text-sm font-black rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/10 active:scale-[0.97]"
                      >
                        <Download size={20} />
                        دانلود فایل اصلی
                      </a>
                      {form.primaryFile?.size && (
                        <p className="hidden lg:block text-center mt-3 text-[10px] text-slate-400 font-bold">
                          حجم:{" "}
                          {(form.primaryFile.size / 1024 / 1024).toFixed(1)}{" "}
                          مگابایت
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <Info size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-bold text-lg">
              هنوز فایلی برای نمایش در این بخش ثبت نشده است.
            </p>
          </div>
        )}

        {/* 3. SUPPORT FOOTER */}
        <div className="mt-16 p-10 rounded-2xl bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden group">
          <div className="relative z-10 text-right">
            <h2 className="text-2xl font-black mb-2 tracking-tight">
              نیاز به راهنمایی دارید؟
            </h2>
            <p className="text-slate-400 text-sm max-w-md font-medium leading-relaxed">
              اگر در دریافت فایل‌ها یا تکمیل فرم‌های پزشکی با مشکلی مواجه شدید،
              تیم پشتیبانی کلینیک عصر سلامت آماده راهنمایی شماست.
            </p>
          </div>
          <div className="relative z-10 flex gap-3 w-full md:w-auto">
            <a
              href="/contact"
              className="flex-1 md:flex-none px-8 py-3 bg-white/10 text-white text-sm font-bold rounded-xl hover:bg-white/20 border border-white/10 backdrop-blur-md flex items-center justify-center gap-2 transition-all"
            >
              <ArrowLeftCircle size={18} /> مرکز تماس
            </a>
          </div>
          {/* Subtle Decorative Gradient */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl transition-transform duration-700 group-hover:scale-125" />
        </div>
      </div>
    </div>
  );
}
