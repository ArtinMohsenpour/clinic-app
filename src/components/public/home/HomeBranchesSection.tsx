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
      <div className="flex flex-col items-center justify-center text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-extrabold text-service-bg leading-tight font-yekan mb-4">
          شعبه ها و مراکز درمانی ما
        </h2>
        <div className="w-24 h-1 bg-navbar-secondary rounded-full mb-8"></div>

        {/* --- Added Description Text --- */}
        <p className="text-lg text-gray-600 font-yekan leading-relaxed max-w-3xl mx-auto">
          برای دسترسی راحت‌تر شما عزیزان، در نقاط مختلف حضور داریم. با مراجعه به
          نزدیک‌ترین شعبه، از خدمات تخصصی و کادر مجرب ما بهره‌مند شوید.
        </p>
      </div>

      {/* --- Layout Container --- */}
      <div className="w-full max-w-5xl mx-auto space-y-8">
        {/* 1. Main Branch Row (Centered, Same Size) */}
        {mainBranch && (
          <div className="flex justify-center w-full">
            <div className="w-full ">
              <BranchCard
                branch={mainBranch}
                isMain={true}
                className="w-full h-[400px] shadow-xl shadow-navbar-secondary/10"
              />
            </div>
          </div>
        )}

        {/* 2. Other Branches Grid (2 per row) */}
        {otherBranches.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
            {otherBranches.map((branch) => (
              <BranchCard
                key={branch.id}
                branch={branch}
                isMain={false}
                className="w-full h-[320px] shadow-lg"
              />
            ))}
          </div>
        )}
      </div>

      {/* --- View All Button --- */}
      <div className="flex justify-center mt-20">
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
          group relative block overflow-hidden rounded-[2rem] bg-white
          transition-all duration-500 ease-out
          hover:scale-[1.01] hover:shadow-2xl hover:z-10
          ${className}
      `}
    >
      {/* 1. Background Image */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          src={imageUrl}
          alt={branch.cms?.hero?.alt || branch.name}
          fill
          className="object-cover transition-transform duration-[0.8s] ease-in-out group-hover:scale-104"
        />
      </div>

      {/* 2. "Liquid Glass" Overlay */}
      <div className="absolute inset-0 bg-black/5 transition-all duration-700 ease-out group-hover:bg-slate-900/70 " />

      {/* 3. Glossy Reflection (Decorative) */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-40 transition-opacity duration-700" />

      {/* 4. Content Wrapper */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white z-10">
        {/* --- STATE A: IDLE (City + Main Badge) --- */}
        {/* Fades out and scales up slightly on hover to give way to details */}
        <div className="absolute inset-0 flex flex-col items-center justify-center transition-all duration-500 ease-out opacity-100 group-hover:opacity-0 group-hover:scale-110 group-hover:blur-sm pointer-events-none">
          {isMain && (
            <div className="mb-4 bg-white/80 text-navbar-secondary text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 font-yekan">
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
        <div className="flex flex-col items-center gap-4 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out translate-y-10 group-hover:translate-y-0 delay-75 w-full">
          {/* Branch Name */}
          <h3 className="text-2xl md:text-3xl font-bold font-digikala text-white mb-2 drop-shadow-lg">
            {branch.name}
          </h3>

          {/* Gold Divider */}
          <div className="w-12 h-1 bg-golden-yellow rounded-full shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>

          {/* Address */}
          <div className="flex items-start justify-center gap-2 text-sm md:text-base font-bnazanin leading-relaxed max-w-[90%] text-gray-200">
            <MapPin className="w-5 h-5 shrink-0 text-golden-yellow drop-shadow-sm" />
            <span className="line-clamp-2">{address}</span>
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