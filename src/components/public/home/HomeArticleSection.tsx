"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Calendar, ExternalLink, User } from "lucide-react";

// Define types based on your Prisma output
type Article = {
  id: string;
  title: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any;
  slug: string;
  excerpt: string | null; // Used as "Source"
  cover: {
    publicUrl: string | null;
    alt: string | null;
  } | null;
  author: {
    name: string | null;
    image: string | null;
  } | null;
  publishedAt: string | Date | null;
};

interface HomeArticlesSectionProps {
  data: Article[];
}

export default function HomeArticlesSection({
  data,
}: HomeArticlesSectionProps) {
  // Use only the first 3 articles if more are passed
  const articles = data?.slice(0, 3) || [];

  if (!articles || articles.length === 0) return null;

  // Helper to format date to Persian
  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="w-full   px-6 md:px-24">
      {/* Section Header */}
      <div className="flex flex-col items-center justify-center text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-extrabold text-service-bg leading-tight font-yekan mb-4">
          تازه ترین مقالات و اخبار
        </h2>
        <div className="w-24 h-1 bg-golden-yellow rounded-full"></div>
      </div>

      {/* Articles List (Rows) */}
      <div className="flex flex-col gap-8 mb-16 max-w-6xl mx-auto">
        {articles.map((article) => (
          <Link
            href={`/articles/${article.slug}`}
            key={article.id}
            className="group relative block w-full h-[400px] md:h-[280px] bg-cms-secondary rounded-3xl overflow-hidden shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(19,80,41,0.15)] hover:border-[#135029]/20 border border-transparent transition-all duration-500 ease-out"
          >
            {/* 1. Background Image (Left Side focus) */}
            <div className="absolute top-0 left-0 w-full h-full md:w-1/2 overflow-hidden z-0">
              {article.cover?.publicUrl ? (
                <Image
                  src={article.cover.publicUrl}
                  alt={article.cover.alt || article.title}
                  fill
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  {/* Fallback pattern */}
                </div>
              )}
            </div>

            {/* 2. Gradient Overlay (Right to Left) 
                On Mobile: Bottom to Top
                On Desktop: Right to Left (White -> Transparent)
            */}
            <div className="absolute inset-0 bg-gradient-to-t from-golden-yellow via-golden-yellow/90 to-transparent md:bg-gradient-to-l md:from-golden-yellow md:via-white md:to-transparent md:w-full opacity-100" />

            {/* 3. Content Area (Right Side) */}
            <div className="absolute inset-0 flex flex-col justify-end md:justify-center p-6 md:p-10 md:mr-auto text-right">
              <div className="relative z-10 transform transition-transform duration-500 group-hover:-translate-x-2">
                {/* Meta Row: Source & Date */}
                <div className="flex items-center justify-start gap-4 mb-3">
                  {/* Date */}
                  {article.publishedAt && (
                    <span className="flex items-center gap-1 text-xs text-cms-primary font-yekan px-3 py-1 bg-white rounded-3xl">
                      <Calendar className="w-3 h-3" />
                      {formatDate(article.publishedAt)}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-xl md:text-2xl font-black text-gray-800 font-yekan mb-3 leading-snug group-hover:text-cms-primary transition-colors duration-300">
                  {article.title}
                </h3>

                {/* Body Preview */}
                <p className="w-full md:w-[65%] mb-5 text-sm text-gray-800 font-yekan leading-relaxed text-justify line-clamp-3">
                  {/* Safe check for body content */}
                  {(article as Article).body?.content
                    ? (article as Article).body.content?.slice(0, 300) + "..."
                    : article.excerpt || "متن مقاله در دسترس نیست..."}
                </p>

                {/* Footer Row: Source & Author */}
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  {/* Source Badge */}
                  {article.excerpt && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f5f5f7] text-cms-secondary text-xs font-bold font-yekan border border-gray-200">
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="opacity-70">منبع:</span>
                      <span>{article.excerpt}</span>
                    </div>
                  )}

                  {/* Author Badge */}
                  {article.author && (
                    <div className="inline-flex items-center gap-2 pl-3  rounded-full bg-amber-50 text-amber-900 text-xs font-bold font-yekan border border-gray-200">
                      {/* Avatar Circle */}
                      <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-sm">
                        {article.author.image ? (
                          <Image
                            src={article.author.image}
                            alt={article.author.name || "نویسنده"}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-amber-200 flex items-center justify-center">
                            <User className="w-3.5 h-3.5 text-amber-700" />
                          </div>
                        )}
                      </div>

                      {/* Author Name */}
                      <span>{article.author.name || "مدیر سایت"}</span>
                    </div>
                  )}
                </div>

                {/* Call to Action */}
                <div className="flex justify-start">
                  <span className="text-sm font-bold flex text-cms-primary items-center gap-2 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 delay-100 font-yekan">
                    مطالعه خبر
                    <ArrowLeft className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* View All Button */}
      <div className="flex justify-center">
        <Link href="/articles">
          <button className="px-10 py-3 bg-golden-yellow cursor-pointer text-white  border border-[#ffffff6b] rounded-full text-lg font-bold hover:bg-golden-yellow-2 hover:text-white transition-all duration-300 font-yekan shadow-md hover:shadow-lg shadow-black/30 hover:shadow-black/50 flex items-center gap-2 hover:-translate-y-1">
            مشاهده آرشیو اخبار
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
      </div>
    </div>
  );
}
