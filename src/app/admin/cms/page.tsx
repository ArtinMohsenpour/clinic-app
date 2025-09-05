"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
  Navigation,
  Search,
  Briefcase,
} from "lucide-react";

/* ---------- Types ---------- */
type ModuleKey =
  | "articles"
  | "news"
  | "education"
  | "faq"
  | "forms"
  | "media"
  | "services"
  | "departments"
  | "insurance"
  | "schedules"
  | "branches"
  | "hero"
  | "pages"
  | "navigation"
  | "seo"
  | "careers";

type StatCounts = { drafts?: number; published?: number; total?: number };

// Split module counts from extras so the index signature is preserved
type ModuleCounts = Partial<Record<ModuleKey, StatCounts>>;

type CmsStatsResponse = ModuleCounts & {
  reviewQueue?: Array<{
    id: string;
    title: string;
    type: string;
    updatedAt: string;
  }>;
  recentActivity?: Array<{ id: string; action: string; createdAt: string }>;
  canViewActivity?: boolean;
};

const MODULES: Array<{
  key: ModuleKey;
  title: string;
  description: string;
  hrefManage: string;
  hrefNew?: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  group: "Content" | "Clinic Data" | "Site" | "Operations";
  requireRoleKeys?: string[];
}> = [
  // محتوا
  {
    key: "articles",
    title: "مقالات",
    description: "محتوای وبلاگ و بلند.",
    hrefManage: "/admin/cms/articles",
    hrefNew: "/admin/cms/articles/new",
    icon: BookOpen,
    group: "Content",
  },
  {
    key: "news",
    title: "اخبار",
    description: "اعلان‌ها و به‌روزرسانی‌ها.",
    hrefManage: "/admin/cms/news",
    hrefNew: "/admin/cms/news/new",
    icon: Newspaper,
    group: "Content",
  },
  {
    key: "education",
    title: "آموزش بیماران",
    description: "راهنماها، ویدیوها، PDF.",
    hrefManage: "/admin/cms/education",
    hrefNew: "/admin/cms/education/new",
    icon: FileText,
    group: "Content",
  },
  {
    key: "faq",
    title: "سؤالات متداول",
    description: "پرسش و پاسخ‌های کلیدی.",
    hrefManage: "/admin/cms/faq",
    icon: HelpCircle,
    group: "Content",
  },
  {
    key: "forms",
    title: "فرم‌ها و فایل‌ها",
    description: "پذیرش، رضایت‌نامه.",
    hrefManage: "/admin/cms/forms",
    hrefNew: "/admin/cms/forms/new",
    icon: FileDown,
    group: "Content",
  },

  // داده‌های کلینیک

  {
    key: "branches",
    title: "شعبه‌ها",
    description: "صفحه شعبه، اطلاعات تماس، گالری.",
    hrefManage: "/admin/cms/branches", // list/select a branch to edit its content
    icon: Landmark,
    group: "Clinic Data",
  },
  {
    key: "services",
    title: "خدمات",
    description: "سرویس‌ها و رویه‌ها.",
    hrefManage: "/admin/cms/services",
    hrefNew: "/admin/cms/services/new",
    icon: Stethoscope,
    group: "Clinic Data",
  },
  {
    key: "insurance",
    title: "شرکای بیمه",
    description: "شرکت‌های طرف قرارداد.",
    hrefManage: "/admin/cms/insurances",
    hrefNew: "/admin/cms/insurances/new",
    icon: ShieldCheck,
    group: "Clinic Data",
  },
  {
    key: "schedules",
    title: "برنامه حضور پزشکان",
    description: "نمایش فقط‌خواندنی.",
    hrefManage: "/admin/cms/doctors-schedule",
    icon: CalendarClock,
    group: "Clinic Data",
  },

  // سایت
  {
    key: "hero",
    title: "اسلایدر صفحه اصلی",
    description: "اسلایدها و بنرها.",
    hrefManage: "/admin/cms/hero",
    hrefNew: "/admin/cms/hero/new",
    icon: Megaphone,
    group: "Site",
  },
  {
    key: "pages",
    title: "صفحات ایستا",
    description: "درباره‌ما، تماس‌با‌ما و…",
    hrefManage: "/admin/cms/pages",
    hrefNew: "/admin/cms/pages/new",
    icon: LayoutDashboard,
    group: "Site",
  },
  {
    key: "navigation",
    title: "منوهای سایت",
    description: "ناوبری هدر و فوتر.",
    hrefManage: "/admin/cms/navigation",
    icon: Navigation,
    group: "Site",
  },
  {
    key: "seo",
    title: "سئو و ریدایرکت‌ها",
    description: "عنوان‌ها، متا و مسیرهای جایگزین.",
    hrefManage: "/admin/cms/seo",
    icon: Search,
    group: "Site",
  },

  // عملیات
  {
    key: "careers",
    title: "فرصت‌های شغلی",
    description: "لیست آگهی و فرم درخواست.",
    hrefManage: "/admin/cms/careers",
    hrefNew: "/admin/cms/careers/new",
    icon: Briefcase,
    group: "Operations",
  },
];

