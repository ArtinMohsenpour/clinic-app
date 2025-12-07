"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

interface Insurance {
  id: string;
  name: string;
  slug: string;
  cover?: {
    publicUrl: string | null;
    alt: string | null;
  } | null;
}

interface HomeInsurancesSectionProps {
  data: Insurance[];
}

export default function HomeInsurancesSection({
  data,
}: HomeInsurancesSectionProps) {
  if (!data || data.length === 0) return null;

  return (
    <div className="mx-auto px-6 md:px-24">
      {/* Section Header */}
      <div className="flex flex-col items-center justify-center text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-extrabold text-service-bg leading-tight font-yekan mb-4">
          طرف قرارداد با بیمه های پایه و تکمیلی
        </h2>
        <div className="w-24 h-1 bg-service-bg rounded-full"></div>
        <p className="mt-6 text-gray-500 max-w-2xl text-lg font-yekan leading-relaxed">
          کلینیک عصر سلامت به منظور رفاه حال مراجعین محترم و کاهش هزینه های
          درمانی، با اکثر سازمان های بیمه گر پایه و تکمیلی قرارداد همکاری دارد.
        </p>
      </div>

      {/* Cards Grid */}
      <div className="flex flex-wrap flex-row justify-center gap-6 md:gap-8">
        {data.map((item) => (
          <Link
            href={`/insurances/${item.slug}`}
            key={item.id}
            className="group relative flex flex-col items-center justify-center w-full sm:w-64 h-60 bg-white rounded-3xl border border-gray-100 shadow-lg hover:shadow-2xl hover:shadow-service-bg/10 hover:-translate-y-2 transition-all duration-500 ease-out overflow-hidden"
          >
            {/* Top accent line that appears on hover */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-service-bg to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Logo Container */}
            <div className="relative w-32 h-32 mb-6 transition-transform duration-500 group-hover:scale-110 flex items-center justify-center">
              {item.cover ? (
                <Image
                  src={item.cover.publicUrl!}
                  alt={item.cover.alt || item.name}
                  fill
                  className="object-contain filter grayscale opacity-80 group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-500"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              ) : (
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                  <span className="text-xs">بدون تصویر</span>
                </div>
              )}
            </div>

            {/* Title */}
            <h3 className="text-lg font-bold text-gray-600 group-hover:text-service-bg transition-colors duration-300 font-yekan text-center px-4">
              {item.name}
            </h3>
          </Link>
        ))}
      </div>

      {/* View All Button */}
      <div className="flex justify-center mt-16">
        <Link href="/insurances">
          <button className="px-10 py-3 cursor-pointer rounded-full bg-service-bg text-white border border-white/20 font-bold hover:bg-opacity-90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 font-yekan flex items-center gap-3 active:scale-95">
            مشاهده همه بیمه ها
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
      </div>
    </div>
  );
}
