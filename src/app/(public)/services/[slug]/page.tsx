import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Clock, Tags, Wallet } from "lucide-react";
import { getServiceBySlug, getServiceSlugs } from "@/lib/data/services";
import RichTextRenderer from "@/components/common/RichTextRenderer";

// Metadata per service
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const service = await getServiceBySlug(params.slug);
  if (!service || service.status !== "PUBLISHED") {
    return { title: "خدمت یافت نشد" };
  }
  const title = service.seoTitle || service.title;
  const description = service.seoDescription || service.excerpt || service.subtitle || undefined;
  const images = service.cover?.publicUrl ? [service.cover.publicUrl] : undefined;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images,
      type: "article",
    },
  };
}

// Pre-render all published services
export async function generateStaticParams() {
  const slugs = await getServiceSlugs();
  return slugs.map((slug) => ({ slug }));
}

// RichText rendering moved to a shared helper; this page shows body as plain text per requirements.

export default async function ServiceDetailsPage({ params }: { params: { slug: string } }) {
  const service = await getServiceBySlug(params.slug);
  if (!service || service.status !== "PUBLISHED") return notFound();

  const gallery = (service.media || []).map((m) => m.media).filter(Boolean) as { publicUrl: string | null; alt: string | null }[];

  return (
    <div className="bg-background-2" dir="rtl">
      {/* Hero with Cover */}
      <div className="relative isolate overflow-hidden">
        <div className="relative mx-auto max-w-7xl px-6 md:px-10 pb-8 pt-4">
          <div className="relative rounded-2xl overflow-hidden ring-1 ring-gray-200/70 shadow-sm">
            {/* Cover */}
            <div className="relative bg-gray-100 aspect-[16/9]">
              {service.cover?.publicUrl ? (
                <Image
                  src={service.cover.publicUrl}
                  alt={service.cover.alt || service.title}
                  fill
                  priority
                  className="object-cover object-center"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-service-bg via-service-bg/40 to-transparent" />

              {/* Title Block */}
              <div className="absolute inset-0 flex items-end">
                <div className="w-full p-6 sm:p-8 md:p-10">
                  <div className="max-w-3xl text-white">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-yekan drop-shadow">
                      {service.title}
                    </h1>
                    {service.subtitle && (
                      <p className="mt-3 text-white/90 text-lg leading-8 font-yekan">
                        {service.subtitle}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-6 md:px-10 pb-24">
        {/* Main body (rich text) */}
        <div className="rounded-3xl bg-white/70 backdrop-blur p-6 sm:p-8 ring-1 ring-gray-200/70 shadow-sm">
          {service.body ? (
            <RichTextRenderer content={service.body} />
          ) : (
            <p className="text-gray-500 font-yekan text-center">
              توضیحات این خدمت به‌زودی تکمیل خواهد شد.
            </p>
          )}
        </div>

        {/* Gallery */}
        {gallery.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4 font-yekan">گالری تصاویر</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {gallery.slice(0, 9).map((img, idx) => (
                <div key={idx} className="group relative aspect-[4/3] overflow-hidden rounded-2xl ring-1 ring-gray-200/70">
                  {img.publicUrl ? (
                    <Image src={img.publicUrl} alt={img.alt || service.title} fill className="object-cover object-center transition-transform duration-500 group-hover:scale-105" />
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
