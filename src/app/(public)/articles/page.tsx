import Image from "next/image";
import Link from "next/link";
import { Calendar, User, ArrowLeft } from "lucide-react";
import { getArticlesPageData } from "@/lib/data/articles";

export const metadata = {
  title: "مقالات و اخبار | کلینیک تخصصی",
  description:
    "آخرین مقالات و اخبار کلینیک با محتوای به‌روز و کاربردی برای سلامتی شما.",
};

export default async function ArticlesPage() {
  const articles = await getArticlesPageData();

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="bg-background-2" dir="rtl">
      {/* Hero */}
      <div className="relative isolate overflow-hidden px-6 py-12 lg:px-8">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.amber.50),white)] opacity-40" />
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight bg-gradient-to-l from-golden-yellow to-amber-600 bg-clip-text text-transparent sm:text-6xl font-yekan">
            مقالات و اخبار
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600 font-yekan">
            تازه‌ترین مطالب آموزشی و خبری در حوزه سلامت
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-6 md:px-10 pb-16">
        {(!articles || articles.length === 0) && (
          <div className="mx-auto max-w-md text-center bg-white/70 backdrop-blur p-8 rounded-2xl ring-1 ring-gray-900/5">
            <p className="text-gray-500 font-yekan">در حال حاضر مقاله‌ای منتشر نشده است.</p>
          </div>
        )}

        {articles && articles.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/articles/${article.slug}`}
                className="group relative block rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 bg-white ring-1 ring-gray-200/70"
              >
                {/* Image */}
                <div className="relative bg-gray-100 aspect-[4/3]">
                  {article.cover?.publicUrl ? (
                    <Image
                      src={article.cover.publicUrl}
                      alt={article.cover.alt || article.title}
                      fill
                      className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-amber-50 to-yellow-50" />
                  )}
                </div>

                {/* Body */}
                <div className="p-5">
                  <div className="flex items-center gap-3 text-xs text-gray-500 font-yekan">
                    {article.publishedAt && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(article.publishedAt)}
                      </span>
                    )}
                    {article.author?.name && (
                      <span className="inline-flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        {article.author.name}
                      </span>
                    )}
                  </div>

                  <h3 className="mt-3 text-lg font-extrabold text-gray-900 font-yekan line-clamp-2">
                    {article.title}
                  </h3>
                  {article.excerpt && (
                    <p className="mt-2 text-sm text-gray-600 font-yekan line-clamp-3">
                      {article.excerpt}
                    </p>
                  )}

                  <div className="mt-4 flex justify-end">
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-700 text-sm font-bold rounded-xl border border-amber-500/20 group-hover:bg-amber-500/20 transition-colors font-yekan">
                      مطالعه مقاله
                      <ArrowLeft className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
