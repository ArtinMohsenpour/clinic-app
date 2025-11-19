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
  CheckCircle2,
  Edit3,
  TrendingUp,
} from "lucide-react";

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

const MODULES: Array<{
  key: ModuleKey;
  title: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  group: (typeof GROUP_ORDER)[number];
}> = [
  // --- Operations ---
  {
    key: "users",
    title: "پرسنل و کاربران",
    description: "مشاهده لیست تمام پزشکان، پرستاران و کارکنان اداری.",
    icon: Users,
    group: "Operations",
  },
  {
    key: "careers",
    title: "فرصت‌های شغلی",
    description: "مدیریت آگهی‌های استخدام و درخواست‌های ارسال شده.",
    icon: Briefcase,
    group: "Operations",
  },

  // --- Clinic Data ---
  {
    key: "branches",
    title: "شعبه‌ها",
    description: "اطلاعات تماس، آدرس و جزئیات مربوط به هر شعبه.",
    icon: Landmark,
    group: "Clinic Data",
  },
  {
    key: "services",
    title: "خدمات درمانی",
    description: "لیست تخصص‌ها و خدمات پزشکی ارائه شده در کلینیک.",
    icon: Stethoscope,
    group: "Clinic Data",
  },
  {
    key: "schedules",
    title: "برنامه پزشکان",
    description: "مشاهده شیفت‌های کاری و برنامه حضور هفتگی پزشکان.",
    icon: CalendarClock,
    group: "Clinic Data",
  },
  {
    key: "insurance",
    title: "بیمه‌های طرف قرارداد",
    description: "لیست شرکت‌های بیمه و جزئیات پوشش‌دهی آنها.",
    icon: ShieldCheck,
    group: "Clinic Data",
  },
  {
    key: "departments",
    title: "دپارتمان‌ها",
    description: "مدیریت بخش‌های داخلی و ساختار سازمانی کلینیک.",
    icon: Layers,
    group: "Clinic Data",
  },

  // --- Site ---
  {
    key: "hero",
    title: "اسلایدر اصلی",
    description: "مدیریت بنرها و تصاویر متحرک صفحه اصلی سایت.",
    icon: Megaphone,
    group: "Site",
  },
  {
    key: "static-pages",
    title: "صفحات ایستا",
    description: "مدیریت محتوای صفحاتی مانند «درباره ما» و «تماس با ما».",
    icon: LayoutDashboard,
    group: "Site",
  },

  // --- Content ---
  {
    key: "articles",
    title: "مقالات",
    description: "مدیریت مطالب وبلاگ و مقالات علمی سایت.",
    icon: BookOpen,
    group: "Content",
  },
  {
    key: "news",
    title: "اخبار و اطلاعیه‌ها",
    description: "انتشار آخرین اخبار و رویدادهای مربوط به کلینیک.",
    icon: Newspaper,
    group: "Content",
  },
  {
    key: "education",
    title: "آموزش بیمار",
    description: "محتوای آموزشی، بروشورها و ویدیوهای سلامت.",
    icon: FileText,
    group: "Content",
  },
  {
    key: "faq",
    title: "سوالات متداول",
    description: "بانک پرسش و پاسخ‌های رایج بیماران.",
    icon: HelpCircle,
    group: "Content",
  },
  {
    key: "forms",
    title: "فرم‌های دانلود",
    description: "فایل‌های PDF، فرم‌های پذیرش و رضایت‌نامه‌ها.",
    icon: FileDown,
    group: "Content",
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
      <div className="flex h-[80vh] w-full items-center justify-center bg-[#f5f5f7]">
        <Loader2 className="h-12 w-12 animate-spin text-[#008071]/50" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-gray-500 font-yekan">
        <AlertCircle className="h-16 w-16 text-red-400" />
        <p className="text-lg font-medium">خطا در دریافت اطلاعات داشبورد</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-xl bg-[#f5f5f7] px-6 py-2 text-[#008071] hover:bg-white transition-colors shadow-sm"
        >
          تلاش مجدد
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] p-6 pb-20 font-yekan select-none">
      {/* Header */}
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#135029] tracking-tight">
            داشبورد مدیریت
          </h1>
          <p className="text-gray-500 mt-2 text-base">
            نمای کلی عملکرد سیستم، آمار و وضعیت محتوا
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#008071] font-medium bg-white px-4 py-2 rounded-full shadow-sm border border-[#B6EBE5]/30">
          <CalendarClock className="w-4 h-4" />
          {new Date().toLocaleDateString("fa-IR", { dateStyle: "full" })}
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* MAIN CONTENT (Modules) */}
        <div className="xl:col-span-8 space-y-12">
          {GROUP_ORDER.map((groupName) => {
            const groupModules = MODULES.filter((m) => m.group === groupName);
            if (groupModules.length === 0) return null;

            return (
              <section key={groupName} className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-1.5 rounded-full bg-[#135029]" />
                  <h2 className="text-xl font-bold text-[#135029] select-none">
                    {groupName === "Content" && "مدیریت محتوا"}
                    {groupName === "Clinic Data" && "اطلاعات کلینیک"}
                    {groupName === "Site" && "تنظیمات سایت"}
                    {groupName === "Operations" && "عملیات و پرسنل"}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupModules.map((mod) => {
                    const stats = data[mod.key];
                    const Icon = mod.icon;

                    return (
                      <div
                        key={mod.key}
                        className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-transparent transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_10px_40px_-15px_rgba(0,128,113)] hover:border-[rgba(19,80,41,0.51)] select-none"
                      >
                        {/* Header & Icon */}
                        <div className="flex items-start justify-between">
                          <div className="rounded-xl p-3 bg-[#f5f5f7] text-[rgb(0,128,113)] transition-colors group-hover:bg-[#B6EBE5]/20 group-hover:text-[#135029]">
                            <Icon className="h-6 w-6" />
                          </div>
                          {/* Optional subtle trend icon just for visuals */}
                          <TrendingUp className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        </div>

                        {/* Text Content */}
                        <div className="mt-5">
                          <h3 className="text-lg font-bold text-gray-800 group-hover:text-[#135029] transition-colors">
                            {mod.title}
                          </h3>
                          <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                            {mod.description}
                          </p>
                        </div>

                        {/* Stats Footer */}
                        <div className="mt-6 flex items-center justify-between border-t border-gray-50 pt-4">
                          <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
                              کل
                            </span>
                            <span className="text-2xl font-bold text-[#135029]">
                              {stats?.total?.toLocaleString("fa-IR") ?? "۰"}
                            </span>
                          </div>

                          {/* Stats Display */}
                          {mod.key === "users" ? (
                            <div className="text-right flex flex-col items-end">
                              <span className="text-[10px] font-bold text-[#008071] flex items-center gap-1 bg-[#B6EBE5]/30 px-2 py-0.5 rounded-md">
                                <CheckCircle2 className="w-3 h-3" /> فعال
                              </span>
                              <div className="text-lg font-bold text-gray-700 mt-1">
                                {stats?.published?.toLocaleString("fa-IR") ??
                                  "۰"}
                              </div>
                            </div>
                          ) : stats?.drafts !== undefined ? (
                            <div className="text-right flex flex-col items-end">
                              <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md">
                                <Edit3 className="w-3 h-3" /> پیش‌نویس
                              </span>
                              <div className="text-lg font-bold text-gray-700 mt-1">
                                {stats.drafts > 0
                                  ? stats.drafts.toLocaleString("fa-IR")
                                  : "-"}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {/* SIDEBAR (Widgets) */}
        <div className="xl:col-span-4 space-y-8">
          {/* Review Queue Widget */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-50 bg-gradient-to-r from-amber-50/50 to-transparent flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-amber-100 p-1.5 rounded-lg text-amber-700">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-800">نیاز به بررسی</h3>
              </div>
              <span className="text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-bold">
                {data.reviewQueue.length.toLocaleString("fa-IR")}
              </span>
            </div>

            <div className="divide-y divide-gray-50 max-h-[450px] overflow-y-auto custom-scrollbar">
              {data.reviewQueue.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center gap-2 text-gray-400">
                  <ShieldCheck className="w-10 h-10 opacity-20" />
                  <p className="text-sm">همه چیز به‌روز است.</p>
                </div>
              ) : (
                data.reviewQueue.map((item) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="block p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <p className="text-sm font-semibold text-gray-700 line-clamp-2">
                        {item.title}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10px] bg-[#f5f5f7] text-gray-500 px-2 py-0.5 rounded-md font-medium">
                        {item.type}
                      </span>
                      <span className="text-[10px] text-gray-400 dir-ltr font-mono">
                        {new Date(item.updatedAt).toLocaleDateString("fa-IR")}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Activity Log Widget */}
          {data.canViewActivity && (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-50 bg-gradient-to-r from-[#B6EBE5]/30 to-transparent flex items-center gap-2">
                <div className="bg-[#B6EBE5]/50 p-1.5 rounded-lg text-[#008071]">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-800">فعالیت‌های اخیر</h3>
              </div>
              <ul className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto custom-scrollbar">
                {data.recentActivity.length === 0 ? (
                  <li className="p-8 text-center text-sm text-gray-400">
                    هنوز فعالیتی ثبت نشده است.
                  </li>
                ) : (
                  data.recentActivity.map((log) => (
                    <li
                      key={log.id}
                      className="p-4 hover:bg-[#f5f5f7] transition-colors"
                    >
                      <div className="flex gap-3">
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-[#008071] ring-4 ring-[#B6EBE5]/30" />
                          <div className="w-0.5 h-full bg-gray-100" />
                        </div>
                        <div className="flex-1 pb-2">
                          <p className="text-xs font-bold text-gray-700">
                            {log.action}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-1 dir-ltr text-left font-mono">
                            {new Date(log.createdAt).toLocaleString("fa-IR")}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
