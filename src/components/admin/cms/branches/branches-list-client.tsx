"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type CmsStatus = "DRAFT" | "PUBLISHED" | "SCHEDULED" | "ARCHIVED";
type Row = {
  branch: { id: string; name: string; key: string; city: string | null };
  cms: {
    id: string;
    status: CmsStatus;
    publishedAt: string | null;
    updatedAt: string;
    title: string | null;
  } | null;
};

const STATUS_LABELS: Record<CmsStatus, string> = {
  DRAFT: "پیش‌نویس",
  PUBLISHED: "منتشرشده",
  SCHEDULED: "زمان‌بندی‌شده",
  ARCHIVED: "بایگانی",
};

type UiStatusFilter = "ALL" | CmsStatus | "NO_CMS";

export default function BranchesListClient() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // creation state for per-row spinner/disable
  const [creatingFor, setCreatingFor] = useState<string | null>(null);

  // filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<UiStatusFilter>("ALL");

  async function fetchRows(signal?: AbortSignal) {
    setLoading(true);
    setErr(null);
    try {
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("pageSize", "100");
      if (q.trim()) params.set("q", q.trim());
      if (status !== "ALL" && status !== "NO_CMS") params.set("status", status);

      const res = await fetch(`/api/admin/cms/branches?${params.toString()}`, {
        cache: "no-store",
        signal,
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Failed to load");
      }
      const j = await res.json();
      setRows(j.items as Row[]);
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError")) {
        setErr(e instanceof Error ? e.message : "خطا در دریافت اطلاعات");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const ctrl = new AbortController();
    fetchRows(ctrl.signal);
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status]);

  const filtered = useMemo(() => {
    if (status === "NO_CMS") return rows.filter((r) => !r.cms);
    return rows;
  }, [rows, status]);

  const totalBranches = rows.length;
  const withContent = rows.filter((r) => !!r.cms).length;

  async function createContentForBranch(branchId: string) {
    setErr(null);
    setCreatingFor(branchId);
    try {
      const res = await fetch("/api/admin/cms/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId,
          status: "DRAFT", // default
          // you can set other defaults if you want
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(j?.error || "ایجاد محتوا ناموفق بود");
      }
      // jump straight to the editor
      if (j?.id) {
        router.push(`/admin/cms/branches/${j.id}`);
      } else {
        // fallback: refresh the list
        await fetchRows();
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "خطای نامشخص");
    } finally {
      setCreatingFor(null);
    }
  }

  return (
    <div
      dir="rtl"
      className="p-6 bg-white rounded-2xl shadow-sm ring-1 ring-gray-100"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-cms-primary">
          مدیریت محتوای شعبه‌ها
        </h2>
        <div className="text-xs text-gray-500">
          مجموع شعب: {totalBranches} • دارای محتوا: {withContent} • بدون محتوا:{" "}
          {totalBranches - withContent}
        </div>
      </div>

      {/* Controls */}
      <div className="mt-4 flex flex-col md:flex-row gap-3 md:items-center">
        <input
          className="w-full md:w-80 rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-navbar-secondary"
          placeholder="جستجو بر اساس نام/کلید/شهر…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as UiStatusFilter)}
          className="rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-navbar-secondary"
        >
          <option value="ALL">همه وضعیت‌ها</option>
          <option value="NO_CMS">بدون محتوا</option>
          <option value="DRAFT">پیش‌نویس</option>
          <option value="PUBLISHED">منتشرشده</option>
          <option value="SCHEDULED">زمان‌بندی‌شده</option>
          <option value="ARCHIVED">بایگانی</option>
        </select>
        <button
          className="px-4 h-10 rounded-xl border border-navbar-secondary text-navbar-secondary hover:bg-navbar-secondary hover:text-white transition md:ml-auto"
          onClick={() => fetchRows()}
          disabled={loading}
        >
          نوسازی
        </button>
      </div>

      {err && (
        <div className="mt-4 rounded-xl bg-red-50 text-red-700 p-3">{err}</div>
      )}

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-right text-gray-600">
              <th className="py-2 px-3">شعبه</th>
              <th className="py-2 px-3">کلید</th>
              <th className="py-2 px-3">عنوان محتوا</th>
              <th className="py-2 px-3">وضعیت</th>
              <th className="py-2 px-3">آخرین ویرایش</th>
              <th className="py-2 px-3 w-36">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="py-4 px-3 text-gray-400" colSpan={6}>
                  در حال بارگذاری…
                </td>
              </tr>
            ) : filtered.length ? (
              filtered.map((r) => (
                <tr key={r.branch.id} className="border-t">
                  <td className="py-2 px-3">
                    {[r.branch.name, r.branch.city].filter(Boolean).join(" — ")}
                  </td>
                  <td className="py-2 px-3 ltr-input">{r.branch.key}</td>
                  <td className="py-2 px-3">{r.cms?.title ?? "—"}</td>
                  <td className="py-2 px-3">
                    {r.cms ? STATUS_LABELS[r.cms.status] : "بدون محتوا"}
                  </td>
                  <td className="py-2 px-3">
                    {r.cms?.updatedAt
                      ? new Date(r.cms.updatedAt).toLocaleString("fa-IR")
                      : "—"}
                  </td>
                  <td className="py-2 px-3">
                    {r.cms?.id ? (
                      <Link
                        className="inline-flex items-center px-3 py-1.5 rounded-lg border hover:bg-gray-50"
                        href={`/admin/cms/branches/${r.cms.id}`}
                      >
                        ویرایش
                      </Link>
                    ) : (
                      <button
                        onClick={() => createContentForBranch(r.branch.id)}
                        disabled={creatingFor === r.branch.id}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg border border-navbar-secondary text-navbar-secondary hover:bg-navbar-secondary hover:text-white disabled:opacity-60"
                      >
                        {creatingFor === r.branch.id
                          ? "در حال ایجاد…"
                          : "ایجاد محتوا"}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="py-4 px-3 text-gray-500" colSpan={6}>
                  موردی یافت نشد.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
