// src/app/(public)/education/page.tsx
import { getEducationListData } from "@/lib/data/education";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, Calendar, ArrowLeft, Tag as TagIcon } from "lucide-react";

export const metadata = {
  title: "آموزش به بیمار | کلینیک تخصصی عصر سلامت",
  description:
    "بانک مقالات آموزشی و توصیه‌های پزشکی برای ارتقای سلامت بیماران.",
};

export default async function EducationPage() {
  const educations = await getEducationListData();

  return (
    <div className="bg-background-2 min-h-screen pb-24">
      {/* 1. HERO SECTION */}
      <div className="relative isolate overflow-hidden px-6 py-20 lg:px-8">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.emerald.50),white)] opacity-30" />

        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-black tracking-tight bg-gradient-to-l from-emerald-600 to-teal-700 bg-clip-text text-transparent sm:text-6xl">
            آموزش به بیمار
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            دانش، کلید بهبودی است. در این بخش جدیدترین مقالات آموزشی و توصیه‌های
            خودمراقبتی را برای شما گردآوری کرده‌ایم.
          </p>
        </div>
      </div>

      {/* 2. ARTICLES GRID */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {educations.length > 0 ? (
          <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {educations.map((item) => (
              <article
                key={item.id}
                className="group relative flex flex-col items-start rounded-3xl bg-white/70 backdrop-blur-md p-2 ring-1 ring-gray-900/5 transition duration-300 hover:shadow-2xl hover:-translate-y-2"
              >
                {/* Image Placeholder or Cover */}
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-gray-100">
                  {item.cover?.publicUrl ? (
                    <Image
                      src={item.cover.publicUrl}
                      alt={item.title}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-emerald-50 text-emerald-200">
                      <BookOpen size={64} />
                    </div>
                  )}
                  {/* Category Badge */}
                  {item.categories?.[0] && (
                    <div className="absolute top-4 right-4 rounded-full bg-white/90 backdrop-blur px-3 py-1 text-xs font-bold text-emerald-700 shadow-sm">
                      {item.categories[0].category.name}
                    </div>
                  )}
                </div>

                <div className="p-6 w-full">
                  <div className="flex items-center gap-x-4 text-xs text-gray-400 mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      {item.publishedAt
                        ? new Date(item.publishedAt).toLocaleDateString("fa-IR")
                        : "به‌زودی"}
                    </div>
                  </div>

                  <h3 className="text-xl font-bold leading-7 text-gray-900 group-hover:text-emerald-600 transition-colors">
                    <Link href={`/education/${item.slug}`}>
                      <span className="absolute inset-0" />
                      {item.title}
                    </Link>
                  </h3>

                  <p className="mt-4 line-clamp-3 text-sm leading-6 text-gray-500">
                    {item.excerpt ||
                      "برای مشاهده جزئیات این مقاله آموزشی کلیک کنید..."}
                  </p>

                  <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                      مطالعه مقاله
                      <ArrowLeft
                        size={14}
                        className="transition-transform group-hover:-translate-x-1"
                      />
                    </span>
                    <TagIcon size={16} className="text-gray-300" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white/40 backdrop-blur rounded-[3rem] border-2 border-dashed border-gray-200">
            <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium text-lg">
              هنوز مقاله آموزشی منتشر نشده است.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
