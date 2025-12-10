"use client";

import Link from "next/link";
import type { StaticPage } from "@prisma/client";
import { ArrowLeft } from "lucide-react";

interface HomeAboutSectionProps {
  data: StaticPage[];
}

export default function HomeAboutSection({ data }: HomeAboutSectionProps) {
  // Logic: Specifically find the page with slug "clinic-intro"
  const aboutPage = data.find((p) => p.slug === "clinic-intro");

  // If no data is present, return null to hide the section cleanly
  if (!aboutPage) return null;

  return (
    <div className="container mx-auto px-6">
      <div className="flex flex-col items-center justify-center text-center max-w-7xl mx-auto">
        {/* 1. Title: Top Middle */}
        <div className="flex flex-col items-center justify-center text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-service-bg leading-tight font-yekan mb-4">
            {aboutPage.title}
          </h2>
          <div className="w-24 h-1 bg-cms-primary rounded-full"></div>
        </div>

        {/* 2. Text: Below Title (Centered & Readable Width) */}
        <div className="text-gray-600 text-lg md:text-xl leading-9 font-light max-w-5xl text-justify">
          {aboutPage.body ? String(aboutPage.body).replace(/"/g, "") : ""}
        </div>

        {/* Optional: A clean Call to Action button below the text */}
        <div className="flex justify-center mt-24">
          <Link href="/about">
            <button className="px-10 py-3 cursor-pointer rounded-full bg-navbar-secondary text-white border border-white/20 font-bold hover:bg-navbar-hover transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 font-yekan flex items-center gap-3 active:scale-95">
              بیشتر بدانید
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
