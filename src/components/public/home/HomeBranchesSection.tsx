"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MapPin, Phone, Star } from "lucide-react";

interface BranchData {
  id: string;
  key: string;
  name: string;
  city: string | null;
  cms: {
    publicAddress: string | null;
    phonePrimary: string | null;
    hero: {
      publicUrl: string | null;
      alt: string | null;
    } | null;
  } | null;
}

interface HomeBranchesSectionProps {
  data: BranchData[];
}

export default function HomeBranchesSection({
  data,
}: HomeBranchesSectionProps) {
  if (!data || data.length === 0) return null;

  // 1. Identify Main Branch (tehran-main) vs Others
  let mainBranch = data.find((b) => b.key === "tehran-main");
  let otherBranches = data.filter((b) => b.key !== "tehran-main");

  // Fallback: If tehran-main is not found, use the first one available
  if (!mainBranch && data.length > 0) {
    mainBranch = data[0];
    otherBranches = data.slice(1);
  }

  // Limit surrounding branches to 4
  otherBranches = otherBranches.slice(0, 4);

  return (
    <div className="w-full px-6 md:px-24">
      {/* --- Section Header --- */}
      <div className="flex flex-col items-center justify-center text-center mb-20">
        <h2 className="text-3xl md:text-4xl font-extrabold text-service-bg leading-tight font-yekan mb-4">
          شعب و مراکز درمانی ما
        </h2>
        <div className="w-24 h-1 bg-navbar-secondary rounded-full"></div>
      </div>

      {/* --- Hub & Spoke Layout --- */}
      {/* Increased height to 800px on desktop for larger, impressive cards */}
      <div className="relative w-full max-w-6xl mx-auto flex flex-col md:block h-auto md:h-[800px]">
        {/* 1. Surrounding Grid (The 4 corners) */}
        <div className="grid grid-cols-1 md:grid-cols-2 w-full h-full gap-8 md:gap-0">
          {otherBranches.map((branch, index) => {
            // Desktop Positioning Logic
            const isLeft = index % 2 === 0;
            const isTop = index < 2;

            const desktopClasses = `
                md:absolute 
                ${isTop ? "md:top-0" : "md:bottom-0"} 
                ${isLeft ? "md:left-0" : "md:right-0"}
                w-full md:w-[48%] md:h-[48%] aspect-square shadow-lg shadow-black/50
            `;

            return (
              <BranchCard
                key={branch.id}
                branch={branch}
                className={desktopClasses}
                isMain={false}
              />
            );
          })}
        </div>

        {/* 2. Main Branch (Center Hub) */}
        {mainBranch && (
          <div className="order-first md:order-none mb-10 md:mb-0 md:absolute md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-full md:w-[48%] md:h-[46%] aspect-square z-20">
            <BranchCard
              branch={mainBranch}
              className="w-full h-full shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)]"
              isMain={true}
            />
          </div>
        )}
      </div>

      {/* --- View All Button --- */}
      <div className="flex justify-center mt-24">
        <Link href="/branches">
          <button className="px-10 py-3 cursor-pointer rounded-full bg-navbar-secondary text-white border border-white/20 font-bold hover:bg-navbar-hover transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 font-yekan flex items-center gap-3 active:scale-95">
            مشاهده همه شعبه ها
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
      </div>
    </div>
  );
}

// --- Card Component ---
function BranchCard({
  branch,
  className,
  isMain,
}: {
  branch: BranchData;
  className?: string;
  isMain: boolean;
}) {
  const imageUrl = branch.cms?.hero?.publicUrl || "/assets/images/logo-asr.png";
  const address = branch.cms?.publicAddress || branch.city || "آدرس ثبت نشده";
  const phone = branch.cms?.phonePrimary;

  // Link Logic
  const isTehran = branch.key === "tehran-main";
  const href = isTehran ? "/branches" : `/branches/${branch.key}`;

  return (
    <Link
      href={href}
      className={`
          group relative block overflow-hidden rounded-[1rem] bg-white
          transition-all duration-700 ease-out
          ${
            isMain
              ? "hover:scale-[1.02]"
              : "hover:scale-[1.02] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2)] hover:z-100"
          }
          ${className}
      `}
    >
      {/* 1. Background Image */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          src={imageUrl}
          alt={branch.cms?.hero?.alt || branch.name}
          fill
          className="object-cover transition-transform duration-[1.5s] ease-in-out group-hover:scale-110"
        />
      </div>

      {/* 2. "Liquid Glass" Overlay */}
      {/* - Initial: Almost transparent (black/5) to see the image.
          - Hover:  bg-slate-900/70 (Dark Frost) + backdrop-blur-md.
          - The transition duration-700 makes it feel "fluid" and liquid-like.
      */}
      <div className="absolute inset-0 bg-black/5 transition-all duration-700 ease-out group-hover:bg-slate-900/70 group-hover:backdrop-blur-sd" />

      {/* 3. Glossy Reflection (Decorative) */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-40 transition-opacity duration-700" />

      {/* 4. Content Wrapper */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white z-10">
        {/* --- STATE A: IDLE (City + Main Badge) --- */}
        {/* Fades out and scales up slightly on hover to give way to details */}
        <div className="absolute inset-0 flex flex-col items-center justify-center transition-all duration-500 ease-out opacity-100 group-hover:opacity-0 group-hover:scale-110 group-hover:blur-sm pointer-events-none">
          {isMain && (
            <div className="mb-4 bg-golden-yellow text-navbar-secondary text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 font-yekan">
              <Star className="w-3 h-3 fill-current" />
              شعبه مرکزی
            </div>
          )}

          {/* Glassy Pill for City Name */}
          <div className="bg-black/20 backdrop-blur-md border border-white/10 px-8 py-3 rounded-2xl shadow-xl">
            <h3 className="text-3xl md:text-5xl font-bold font-digikala text-white drop-shadow-md tracking-wide">
              {branch.city || "شعبه"}
            </h3>
          </div>
        </div>

        {/* --- STATE B: HOVER (Detailed Info) --- */}
        {/* Slides up (translate-y) and fades in */}
        <div className="flex flex-col items-center gap-4 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out translate-y-10 group-hover:translate-y-0 delay-75">
          {/* Branch Name */}
          <h3 className="text-2xl md:text-3xl font-bold font-digikala text-white mb-2 drop-shadow-lg">
            {branch.name}
          </h3>

          {/* Gold Divider */}
          <div className="w-12 h-1 bg-golden-yellow rounded-full shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>

          {/* Address */}
          <div className="flex items-start justify-center gap-2 text-sm md:text-base font-bnazanin leading-relaxed max-w-[85%] text-gray-200">
            <MapPin className="w-5 h-5  shrink-0 text-golden-yellow drop-shadow-sm" />
            <span className="line-clamp-3">{address}</span>
          </div>

          {/* Phone */}
          {phone && (
            <div className="flex items-center gap-2 text-sm md:text-base font-bold font-bnazanin bg-white/10 border border-white/20 px-5 py-2 rounded-full mt-2 hover:bg-white/20 transition-colors">
              <Phone className="w-4 h-4" />
              <span dir="ltr">{phone}</span>
            </div>
          )}

          {/* CTA Link */}
          <div className="mt-6 text-sm font-bold text-golden-yellow font-yekan flex items-center gap-2 border-b border-transparent group-hover:border-golden-yellow transition-all pb-0.5">
            {isTehran ? "مشاهده لیست کامل شعب" : "مشاهده جزئیات شعبه"}
            <ArrowLeft className="w-4 h-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}
