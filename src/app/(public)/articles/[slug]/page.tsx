/* eslint-disable */
import Image from "next/image";
import { notFound } from "next/navigation";
import { Calendar, User } from "lucide-react";
import { getArticleBySlug, getArticleSlugs } from "@/lib/data/articles";
import RichTextRenderer from "@/components/common/RichTextRenderer";

// Metadata per article
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params; // اضافه کردن await
  const article = await getArticleBySlug(slug);

  if (!article || article.status !== "PUBLISHED")
    return { title: "مقاله یافت نشد" } as const;

  const title = (article as any).seoTitle || article.title;
  const description =
    (article as any).seoDescription || article.excerpt || undefined;
  const images = article.cover?.publicUrl
    ? [article.cover.publicUrl]
    : undefined;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://asr-salamat.ir";
  const canonical = `${baseUrl}/articles/${article.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: { "fa-IR": canonical },
    },
    openGraph: {
      title,
      description,
      images,
      type: "article",
      url: canonical,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
    },
  } as const;
}

// Pre-render all published article slugs
export async function generateStaticParams() {
  const slugs = await getArticleSlugs();
  return slugs.map((slug) => ({ slug }));
}

export default async function ArticleDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params; // اضافه کردن await
  const article = await getArticleBySlug(slug);

  if (!article || article.status !== "PUBLISHED") return notFound();

  const gallery = (article.media || [])
    .map((m) => (m as any).media)
    .filter(Boolean) as { publicUrl: string | null; alt: string | null }[];

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
      {/* Hero with Cover */}
      <div className="relative isolate overflow-hidden">
        <div className="relative mx-auto max-w-7xl px-6 md:px-10 pb-8 pt-4">
          <div className="relative -mx-6 sm:mx-0 overflow-hidden sm:rounded-xl sm:ring-1 sm:ring-gray-200/70 sm:shadow-sm">
            {/* Cover */}
            <div className="relative bg-gray-100 aspect-[16/9]">
              {article.cover?.publicUrl ? (
                <Image
                  src={article.cover.publicUrl}
                  alt={article.cover.alt || article.title}
                  fill
                  priority
                  className="object-cover object-center"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-amber-50 to-yellow-50" />
              )}
              <div className="absolute h-[250px] bottom-0 inset-x-0 bg-gradient-to-t from-golden-yellow via-golden-yellow/70 to-transparent hidden sm:block" />

              {/* Title Block */}
              <div className="absolute inset-0 items-end hidden sm:flex">
                <div className="w-full p-6 sm:p-8 md:p-10">
                  <div className="max-w-3xl text-white">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-yekan drop-shadow">
                      {article.title}
                    </h1>
                    <div className="mt-4 flex flex-wrap items-center gap-4 text-white/90 font-yekan text-sm">
                      {article.publishedAt && (
                        <span className="inline-flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {formatDate(article.publishedAt as any)}
                        </span>
                      )}
                      {article.author?.name && (
                        <span className="inline-flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {article.author.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile title and meta below image (no overlay) */}
            <div className="sm:hidden px-6 pt-4">
              <h1 className="text-2xl font-extrabold font-yekan text-gray-900">
                {article.title}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-gray-600 font-yekan text-sm">
                {article.publishedAt && (
                  <span className="inline-flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {formatDate(article.publishedAt as any)}
                  </span>
                )}
                {article.author?.name && (
                  <span className="inline-flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {article.author.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-6 md:px-10 pb-24">
        {/* Main body (rich text) */}
        <div className="rounded-2xl bg-white/70 backdrop-blur p-6 sm:p-8 ring-1 ring-gray-200/70 shadow-sm">
          {article.body ? (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            <RichTextRenderer content={(article as any).body} />
          ) : (
            <p className="text-gray-500 font-yekan text-center">
              متن این مقاله به‌زودی تکمیل خواهد شد.
            </p>
          )}
        </div>

        {/* Gallery */}
        {gallery.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4 font-yekan">
              گالری تصاویر
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {gallery.slice(0, 9).map((img, idx) => (
                <div
                  key={idx}
                  className="group relative aspect-[4/3] overflow-hidden rounded-xl ring-1 ring-gray-200/70"
                >
                  {img.publicUrl ? (
                    <Image
                      src={img.publicUrl}
                      alt={img.alt || article.title}
                      fill
                      className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
