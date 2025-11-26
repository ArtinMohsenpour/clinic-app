"use client";

import Image from "next/image";
import Link from "next/link";
import type { Service } from "@prisma/client";
import "./HomeServicesSection.css";
import { ArrowLeft } from "lucide-react"; // Optional: adds a nice icon to the button

// Define the extended type
type ServiceWithCover = Service & {
  cover?: {
    publicUrl: string | null;
    alt: string | null;
  } | null;
  excerpt?: string | null;
  subtitle?: string | null;
};

interface HomeServicesSectionProps {
  data: ServiceWithCover[];
}

export default function HomeServicesSection({
  data,
}: HomeServicesSectionProps) {
  if (!data || data.length === 0) return null;
  console.log("HomeServicesSection data:", data);
  return (
    <div className="mx-auto px-6 md:px-24">
      {/* Section Header */}
      <div className="flex flex-col items-center justify-center text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-extrabold text-service-bg leading-tight font-yekan">
          راهکارهای تخصصی برای سلامت شما
        </h2>
      </div>

      {/* Services Grid */}
      <div className="flex flex-wrap flex-row justify-center gap-8">
        {data.map((service) => (
          <Link
            href={`/services/${service.slug}`}
            key={service.id}
            className="group relative block w-80 h-80 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 ease-out"
          >
            {/* Background Image */}
            <div className="absolute inset-0 h-full w-full bg-gray-100">
              {service.cover?.publicUrl ? (
                <Image
                  src={service.cover.publicUrl}
                  alt={service.cover.alt || service.title}
                  fill
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-110 group-hover:blur-[2px]"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                  <svg
                    className="w-16 h-16 text-blue-200"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* Gradient Overlay (Always visible at bottom to make text readable, expands on hover) */}
            <div className="absolute inset-0 bg-gradient-to-t from-navbar-primary/90 via-navbar-primary/20 to-transparent opacity-60 group-hover:opacity-90 group-hover:from-navbar-primary group-hover:via-navbar-primary/60 group-hover:to-navbar-primary/10 transition-all duration-500" />

            {/* Content Container */}
            <div className="absolute inset-0 flex flex-col justify-end p-6 text-white translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
              {/* Title - Always Visible/Prominent */}
              <h3 className="text-2xl font-bold font-yekan mb-2 drop-shadow-md group-hover:mb-4 transition-all duration-300">
                {service.title}
              </h3>

              {/* Hidden Content - Slides up and fades in on hover */}
              <div className="h-0 overflow-hidden opacity-0 group-hover:h-auto group-hover:opacity-100 transition-all duration-500 delay-75">
                <p className="text-sm text-gray-100 mb-6 font-yekan line-clamp-3 leading-relaxed">
                  {service.excerpt ||
                    service.subtitle ||
                    "برای مشاهده جزئیات بیشتر کلیک کنید."}
                </p>

                <div className="flex justify-end mb-2">
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-golden-yellow text-white text-sm font-bold rounded-xl shadow-md border border-[#fff0] hover:bg-cms-primary hover:shadow-sm hover:shadow-[#ffffff7e] hover:border-[#ffffff69] transition-colors duration-100 font-yekan">
                    مشاهده جزئیات
                    <ArrowLeft className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* View All Button */}
      <div className="flex justify-center mt-12">
        <Link href="/services">
          <button className="px-8 py-3 cursor-pointer rounded-full bg-navbar-primary text-white border-[1px] border-[#ffffff70] font-bold hover:bg-navbar-secondary transition-all shadow-md hover:shadow-lg shadow-cms-primary hover:shadow-cms-primary hover:-translate-y-1">
            مشاهده همه خدمات
          </button>
        </Link>
      </div>
    </div>
  );
}
