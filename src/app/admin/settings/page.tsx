// app/admin/settings/page.tsx
import Link from "next/link";

export default async function SettingsHome() {
  return (
    <div
      className="space-y-6 bg-white rounded-2xl p-6 pb-12 shadow-sm"
      dir="rtl"
    >
      <h1 className="text-2xl font-semibold text-cms-primary">تنظیمات</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/settings/organization"
          className="rounded-2xl bg-white p-5 hover:shadow-sm transition shadow-sm shadow-emerald-800 border-r-8 border-r-navbar-secondary"
        >
          <div className="text-lg font-semibold text-cms-primary">سازمان</div>
          <p className="text-sm text-gray-600 mt-1">
            مدیریت شعب و دپارتمان‌هایی که در بخش‌های مختلف سامانه استفاده
            می‌شوند.
          </p>
          <div className="mt-3 text-sm text-gray-500">
            شعب • دپارتمان‌ها • عناوین شغلی
          </div>
        </Link>

        {/* کارت‌های آینده: امنیت، ایمیل، بکاپ و ... */}
      </div>
    </div>
  );
}
