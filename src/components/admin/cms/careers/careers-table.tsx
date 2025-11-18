"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Row = {
  id: string;
  title: string; // Job Title
  department: string | null;
  status: "DRAFT" | "OPEN" | "CLOSED"; // DRAFT, OPEN (Published), CLOSED (Archived)
  createdAt: string;
  updatedAt: string;
  author: { id: string; name: string | null } | null;
  _count: { applications: number }; // To show how many people applied
};

type Resp = { page: number; pageSize: number; total: number; items: Row[] };
const PAGE_SIZE = 10;

export default function CareersTable() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | Row["status"]>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Resp>({
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
    const sp = new URLSearchParams();
    if (q.trim()) sp.set("q", q.trim());
    if (status) sp.set("status", status);
    sp.set("page", String(page));
    sp.set("pageSize", String(PAGE_SIZE));
    try {
      const res = await fetch(`/api/admin/cms/careers?${sp.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("خطا در دریافت لیست آگهی‌ها");
      const j: Resp = await res.json();
      setData(j);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطای نامشخص");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1); /* eslint-disable-next-line */
  }, [status]);
  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") load(1);
  };

  async function setStatusFor(id: string, next: Row["status"]) {
    const res = await fetch(`/api/admin/cms/careers/${id}`, {
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
    if (!confirm("آیا از حذف این آگهی مطمئن هستید؟")) return;
    const res = await fetch(`/api/admin/cms/careers/${id}`, {
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
      <div className="mb-7 ">
        <h1 className="text-3xl font-extrabold text-navbar-primary">
          فرصت‌های شغلی
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          مدیریت آگهی‌های شغلی و فرم‌های درخواست.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <input
          className="w-64 rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-navbar-secondary text-right"
          placeholder="جستجو بر اساس عنوان/دپارتمان…"
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
          <option value="OPEN">آگهی‌شده</option>
          <option value="CLOSED">بسته‌شده</option>
        </select>
        <button
          onClick={() => load(1)}
          className="px-4 py-2 rounded-xl border hover:bg-gray-50"
        >
          جستجو
        </button>
        <Link
          href="/admin/cms/careers/new"
          className="px-4 py-2 rounded-xl bg-navbar-secondary text-white hover:bg-navbar-hover"
        >
          آگهی جدید
        </Link>
      </div>

      <div className="rounded-2xl border border-navbar-active overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-navbar-primary">
            <tr className="text-right text-white">
              <th className="p-3">عنوان شغل</th>
              <th className="p-3">دپارتمان</th>
              <th className="p-3">وضعیت</th>
              <th className="p-3">ارسال‌کننده</th>
              <th className="p-3">به‌روزرسانی</th>
              <th className="p-3">درخواست‌ها</th>
              <th className="p-3 w-40">اقدامات</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-4 text-center text-gray-500" colSpan={7}>
                  در حال بارگذاری…
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td className="p-4 text-center text-red-600" colSpan={7}>
                  {error}
                </td>
              </tr>
            ) : data.items.length === 0 ? (
              <tr>
                <td className="p-6 text-center text-gray-500" colSpan={7}>
                  موردی یافت نشد.
                </td>
              </tr>
            ) : (
              data.items.map((a) => (
                <tr key={a.id} className="border-t">
                  <td className="p-3">
                    <div className="font-semibold text-gray-900">{a.title}</div>
                  </td>
                  <td className="p-3">{a.department ?? "—"}</td>
                  <td className="p-3">
                    <StatusBadge status={a.status} />
                  </td>
                  <td className="p-3">{a.author?.name ?? "—"}</td>
                  <td className="p-3 text-xs font-semibold text-gray-600">
                    {new Date(a.updatedAt).toLocaleDateString("fa-IR")}
                  </td>
                  <td className="p-3 text-sm font-semibold text-gray-700">
                    {a._count.applications}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2 justify-end">
                      <Link
                        href={`/admin/cms/careers/${a.id}`}
                        className="px-2.5 py-1.5 rounded-lg border hover:bg-gray-50"
                      >
                        ویرایش
                      </Link>
                      {a.status === "OPEN" ? (
                        <button
                          onClick={() => setStatusFor(a.id, "CLOSED")}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600"
                        >
                          بستن
                        </button>
                      ) : (
                        <button
                          onClick={() => setStatusFor(a.id, "OPEN")}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          آگهی
                        </button>
                      )}
                      <button
                        onClick={() => onDelete(a.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700"
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

function StatusBadge({ status }: { status: "DRAFT" | "OPEN" | "CLOSED" }) {
  const map = {
    DRAFT:
      "bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-xs",
    OPEN:
      "bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-xs",
    CLOSED:
      "bg-gray-100 text-gray-700 border border-gray-200 px-2 py-0.5 rounded-full text-xs",
  } as const;
  const label = {
    DRAFT: "پیش‌نویس",
    OPEN: "آگهی‌شده",
    CLOSED: "بسته‌شده",
  }[status];
  return <span className={map[status]}>{label}</span>;
}