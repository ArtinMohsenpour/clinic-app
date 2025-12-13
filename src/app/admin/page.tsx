"use client";

import { useEffect, useState } from "react";
import {
  Newspaper,
  BookOpen,
  HelpCircle,
  FileDown,
  Landmark,
  Stethoscope,
  ShieldCheck,
  CalendarClock,
  Megaphone,
  LayoutDashboard,
  FileText,
  Briefcase,
  Loader2,
  AlertCircle,
  Clock,
  Activity,
  Users,
  Layers,
  Search,
  BellRing,
  Sparkles,
  Database,
  Globe,
  BriefcaseBusiness,
} from "lucide-react";
import Link from "next/link";

/* ---------- Types ---------- */
type ModuleKey =
  | "articles"
  | "news"
  | "education"
  | "faq"
  | "forms"
  | "services"
  | "branches"
  | "insurance"
  | "schedules"
  | "departments"
  | "hero"
  | "static-pages"
  | "careers"
  | "users";

type StatCounts = { drafts?: number; published?: number; total?: number };

type DashboardData = Record<ModuleKey, StatCounts> & {
  reviewQueue: Array<{
    id: string;
    title: string;
    type: string;
    updatedAt: string;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    createdAt: string;
  }>;
  canViewActivity: boolean;
};

/* ---------- Configuration ---------- */
const GROUP_ORDER = ["Operations", "Clinic Data", "Site", "Content"] as const;

const GROUP_CONFIG = {
  Operations: {
    label: "عملیات و پرسنل",
    icon: BriefcaseBusiness,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
  },
  "Clinic Data": {
    label: "اطلاعات کلینیک",
    icon: Database,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-100",
  },
  Site: {
    label: "تنظیمات سایت",
    icon: Globe,
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-100",
  },
  Content: {
    label: "مدیریت محتوا",
    icon: FileText,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
  },
};

