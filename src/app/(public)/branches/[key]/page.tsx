/* eslint-disable @typescript-eslint/no-explicit-any */
import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Phone,
  Mail,
  Clock as ClockIcon,
  ExternalLink,
} from "lucide-react";
import { getBranchByKey, getBranchSlugs } from "@/lib/data/branches";
import RichTextRenderer from "@/components/common/RichTextRenderer";

// Metadata per branch
export async function generateMetadata({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const branch = await getBranchByKey(key);

  if (
    !branch ||
    !branch.isActive ||
    !branch.cms ||
    branch.cms.status !== "PUBLISHED"
  ) {
    return { title: "شعبه یافت نشد" } as const;
  }

  const title =
    branch.cms.title ||
    `${branch.name} ${branch.city ? `| ${branch.city}` : ""}`;
  const description =
    branch.cms.subtitle || branch.cms.publicAddress || undefined;
  const images = branch.cms.hero?.publicUrl
    ? [branch.cms.hero.publicUrl]
    : undefined;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://asr-salamat.ir";
  const canonical = `${baseUrl}/branches/${branch.key}`;

  return {
    title,
    description,
    alternates: { canonical, languages: { "fa-IR": canonical } },
    openGraph: { title, description, images, type: "website", url: canonical },
    twitter: { card: "summary_large_image", title, description, images },
  } as const;
}

export async function generateStaticParams() {
  const keys = await getBranchSlugs();
  return keys.map((key) => ({ key }));
}

export default async function BranchDetailsPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const branch = await getBranchByKey(key);

  if (
    !branch ||
    !branch.isActive ||
    !branch.cms ||
    branch.cms.status !== "PUBLISHED"
  )
    return notFound();

  const gallery = (branch.cms.media || [])
    .map((m) => m.media)
    .filter(Boolean) as { publicUrl: string | null; alt: string | null }[];

  // Opening hours can be an array of {day, open, close}
  const opening: Array<{ day?: string; open?: string; close?: string }> =
    (branch.cms.openingHours as any) || [];

  return (
    <div className="bg-background-2" dir="rtl">
      {/* Hero with Cover (full-bleed on mobile) */}
      <div className="relative isolate overflow-hidden">
        <div className="relative mx-auto max-w-7xl px-6 md:px-10 pb-8 pt-4">
          <div className="relative -mx-6 sm:mx-0 overflow-hidden sm:rounded-xl sm:ring-1 sm:ring-gray-200/70 sm:shadow-sm">
            {/* Cover */}
            <div className="relative bg-gray-100 aspect-[16/9]">
              {branch.cms.hero?.publicUrl ? (
                <Image
                  src={branch.cms.hero.publicUrl}
                  alt={branch.cms.hero.alt || branch.name}
                  fill
                  priority
                  className="object-cover object-center"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-emerald-50 to-teal-50" />
              )}
              {/* Desktop gradient overlay */}
              <div className="absolute h-[240px] bottom-0 inset-x-0 bg-gradient-to-t from-cms-secondary via-cms-secondary/60 to-transparent hidden sm:block" />

              {/* Title Block on desktop */}
              <div className="absolute inset-0 items-end hidden sm:flex">
                <div className="w-full p-6 sm:p-8 md:p-10">
                  <div className="max-w-3xl text-white">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-yekan drop-shadow">
                      {branch.cms.title || branch.name}
                    </h1>
                    {(branch.cms.subtitle || branch.city) && (
                      <p className="mt-3 text-white/90 text-lg leading-8 font-yekan">
                        {branch.cms.subtitle || branch.city}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile title below image */}
            <div className="sm:hidden px-6 pt-4">
              <h1 className="text-2xl font-extrabold font-yekan text-gray-900">
                {branch.cms.title || branch.name}
              </h1>
              {(branch.cms.subtitle || branch.city) && (
                <p className="mt-2 text-gray-600 font-yekan">
                  شهر {branch.cms.subtitle || branch.city}{" "}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-6 md:px-10 pb-24">
        {/* Contact section with modern inline cards (no external component) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {branch.cms.publicAddress && (
            <div className="group grid grid-cols-1 gap-3 rounded-xl bg-white/80 backdrop-blur p-5 ring-1 ring-gray-200/70 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cms-primary/10 text-cms-primary ring-1 ring-cms-primary/20">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[12px] text-gray-500 font-yekan mb-1">
                    آدرس
                  </div>
                  <div className="text-sm text-gray-900 font-yekan">
                    {branch.cms.publicAddress}
                  </div>
                </div>
              </div>
              {branch.cms.mapUrl && (
                <div className="flex items-center gap-2">
                  <Link
                    href={branch.cms.mapUrl}
                    target="_blank"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-cms-primary text-white text-xs font-bold hover:bg-cms-secondary transition-colors font-yekan"
                  >
                    مسیریابی
                  </Link>
                </div>
              )}
            </div>
          )}

          {branch.cms.phonePrimary && (
            <div className="group grid grid-cols-1 gap-3 rounded-xl bg-white/80 backdrop-blur p-5 ring-1 ring-gray-200/70 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cms-primary/10 text-cms-primary ring-1 ring-cms-primary/20">
                  <Phone className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[12px] text-gray-500 font-yekan mb-1">
                    تلفن تماس
                  </div>
                  <div className="text-sm text-gray-900 font-yekan ltr">
                    {branch.cms.phonePrimary}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`tel:${branch.cms.phonePrimary}`}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-cms-primary text-white text-xs font-bold hover:bg-cms-secondary transition-colors font-yekan"
                >
                  تماس
                </Link>
              </div>
            </div>
          )}

          {branch.cms.emailPublic && (
            <div className="group grid grid-cols-1 gap-3 rounded-xl bg-white/80 backdrop-blur p-5 ring-1 ring-gray-200/70 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cms-primary/10 text-cms-primary ring-1 ring-cms-primary/20">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[12px] text-gray-500 font-yekan mb-1">
                    ایمیل
                  </div>
                  {/* Email should use English font and LTR direction */}
                  <div className="text-sm text-gray-900 font-sans ltr">
                    {branch.cms.emailPublic}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`mailto:${branch.cms.emailPublic}`}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-cms-primary text-white text-xs font-bold hover:bg-cms-secondary transition-colors font-yekan"
                >
                  ارسال ایمیل
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Main body */}
        <div className="rounded-2xl bg-white/70 backdrop-blur p-6 sm:p-8 ring-1 ring-gray-200/70 shadow-sm">
          {branch.cms.body ? (
            <RichTextRenderer content={branch.cms.body as any} />
          ) : (
            <p className="text-gray-500 font-yekan text-center">
              اطلاعات این شعبه به‌زودی تکمیل خواهد شد.
            </p>
          )}
        </div>

        {/* Opening hours */}
        {opening && opening.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-bold text-gray-900 mb-3 font-yekan flex items-center gap-2">
              <ClockIcon className="w-5 h-5" /> ساعات کاری
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {opening.map((row, i) => (
                <div
                  key={i}
                  className="rounded-xl bg-white/70 ring-1 ring-gray-200/70 px-4 py-3 font-yekan text-sm text-gray-800 flex items-center justify-between"
                >
                  <span className="text-gray-600">{row.day || ""}</span>
                  <span className="font-bold">
                    {row.open || "—"} تا {row.close || "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gallery */}
        {gallery.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4 font-yekan">
              گالری تصاویر شعبه
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
                      alt={img.alt || branch.name}
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

        {/* Map link */}
        {branch.cms.mapUrl && (
          <div className="mt-10 flex justify-center">
            <Link
              href={branch.cms.mapUrl}
              target="_blank"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-cms-primary text-white font-bold font-yekan hover:bg-cms-secondary transition-colors"
            >
              مشاهده در نقشه
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        )}
        {/* Sticky mobile action bar */}
        {(branch.cms.phonePrimary || branch.cms.mapUrl) && (
          <div className="sm:hidden fixed bottom-4 left-4 right-4 z-20">
            <div className="grid grid-cols-2 gap-3 rounded-2xl bg-white/90 backdrop-blur p-2 ring-1 ring-gray-200 shadow-lg">
              {branch.cms.phonePrimary ? (
                <Link
                  href={`tel:${branch.cms.phonePrimary}`}
                  className="inline-flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-cms-primary text-white font-bold font-yekan"
                >
                  <Phone className="w-5 h-5" /> تماس
                </Link>
              ) : (
                <div className="hidden" />
              )}
              {branch.cms.mapUrl ? (
                <Link
                  href={branch.cms.mapUrl}
                  target="_blank"
                  className="inline-flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-gray-900/5 text-gray-900 font-bold ring-1 ring-gray-200 font-yekan"
                >
                  <MapPin className="w-5 h-5" /> مسیریابی
                </Link>
              ) : (
                <div className="hidden" />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
