"use client";

import { useEffect, useMemo, useState } from "react";
import { Trash2, AlertTriangle } from "lucide-react";

type Row = {
  id: string;
  action: string;
  createdAt: string;
  targetId?: string | null;
  actor?: { id: string; name: string | null; email: string | null } | null;
  meta?: unknown;
};

type Resp = {
  page: number;
  pageSize: number;
  total: number;
  items: Row[];
};

const ACTIONS = [
  "CMS_ARTICLE_CREATE",
  "CMS_ARTICLE_UPDATE",
  "CMS_ARTICLE_DELETE",
  "CMS_NEWS_CREATE",
  "CMS_NEWS_UPDATE",
  "CMS_NEWS_DELETE",
] as const;

export default function ActivityTable() {
  const [q, setQ] = useState("");
  const [action, setAction] = useState<string>("");
  const [from, setFrom] = useState<string>(""); // yyyy-mm-dd
  const [to, setTo] = useState<string>(""); // yyyy-mm-dd
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Resp | null>(null);

  const [purging, setPurging] = useState(false);
  const [purgeDays, setPurgeDays] = useState(30);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const PURGE_PRESETS = [7, 30, 90, 365] as const;

  function labelForDays(d: number) {
    switch (d) {
      case 7:
        return "۱ هفته";
      case 30:
        return "۱ ماه";
      case 90:
        return "۳ ماه";
      case 365:
        return "۱ سال";
      default:
        return `${d} روز`;
    }
  }

  // Drawer state
  const [selected, setSelected] = useState<Row | null>(null);

  function buildUrl() {
    const sp = new URLSearchParams();
    sp.set("page", String(page));
    sp.set("pageSize", String(pageSize));
    if (q.trim()) sp.set("q", q.trim());
    if (action) sp.set("action", action);
    if (from) sp.set("from", from);
    if (to) sp.set("to", to);
    // NOTE: make sure this matches your API route!
    return `/api/admin/cms/recent-activities?${sp.toString()}`;
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(buildUrl(), { cache: "no-store" });
        if (!res.ok) throw new Error("خطا در دریافت فعالیت‌ها");
        const j: Resp = await res.json();
        if (alive) setData(j);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "خطای نامشخص");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, action, from, to, page]);

  const totalPages = useMemo(
    () => (data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1),
    [data]
  );

  async function runPurge() {
    setPurging(true);
    try {
      const res = await fetch("/api/admin/cms/recent-activities/purge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ olderThanDays: purgeDays }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "پاکسازی ناموفق بود");
      // refetch current page
      const res2 = await fetch(buildUrl(), { cache: "no-store" });
      const j2: Resp = await res2.json();
      setData(j2);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطای نامشخص");
    } finally {
      setPurging(false);
    }
  }

  return (
    <div
      dir="rtl"
      className="p-6 pb-12 bg-gradient-to-b from-white to-gray-50 rounded-2xl shadow-md ring-1 ring-gray-100 space-y-6 select-none"
    >
      <h1 className="text-2xl md:text-3xl font-extrabold text-navbar-primary">
        همه فعالیت‌ها
      </h1>

      <div className="rounded-2xl bg-white p-4 md:p-6 shadow-sm border-r-7 border-[1px] border-gray-200 border-r-navbar-secondary">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            className="rounded-xl border px-3 py-2 focus:ring-2 focus:ring-navbar-secondary"
            placeholder="جستجو در اقدام/کاربر/هدف…"
            value={q}
            onChange={(e) => {
              setPage(1);
              setQ(e.target.value);
            }}
          />
          <select
            className="rounded-xl text-sm border px-3 py-2 focus:ring-2 focus:ring-navbar-secondary bg-white"
            value={action}
            onChange={(e) => {
              setPage(1);
              setAction(e.target.value);
            }}
          >
            <option value="" className="text-md">
              همه اقدامات
            </option>
            {ACTIONS.map((a) => (
              <option key={a} value={a} className="text-sm">
                {a}
              </option>
            ))}
          </select>
          <input
            type="date"
            className="rounded-xl border px-3 py-2 focus:ring-2 focus:ring-navbar-secondary"
            value={from}
            onChange={(e) => {
              setPage(1);
              setFrom(e.target.value);
            }}
            placeholder="از تاریخ"
          />
          <input
            type="date"
            className="rounded-xl border px-3 py-2 focus:ring-2 focus:ring-navbar-secondary"
            value={to}
            onChange={(e) => {
              setPage(1);
              setTo(e.target.value);
            }}
            placeholder="تا تاریخ"
          />
        </div>

        {/* Purge controls */}
        <div className="mt-4 rounded-2xl border bg-white/60 p-3 md:p-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            {/* Title + hint */}
            <div className="text-right">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span className="font-medium text-gray-800">
                  پاکسازی لاگ‌ها
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                حذف رکوردهای قدیمی جهت سبک‌سازی دیتابیس (غیرقابل بازگشت)
              </div>
            </div>

            {/* Segmented presets */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-xl border bg-white overflow-hidden">
                {PURGE_PRESETS.map((d, i) => {
                  const active = purgeDays === d;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setPurgeDays(d)}
                      className={`px-3 py-1.5 text-sm transition border-l last:border-l-0 cursor-pointer
                ${
                  active
                    ? "bg-cms-secondary text-white font-medium"
                    : "hover:bg-gray-50"
                }
              `}
                      style={{ borderColor: "rgba(0,0,0,0.06)" }}
                      aria-pressed={active}
                    >
                      {labelForDays(d)}
                    </button>
                  );
                })}
              </div>

              {/* Danger action */}
              <button
                type="button"
                disabled={purging}
                onClick={() => setConfirmOpen(true)}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
              >
                {purging ? "در حال پاکسازی…" : "پاکسازی"}
              </button>
            </div>
          </div>

          {/* Confirm bar */}
          {confirmOpen && (
            <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2 text-rose-700">
                  <AlertTriangle className="w-5 h-5 mt-0.5" />
                  <div className="text-sm">
                    آیا از حذف <b>تمام</b> فعالیت‌های قدیمی‌تر از{" "}
                    <b>{labelForDays(purgeDays)}</b> مطمئن هستید؟ این عملیات
                    قابل بازگشت نیست.
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-lg border hover:bg-white"
                    onClick={() => setConfirmOpen(false)}
                  >
                    انصراف
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
                    onClick={async () => {
                      await runPurge();
                      setConfirmOpen(false);
                    }}
                    disabled={purging}
                  >
                    تایید حذف
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="mt-4 rounded-2xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cms-primary text-white">
              <tr className="text-right">
                <th className="p-3">تاریخ</th>
                <th className="p-3">اقدام</th>
                <th className="p-3">کاربر</th>
                <th className="p-3">شناسه هدف</th>
                <th className="p-3 w-24">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="p-4" colSpan={5}>
                    در حال بارگذاری…
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td className="p-4 text-rose-600" colSpan={5}>
                    {error}
                  </td>
                </tr>
              ) : (data?.items ?? []).length ? (
                data!.items.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-gray-50/50">
                    <td className="p-3 text-gray-600">
                      {new Date(r.createdAt).toLocaleDateString("fa-IR")}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs border ${badgeFor(
                          r.action
                        )}`}
                      >
                        {r.action}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="truncate block max-w-[220px]">
                        {r.actor?.name || r.actor?.email || "—"}
                      </span>
                    </td>
                    <td className="p-3">
                      {r.targetId ? (
                        <div className="flex items-center gap-2">
                          <span className="ltr-input text-gray-700">
                            {shortId(r.targetId)}
                          </span>
                          <button
                            type="button"
                            title="کپی"
                            className="px-2 py-0.5 rounded border text-xs hover:bg-gray-200 cursor-pointer"
                            onClick={() => copy(r.targetId!)}
                          >
                            کپی
                          </button>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-lg border hover:bg-gray-50"
                        onClick={() => setSelected(r)}
                      >
                        جزئیات
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="p-4 text-gray-500" colSpan={5}>
                    موردی یافت نشد.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            صفحه {data?.page ?? page} از {totalPages} — مجموع {data?.total ?? 0}
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1.5 rounded-lg border hover:bg-gray-50 disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              قبلی
            </button>
            <button
              className="px-3 py-1.5 rounded-lg border hover:bg-gray-50 disabled:opacity-50"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages}
            >
              بعدی
            </button>
          </div>
        </div>
      </div>

      {/* Right-side Drawer for details */}
      <Drawer row={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

/* ---------- helpers ---------- */

function shortId(id: string, head = 8, tail = 4) {
  if (id.length <= head + tail) return id;
  return `${id.slice(0, head)}…${id.slice(-tail)}`;
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // ignore
  }
}

function badgeFor(action: string) {
  switch (action) {
    case "CMS_ARTICLE_CREATE":
    case "CMS_NEWS_CREATE":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "CMS_ARTICLE_UPDATE":
    case "CMS_NEWS_UPDATE":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    case "CMS_ARTICLE_DELETE":
    case "CMS_NEWS_DELETE":
      return "bg-rose-50 text-rose-700 border-rose-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
}


/* ---------- Drawer ---------- */

function Drawer({ row, onClose }: { row: Row | null; onClose: () => void }) {
  const open = Boolean(row);
  if (!open) return null;

  const dt = row!.createdAt ? new Date(row!.createdAt) : null;

  return (
    <div className="fixed inset-0 z-50">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        aria-hidden
      />
      {/* panel */}
      <div
        className="absolute right-0 top-0 h-full w-[min(560px,90vw)] bg-white shadow-2xl border-l rounded-l-2xl flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        <div className="p-4 border-b flex items-center justify-between">
          <div className="font-semibold">جزئیات فعالیت</div>
          <button
            type="button"
            className="px-3 py-1.5 rounded-lg border hover:bg-gray-50"
            onClick={onClose}
          >
            بستن
          </button>
        </div>

        <div className="p-4 space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <Info label="اقدام" value={row!.action} />
            <Info
              label="تاریخ"
              value={dt ? dt.toLocaleDateString("fa-IR") : "—"}
            />
            <Info
              label="زمان"
              value={dt ? dt.toLocaleTimeString("fa-IR") : "—"}
            />
            <Info
              label="کاربر"
              value={row!.actor?.name || row!.actor?.email || "—"}
            />
            <Info
              label="شناسه هدف"
              value={
                row!.targetId ? (
                  <span className="ltr-input">{row!.targetId}</span>
                ) : (
                  "—"
                )
              }
            />
          </div>

          <div className="pt-2">
            <div className="text-gray-700 font-medium mb-1">Payload</div>
            <pre className="bg-gray-50 border rounded-xl p-3 max-h-[45vh] overflow-auto text-[12px] leading-5">
              {JSON.stringify(row!.meta ?? {}, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-gray-500 mb-0.5">{label}</div>
      <div className="text-gray-800">{value}</div>
    </div>
  );
}