const MODULES: Array<{
  key: ModuleKey;
  title: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  group: (typeof GROUP_ORDER)[number];
  href: string;
}> = [
  // --- Operations ---
  {
    key: "users",
    title: "پرسنل",
    icon: Users,
    group: "Operations",
    href: "/admin/staff-management",
  },
  {
    key: "careers",
    title: "استخدام",
    icon: Briefcase,
    group: "Operations",
    href: "/admin/cms/careers",
  },

  // --- Clinic Data ---
  {
    key: "branches",
    title: "شعبه‌ها",
    icon: Landmark,
    group: "Clinic Data",
    href: "/admin/settings/organization/branches",
  },
  {
    key: "services",
    title: "خدمات",
    icon: Stethoscope,
    group: "Clinic Data",
    href: "/admin/cms/services",
  },
  {
    key: "schedules",
    title: "برنامه",
    icon: CalendarClock,
    group: "Clinic Data",
    href: "/admin/cms/doctors-schedule",
  },
  {
    key: "insurance",
    title: "بیمه‌ها",
    icon: ShieldCheck,
    group: "Clinic Data",
    href: "/admin/cms/insurances",
  },
  {
    key: "departments",
    title: "دپارتمان",
    icon: Layers,
    group: "Clinic Data",
    href: "/admin/settings/organization/departments",
  },

  // --- Site ---
  {
    key: "hero",
    title: "اسلایدر",
    icon: Megaphone,
    group: "Site",
    href: "/admin/cms/hero",
  },
  {
    key: "static-pages",
    title: "صفحات",
    icon: LayoutDashboard,
    group: "Site",
    href: "/admin/cms/static-pages",
  },

  // --- Content ---
  {
    key: "articles",
    title: "مقالات",
    icon: BookOpen,
    group: "Content",
    href: "/admin/cms/articles",
  },
  {
    key: "news",
    title: "اخبار",
    icon: Newspaper,
    group: "Content",
    href: "/admin/cms/news",
  },
  {
    key: "education",
    title: "آموزش",
    icon: FileText,
    group: "Content",
    href: "/admin/cms/education",
  },
  {
    key: "faq",
    title: "سوالات",
    icon: HelpCircle,
    group: "Content",
    href: "/admin/cms/faq",
  },
  {
    key: "forms",
    title: "فرم‌ها",
    icon: FileDown,
    group: "Content",
    href: "/admin/cms/forms",
  },
];

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/admin");
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#f8f9fa]">
        <Loader2 className="h-8 w-8 animate-spin text-[#008071]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 text-gray-500 font-yekan bg-[#f8f9fa]">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <p className="font-medium text-sm">خطا در بارگذاری داشبورد</p>
        <button
          onClick={() => window.location.reload()}
          className="text-xs text-[#008071] hover:underline"
        >
          تلاش مجدد
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-4 md:p-6 font-yekan select-none flex flex-col gap-6">
      {/* --- HEADER --- */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-xl font-black text-gray-800 tracking-tight flex items-center gap-2">
            داشبورد مدیریت
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </h1>
          <p className="text-gray-400 text-[10px] mt-1 font-medium">
            {new Date().toLocaleDateString("fa-IR", { dateStyle: "full" })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-200 text-gray-400 hover:text-[#008071] transition-colors cursor-pointer">
            <Search className="w-4 h-4" />
          </div>
          <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-200 text-gray-400 hover:text-amber-500 transition-colors cursor-pointer relative">
            <BellRing className="w-4 h-4" />
            <span className="absolute top-1.5 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></span>
          </div>
        </div>
      </header>

      {/* --- MAIN BOARD (Columns) --- */}
      <div className="bg-white rounded-[24px] shadow-sm border border-gray-200 p-6 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {GROUP_ORDER.map((groupName) => {
            const groupModules = MODULES.filter((m) => m.group === groupName);
            const groupConfig = GROUP_CONFIG[groupName];
            const GroupIcon = groupConfig.icon;

            if (groupModules.length === 0) return null;

            return (
              <div
                key={groupName}
                className="flex flex-col gap-4 px-0 md:px-4 first:pr-0 last:pl-0 pt-6 md:pt-0 first:pt-0 border-r border-gray-200 first:border-0"
              >
                {/* Column Header */}
                <div className="flex items-center gap-2 mb-2 bg-cms-secondary/20 p-2 rounded-lg">
                  <div
                    className={`p-1.5 rounded-lg ${groupConfig.bg} ${groupConfig.color}`}
                  >
                    <GroupIcon className="w-3.5 h-3.5" />
                  </div>
                  <h2 className="text-base font-bold text-gray-700">
                    {groupConfig.label}
                  </h2>
                  <span className="text-[14px] text-gray-400 bg-gray-50 px-1.5 rounded-md mr-auto">
                    {groupModules.length}
                  </span>
                </div>

                {/* Cards List */}
                <div className="flex flex-col gap-3">
                  {groupModules.map((mod) => {
                    const stats = data[mod.key];
                    const Icon = mod.icon;

                    return (
                      <Link
                        key={mod.key}
                        href={mod.href}
                        className="group flex items-center justify-between bg-white border border-gray-300 hover:border-[#008071]/30 hover:shadow-md rounded-xl p-3 transition-all duration-200 relative overflow-hidden"
                      >
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-gray-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />

                        {/* Left: Icon & Title */}
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 group-hover:bg-[#008071] group-hover:text-white flex items-center justify-center transition-colors shrink-0 shadow-sm border border-gray-100/50">
                            <Icon className="w-5 h-5" />
                          </div>
                          <h3 className="font-bold text-gray-700 text-sm group-hover:text-[#008071] transition-colors">
                            {mod.title}
                          </h3>
                        </div>

                        {/* Right: Stats Row */}
                        <div className="flex items-center  pl-1">
                          {/* Active / Published */}
                          {(stats?.published ?? 0) > 0 && (
                            <div className="flex flex-col items-center">
                              <span className="text-base font-black text-emerald-600 leading-none bg-cms-secondary/10 p-2 rounded">
                                {stats?.published?.toLocaleString("fa-IR")}
                              </span>
                              <span className="text-[9px] text-gray-400 font-medium mt-1">
                                فعال
                              </span>
                            </div>
                          )}

                          {/* Drafts (if any) */}
                          {(stats?.drafts ?? 0) > 0 && (
                            <div className="flex flex-col items-center">
                              <span className="text-lg font-black text-amber-500 leading-none bg-amber-500/10 p-2 rounded">
                                {stats?.drafts?.toLocaleString("fa-IR")}
                              </span>
                              <span className="text-[9px] text-gray-400 font-medium mt-1">
                                پیش‌نویس
                              </span>
                            </div>
                          )}

                          {/* Total Count */}
                          <div
                            className={`flex flex-col items-center ${
                              (stats?.published ?? 0) > 0 ||
                              (stats?.drafts ?? 0) > 0
                                ? "border-r border-gray-100 pr-4 mr-1"
                                : ""
                            }`}
                          >
                            <span className="text-lg font-black text-gray-800 leading-none bg-gray-600/10 p-2 rounded">
                              {stats?.total?.toLocaleString("fa-IR") ?? "۰"}
                            </span>
                            <span className="text-[9px] text-gray-400 font-medium mt-1">
                              کل
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- BOTTOM SECTION: Feeds --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-64 shrink-0">
        {/* 1. Review Queue */}
        <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between mb-4 shrink-0 bg-amber-500/20 p-2 rounded-lg">
            <div className="flex items-center gap-2 ">
              <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg border border-amber-100">
                <Clock className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-gray-700 text-xs">نیاز به بررسی</h3>
            </div>
            <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
              {data.reviewQueue.length.toLocaleString("fa-IR")} مورد
            </span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2">
            {data.reviewQueue.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-2">
                <div className="bg-gray-50 p-3 rounded-full">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-medium">
                  همه چیز عالی است!
                </span>
              </div>
            ) : (
              data.reviewQueue.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl hover:border-amber-200 hover:bg-amber-50/30 transition-all group cursor-default"
                >
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-[11px] font-bold text-gray-700 truncate group-hover:text-amber-700 transition-colors">
                      {item.title}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] bg-gray-50 px-1.5 py-px rounded text-gray-500 border border-gray-100">
                        {item.type}
                      </span>
                      <span className="text-[9px] text-gray-400 dir-ltr font-mono">
                        {new Date(item.updatedAt).toLocaleDateString("fa-IR")}
                      </span>
                    </div>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 2. Recent Activity */}
        {data.canViewActivity && (
          <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between mb-4 shrink-0 bg-cms-secondary/20 p-2 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                  <Activity className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-gray-700 text-xs">
                  فعالیت‌های اخیر
                </h3>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
              {data.recentActivity.length === 0 ? (
                <div className="h-full flex items-center justify-center text-[10px] text-gray-300">
                  هنوز فعالیتی ثبت نشده است.
                </div>
              ) : (
                <div className="relative border-r border-dashed border-gray-200 mr-2 my-1 space-y-6">
                  {data.recentActivity.map((log, idx) => (
                    <div key={log.id} className="relative pr-5 group">
                      <div
                        className={`absolute -right-[5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 ring-4 ring-white transition-all duration-300 ${
                          idx === 0
                            ? "bg-emerald-500 border-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.1)]"
                            : "bg-gray-100 border-gray-200 group-hover:bg-emerald-400 group-hover:border-emerald-400"
                        }`}
                      />
                      <div className="flex flex-col">
                        <p className="text-[10px] font-bold text-gray-600 leading-snug group-hover:text-gray-900 transition-colors truncate">
                          {log.action}
                        </p>
                        <span className="text-[9px] text-gray-400 dir-ltr text-right font-mono mt-0.5">
                          {new Date(log.createdAt).toLocaleString("fa-IR", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}