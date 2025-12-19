import { getEducationBySlug } from "@/lib/data/education";
import RichTextRenderer from "@/components/common/RichTextRenderer";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Calendar, User, ChevronRight, Tag, ImageIcon } from "lucide-react";
import Link from "next/link";

export default async function EducationDetail({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getEducationBySlug(params.slug);

  if (!post || post.status !== "PUBLISHED") notFound();

  return (
    <div className="bg-background-2 min-h-screen pb-24">
      <div className="mx-auto max-w-4xl ms:px-6 pt-16">
        {/* Back Link - Persian */}
        <Link
          href="/education"
          className="flex items-center gap-2 text-sm font-bold text-emerald-600 mb-8 hover:text-emerald-700 transition-colors"
        >
          <ChevronRight size={18} /> بازگشت به آموزش بیماران
        </Link>

        {/* Article Header */}
        <header className="mb-12 px-6">
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-6">
            <span className="flex items-center gap-2 bg-white/50 px-3 py-1 rounded-full shadow-sm">
              <Calendar size={14} className="text-emerald-500" />
              {post.publishedAt
                ? new Date(post.publishedAt).toLocaleDateString("fa-IR")
                : "تاریخ ثبت نشده"}
            </span>
            <span className="flex items-center gap-2 bg-white/50 px-3 py-1 rounded-full shadow-sm">
              <User size={14} className="text-emerald-500" />
              {post.author.name}
            </span>
          </div>

          <h1 className="text-4xl font-black tracking-tight text-gray-900 sm:text-5xl mb-8 leading-[1.2]">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="text-xl text-gray-600 leading-9 border-r-4 border-emerald-500 pr-6">
              {post.excerpt}
            </p>
          )}
        </header>

        {/* Featured Cover Image */}
        {post.cover?.publicUrl && (
          <div className="relative aspect-[16/9] w-full overflow-hidden sm:rounded-[2.5rem] shadow-2xl mb-16 group">
            <Image
              src={post.cover.publicUrl}
              alt={post.title}
              fill
              className="object-cover transition duration-700 group-hover:scale-105"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        )}

        {/* Main Content Area */}
        <div className="rounded-[1rem] px-6 bg-white/70 backdrop-blur-md p-5 sm:p-12 shadow-xl shadow-emerald-900/5 ring-1 ring-gray-900/5 mb-12">
          <article className="prose prose-emerald lg:prose-xl max-w-none prose-headings:font-black prose-p:leading-9 prose-p:text-gray-700">
            <RichTextRenderer content={post.body} />
          </article>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="mt-16 pt-10 border-t border-gray-100 flex flex-wrap gap-3">
              {post.tags.map((t) => (
                <span
                  key={t.tag.id}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
                >
                  <Tag size={14} /> {t.tag.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Image Gallery Section */}
        {post.media && post.media.length > 0 && (
          <section className="mt-20 px-6">
            <div className="flex items-center gap-3 mb-10">
              <div className="h-10 w-2 bg-emerald-500 rounded-full" />
              <h2 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                <ImageIcon className="text-emerald-500" /> گالری تصاویر آموزشی
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {post.media.map((item) => (
                <div
                  key={item.media.id}
                  className="relative aspect-square rounded-3xl overflow-hidden shadow-lg group ring-4 ring-white transition duration-500 hover:shadow-2xl hover:-translate-y-2"
                >
                  <Image
                    src={item.media.publicUrl || ""}
                    alt={item.media.alt || "Gallery Image"}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-emerald-900/0 group-hover:bg-emerald-900/20 transition-colors duration-500" />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