export default function CmsHomePage() {
  // UI state
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CmsStatsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // If you expose user roles on client, put keys here to gate modules (optional)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const userRoleKeys: string[] = [];

  const groupsFa: Record<(typeof MODULES)[number]["group"], string> = {
    Content: "محتوا",
    "Clinic Data": "داده‌های کلینیک",
    Site: "سایت",
    Operations: "عملیات",
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/admin/cms/stats", { cache: "no-store" });
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(j?.error || "Failed to load stats");
        }
        const j = (await res.json()) as CmsStatsResponse;
        if (!cancelled) setStats(j);
      } catch {
        if (!cancelled) setError("خطا در بارگذاری آمار CMS");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleModules = useMemo(
    () =>
      MODULES.filter(
        (m) =>
          !m.requireRoleKeys ||
          m.requireRoleKeys.some((rk) => userRoleKeys.includes(rk))
      ).filter((m) =>
        q.trim()
          ? [m.title, m.description]
              .join(" ")
              .toLowerCase()
              .includes(q.toLowerCase())
          : true
      ),
    [q, userRoleKeys]
  );

  const moduleCounts = useMemo(() => (stats ?? {}) as ModuleCounts, [stats]);

  return (
    <div
      dir="rtl"
      className="p-6 pb-12 bg-gradient-to-b from-white to-gray-50 rounded-2xl shadow-md ring-1 ring-gray-100 select-none space-y-6"
    >
      <h1 className="text-2xl md:text-3xl font-extrabold text-navbar-primary text-center">
        مرکز مدیریت محتوا <span className="ltr-input">(CMS)</span>
      </h1>

      {/* Quick actions + search (profile-like bar) */}
      <div className="rounded-2xl bg-white p-4 md:p-6 shadow-sm shadow-emerald-800 border-r-7 border-r-navbar-secondary">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="text-right">
            <div className="text-lg font-semibold text-cms-primary">
              عملیات سریع
            </div>
            <p className="text-sm text-gray-500 mt-1">
              ایجاد یا مدیریت محتوا با چند کلیک.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/cms/articles/new"
              className="px-4 py-2 rounded-xl bg-navbar-secondary text-white hover:bg-navbar-hover"
            >
              مقاله جدید
            </Link>
            <Link
              href="/admin/cms/news/new"
              className="px-4 py-2 rounded-xl border hover:bg-gray-50"
            >
              خبر جدید
            </Link>
            <input
              className="w-full md:w-72 rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-navbar-secondary text-right"
              placeholder="جستجوی ماژول‌ها…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>
      </div>

      {error && <Banner kind="error" text={error} />}

      {/* Modules grouped – cards styled like your profile sections */}
      {(["Content", "Clinic Data", "Site", "Operations"] as const).map((g) => {
        const items = visibleModules.filter((m) => m.group === g);
        if (!items.length) return null;
        return (
          <section
            key={g}
            className="rounded-2xl bg-white p-4 md:p-6 shadow-sm shadow-emerald-800 border-r-7 border-r-navbar-secondary"
          >
            <div className="text-lg font-semibold text-cms-primary mb-4">
              {groupsFa[g]}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {loading
                ? Array.from({ length: Math.min(6, items.length || 3) }).map(
                    (_, i) => <SkeletonCard key={i} />
                  )
                : items.map((m) => (
                    <ModuleCard
                      key={m.key}
                      title={m.title}
                      description={m.description}
                      Icon={m.icon}
                      manageHref={m.hrefManage}
                      newHref={m.hrefNew}
                      counts={moduleCounts[m.key]}
                    />
                  ))}
            </div>
          </section>
        );
      })}

      {/* Review + Activity – mirrors the profile "Documents" box vibe */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReviewQueue items={stats?.reviewQueue ?? []} loading={loading} />
        {stats?.canViewActivity ? (
          <RecentActivity
            items={stats?.recentActivity ?? []}
            loading={loading}
          />
        ) : null}
      </div>
    </div>
  );
}

/* ---------- Pieces ---------- */

function ModuleCard({
  title,
  description,
  Icon,
  manageHref,
  // newHref, // intentionally unused
  counts,
}: {
  title: string;
  description: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  manageHref: string;
  newHref?: string;
  counts?: StatCounts;
}) {
  const total =
    counts?.total ?? (counts?.published ?? 0) + (counts?.drafts ?? 0);
  return (
    <Link
      href={manageHref}
      className="group relative block rounded-2xl border border-gray-300 bg-gradient-to-r from-gray-50 via-white to-gray-50 p-5 shadow-md transition hover:shadow-md hover:border-cms-primary hover:shadow-cms-secondary focus:outline-none focus:ring-2 focus:ring-navbar-secondary"
    >
      {/* Total badge */}
      {typeof total === "number" ? (
        <span className="absolute top-4 left-4 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-700">
          مجموع: {total}
        </span>
      ) : null}

      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-gray-50 transition group-hover:bg-navbar-secondary/10">
          <Icon className="h-5 w-5 text-gray-700 transition group-hover:text-navbar-secondary" />
        </div>
        <div className="min-w-0 text-right">
          <div className="truncate font-semibold text-gray-900">{title}</div>
          <div className="mt-0.5 text-sm text-gray-600">{description}</div>
        </div>
      </div>

      {/* Counts row */}
      {(counts?.published !== undefined || counts?.drafts !== undefined) && (
        <div className="mt-4 flex items-center justify-end gap-2 text-sm">
          {counts?.published !== undefined && (
            <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-700">
              منتشرشده: {counts.published}
            </span>
          )}
          {counts?.drafts !== undefined && (
            <span className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-amber-700">
              پیش‌نویس: {counts.drafts}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
      <div className="animate-pulse space-y-3">
        <div className="h-5 w-40 bg-gray-100 rounded" />
        <div className="h-4 w-56 bg-gray-100 rounded" />
        <div className="flex gap-2 justify-end pt-2">
          <div className="h-6 w-20 bg-gray-100 rounded" />
          <div className="h-6 w-24 bg-gray-100 rounded" />
        </div>
      </div>
    </div>
  );
}

function ReviewQueue({
  items,
  loading,
}: {
  items: Array<{ id: string; title: string; type: string; updatedAt: string }>;
  loading: boolean;
}) {
  return (
    <div
      className="rounded-2xl bg-white p-5 shadow-sm shadow-emerald-800 border-r-7 border-r-navbar-secondary"
      dir="rtl"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">صف بررسی</h3>
        <span className="text-xs text-gray-500">{items.length} مورد</span>
      </div>
      <div className="mt-3 space-y-2">
        {loading ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-5 w-full bg-gray-100 rounded" />
            <div className="h-5 w-4/5 bg-gray-100 rounded" />
          </div>
        ) : items.length ? (
          items.map((it) => (
            <div
              key={it.id}
              className="text-sm flex items-center justify-between"
            >
              <div className="truncate text-right">
                <span className="font-medium text-gray-800">{it.title}</span>
                <span className="mr-2 text-gray-500">({it.type})</span>
              </div>
              <span className="text-xs text-gray-500">
                {new Date(it.updatedAt).toLocaleDateString("fa-IR")}
              </span>
            </div>
          ))
        ) : (
          <div className="text-sm text-gray-500">
            موردی برای بررسی وجود ندارد.
          </div>
        )}
      </div>
    </div>
  );
}

function RecentActivity({
  items,
  loading,
  max = 5,
}: {
  items: Array<{ id: string; action: string; createdAt: string }>;
  loading: boolean;
  max?: number;
}) {
  const shown = (items ?? []).slice(0, max);
  const hasMore = (items?.length ?? 0) > max;

  return (
    <div
      className="rounded-2xl bg-white p-5 shadow-sm shadow-emerald-800 border-r-7 border-r-navbar-secondary"
      dir="rtl"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">فعالیت‌های اخیر</h3>
        <span className="text-xs text-gray-500">{shown.length} مورد</span>
      </div>

      <div className="mt-3 space-y-2">
        {loading ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-5 w-full bg-gray-100 rounded" />
            <div className="h-5 w-4/5 bg-gray-100 rounded" />
          </div>
        ) : shown.length ? (
          shown.map((it) => (
            <div
              key={it.id}
              className="text-sm flex items-center justify-between"
            >
              <div className="truncate text-gray-700 text-right">
                {it.action}
              </div>
              <span className="text-xs text-gray-500">
                {new Date(it.createdAt).toLocaleString("fa-IR")}
              </span>
            </div>
          ))
        ) : (
          <div className="text-sm text-gray-500">تغییری ثبت نشده است.</div>
        )}
      </div>

      <div className="mt-4 flex justify-start">
        {hasMore && (
          <Link
            href="/admin/cms/recent-activities"
            className="text-sm text-navbar-secondary hover:underline"
          >
            مشاهده همه فعالیت‌ها →
          </Link>
        )}
      </div>
    </div>
  );
}

function Banner({ kind, text }: { kind: "error" | "success"; text: string }) {
  const cls =
    kind === "error"
      ? "bg-red-50 text-red-700 ring-1 ring-red-100"
      : "bg-green-50 text-green-700 ring-1 ring-green-100";
  return <div className={`${cls} p-3 rounded-xl`}>{text}</div>;
}
