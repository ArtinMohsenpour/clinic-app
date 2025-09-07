"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";

type Status = "DRAFT" | "PUBLISHED" | "ARCHIVED";

type ListItem = {
  id: string;
  title: string;
  slug: string;
  status: Status;
  updatedAt: string;
};

export default function PagesTable() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pages, setPages] = useState<ListItem[]>([]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/cms/static-pages`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("خطا در دریافت لیست صفحات");
      const data = await res.json();
      setPages(data.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطای نامشخص");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onDelete(id: string, title: string) {
    if (!confirm(`آیا از حذف صفحه "${title}" مطمئن هستید؟`)) return;
    const res = await fetch(`/api/admin/cms/static-pages/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      alert("حذف ناموفق بود");
      return;
    }
    load();
  }

  return (
    <div dir="rtl" className="p-6 bg-white rounded-2xl shadow-md space-y-5">
      <div className="flex justify-between items-center mb-7">
        <div>
          <h1 className="text-3xl font-extrabold text-navbar-primary">
            مدیریت صفحات ایستا
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            ایجاد و ویرایش صفحات درباره ما، تماس با ما و ...
          </p>
        </div>
        <Link
          href="/admin/cms/static-pages/new"
          className="px-4 py-2 rounded-xl bg-navbar-secondary text-white hover:bg-navbar-hover"
        >
          صفحه جدید
        </Link>
      </div>

      <div className="rounded-2xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-navbar-primary text-white text-right">
            <tr>
              <th className="p-3">عنوان صفحه</th>
              <th className="p-3">اسلاگ (URL)</th>
              <th className="p-3">وضعیت</th>
              <th className="p-3">آخرین ویرایش</th>
              <th className="p-3 w-32">اقدامات</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="p-4 text-center">
                  در حال بارگذاری...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-red-600">
                  {error}
                </td>
              </tr>
            ) : pages.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-500">
                  موردی یافت نشد.
                </td>
              </tr>
            ) : (
              pages.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="p-3 font-semibold">{item.title}</td>
                  <td className="p-3 font-mono ltr text-left">{item.slug}</td>
                  <td className="p-3">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="p-3 text-gray-600">
                    {new Date(item.updatedAt).toLocaleDateString("fa-IR")}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/cms/static-pages/${item.id}`}
                        className="px-3 py-1.5 rounded-lg border hover:bg-gray-100"
                      >
                        ویرایش
                      </Link>
                      <button
                        onClick={() => onDelete(item.id, item.title)}
                        className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const map: Record<Status, string> = {
    DRAFT: "bg-amber-50 text-amber-700",
    PUBLISHED: "bg-emerald-50 text-emerald-700",
    ARCHIVED: "bg-gray-100 text-gray-700",
  };
  const label: Record<Status, string> = {
    DRAFT: "پیش‌نویس",
    PUBLISHED: "منتشرشده",
    ARCHIVED: "بایگانی",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium border ${map[status]}`}
    >
      {label[status]}
    </span>
  );
}
