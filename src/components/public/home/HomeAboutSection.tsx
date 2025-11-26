"use client";

import Link from "next/link";
import type { StaticPage } from "@prisma/client";

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
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#1d1d1f] mb-8 leading-tight">
          {aboutPage.title}
        </h2>

        {/* 2. Text: Below Title (Centered & Readable Width) */}
        <div className="text-gray-600 text-lg md:text-xl leading-9 font-light max-w-5xl text-justify">
          {aboutPage.body ? String(aboutPage.body).replace(/"/g, "") : ""}
        </div>

        {/* Optional: A clean Call to Action button below the text */}
        <div className="mt-10">
          <Link href="/about">
            <button className="px-8 py-3 cursor-pointer rounded-full bg-navbar-primary text-white border-[1px] border-[#ffffff70] font-bold hover:bg-navbar-secondary transition-all shadow-md hover:shadow-lg shadow-cms-primary hover:shadow-cms-primary hover:-translate-y-1">
              بیشتر بدانید
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
