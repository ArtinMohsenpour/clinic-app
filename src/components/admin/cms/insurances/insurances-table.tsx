"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Status = "DRAFT" | "PUBLISHED" | "SCHEDULED" | "ARCHIVED";

type ListItem = {
  id: string;
  name: string;
  slug: string;
  status: Status;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: { id: string; name: string | null } | null;
  cover: { id: string; publicUrl: string | null; alt: string | null } | null;
};

type ListResponse = {
  page: number;
  pageSize: number;
  total: number;
  items: ListItem[];
};

const PAGE_SIZE = 10;

export default function InsuranceTable() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | Status>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ListResponse>({
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
    items: [],
  });

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(data.total / data.pageSize)),
    [data.total, data.pageSize]
  );

  async function load(page = 1) {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (status) params.set("status", status);
    params.set("page", String(page));
    params.set("pageSize", String(PAGE_SIZE));
    try {
      const res = await fetch(`/api/admin/cms/insurance?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("خطا در دریافت لیست بیمه‌ها");
      const j: ListResponse = await res.json();
      setData(j);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطای نامشخص");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  function onSearchKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") load(1);
  }

  async function setStatusFor(id: string, next: Status) {
    const res = await fetch(`/api/admin/cms/insurance/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j?.error || "به‌روزرسانی وضعیت ناموفق بود");
      return;
    }
    load(data.page);
  }

  async function onDelete(id: string) {
    if (!confirm("آیا از حذف این شرکت بیمه مطمئن هستید؟")) return;
    const res = await fetch(`/api/admin/cms/insurance/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j?.error || "حذف ناموفق بود");
      return;
    }
    const nextPage =
      data.items.length === 1 && data.page > 1 ? data.page - 1 : data.page;
    load(nextPage);
  }

  return (
    <div
      dir="rtl"
      className="p-6 pb-12 bg-gradient-to-b from-white to-gray-50 rounded-2xl shadow-md ring-1 ring-gray-100 space-y-5 select-none"
    >
      <div className="mb-7">
        <h1 className="text-3xl font-extrabold text-navbar-primary">
          شرکای بیمه
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          مدیریت، جستجو و به‌روزرسانی شرکت‌های بیمه طرف قرارداد.
        </p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-2">
          <input
            className="w-64 rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-navbar-secondary text-right"
            placeholder="جستجو بر اساس نام/اسلاگ…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onSearchKey}
          />
          <select
            className="rounded-xl border px-3 py-2 focus:ring-2 focus:ring-navbar-secondary bg-white"
            value={status}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onChange={(e) => setStatus(e.target.value as any)}
          >
            <option value="">همه وضعیت‌ها</option>
            <option value="DRAFT">پیش‌نویس</option>
            <option value="PUBLISHED">منتشرشده</option>
            <option value="SCHEDULED">زمان‌بندی‌شده</option>
            <option value="ARCHIVED">بایگانی</option>
          </select>

          <button
            onClick={() => load(1)}
            className="px-4 py-2 rounded-xl border hover:bg-gray-50"
          >
            جستجو
          </button>
          <Link
            href="/admin/cms/insurances/new"
            className="px-4 py-2 rounded-xl bg-navbar-secondary text-white hover:bg-navbar-hover"
          >
            بیمه جدید
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-navbar-active overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-navbar-primary">
            <tr className="text-right text-white">
              <th className="p-3 w-20">لوگو</th>
              <th className="p-3">نام / slug</th>
              <th className="p-3">وضعیت</th>
              <th className="p-3">به‌روزرسانی</th>
              <th className="p-3">انتشار</th>
              <th className="p-3 w-40">اقدامات</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-4 text-center text-gray-500" colSpan={6}>
                  در حال بارگذاری…
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td className="p-4 text-center text-red-600" colSpan={6}>
                  {error}
                </td>
              </tr>
            ) : data.items.length === 0 ? (
              <tr>
                <td className="p-6 text-center text-gray-500" colSpan={6}>
                  موردی یافت نشد.
                </td>
              </tr>
            ) : (
              data.items.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="p-2 align-middle">
                    {item.cover?.publicUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.cover.publicUrl}
                        alt={item.cover.alt ?? item.name}
                        className="w-14 h-14 object-contain rounded-lg border p-1"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-gray-100 border flex items-center justify-center text-xs text-gray-500">
                        بدون لوگو
                      </div>
                    )}
                  </td>

                  <td className="p-3 align-middle justify-items-start">
                    <div className="font-semibold text-gray-900">
                      {item.name}
                    </div>
                    <div className="text-xs text-gray-500 ltr-input">
                      /{item.slug}
                    </div>
                  </td>

                  <td className="p-3 align-middle">
                    <StatusBadge status={item.status} />
                  </td>

                  <td className="p-3 text-xs font-semibold align-middle text-gray-600">
                    {new Date(item.updatedAt).toLocaleDateString("fa-IR")}
                  </td>

                  <td className="p-3 text-xs font-semibold align-middle text-gray-600">
                    {item.publishedAt
                      ? new Date(item.publishedAt).toLocaleDateString("fa-IR")
                      : "—"}
                  </td>

                  <td className="p-3 align-middle">
                    <div className="flex items-center gap-2 justify-end">
                      <Link
                        href={`/admin/cms/insurances/${item.id}`}
                        className="px-2.5 py-1.5 rounded-lg border hover:bg-gray-100 cursor-pointer"
                      >
                        ویرایش
                      </Link>

                      {item.status !== "PUBLISHED" ? (
                        <button
                          onClick={() => setStatusFor(item.id, "PUBLISHED")}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                        >
                          انتشار
                        </button>
                      ) : (
                        <button
                          onClick={() => setStatusFor(item.id, "DRAFT")}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 cursor-pointer"
                        >
                          پیش‌نویس
                        </button>
                      )}

                      <button
                        onClick={() => onDelete(item.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 cursor-pointer"
                      >
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm">
        <div className="text-gray-600">
          صفحه {data.page} از {totalPages} — مجموع {data.total} مورد
        </div>
        <div className="flex gap-2">
          <button
            className="px-3 py-1.5 rounded-lg border disabled:opacity-50"
            onClick={() => load(data.page - 1)}
            disabled={data.page <= 1 || loading}
          >
            قبلی
          </button>
          <button
            className="px-3 py-1.5 rounded-lg border disabled:opacity-50"
            onClick={() => load(data.page + 1)}
            disabled={data.page >= totalPages || loading}
          >
            بعدی
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const map = {
    DRAFT:
      "bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-xs",
    PUBLISHED:
      "bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-xs",
    SCHEDULED:
      "bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full text-xs",
    ARCHIVED:
      "bg-gray-100 text-gray-700 border border-gray-200 px-2 py-0.5 rounded-full text-xs",
  } as const;
  const label = {
    DRAFT: "پیش‌نویس",
    PUBLISHED: "منتشرشده",
    SCHEDULED: "زمان‌بندی‌شده",
    ARCHIVED: "بایگانی",
  }[status];
  return <span className={map[status]}>{label}</span>;
}
