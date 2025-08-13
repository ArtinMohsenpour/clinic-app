"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";

// هم‌سو با branchSchema سمت سرور
const branchSchema = z.object({
  name: z.string().min(2),
  key: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/),
  city: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  timezone: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});
type BranchInput = z.infer<typeof branchSchema>;

type Branch = {
  id: string;
  name: string;
  key: string;
  city?: string | null;
  address?: string | null;
  timezone?: string | null;
  isActive: boolean;
  createdAt: string;
};

function keyFromName(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function BranchesPage() {
  const [rows, setRows] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // modal
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [form, setForm] = useState<BranchInput>({
    name: "",
    key: "",
    city: "",
    address: "",
    timezone: "Europe/Berlin",
    isActive: true,
  });

  // filters
  const [q, setQ] = useState("");
  const [onlyActive, setOnlyActive] = useState(true);

  const filtered = useMemo(
    () =>
      rows
        .filter((r) => (onlyActive ? r.isActive : true))
        .filter((r) => {
          const n = q.trim().toLowerCase();
          if (!n) return true;
          return (
            r.name.toLowerCase().includes(n) ||
            r.key.toLowerCase().includes(n) ||
            (r.city ?? "").toLowerCase().includes(n)
          );
        }),
    [rows, q, onlyActive]
  );

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/branches", { cache: "no-store" });
      if (!res.ok) throw new Error("خطا در بارگذاری شعب");
      setRows(await res.json());
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setError(e?.message ?? "خطا در بارگذاری");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm({
      name: "",
      key: "",
      city: "",
      address: "",
      timezone: "Europe/Berlin",
      isActive: true,
    });
    setOpen(true);
  }

  function openEdit(row: Branch) {
    setEditing(row);
    setForm({
      name: row.name,
      key: row.key,
      city: row.city ?? "",
      address: row.address ?? "",
      timezone: row.timezone ?? "Europe/Berlin",
      isActive: row.isActive,
    });
    setOpen(true);
  }

  async function save() {
    const parsed = branchSchema.safeParse(form);
    if (!parsed.success) {
      alert("لطفاً نام و کلید معتبر وارد کنید.");
      return;
    }
    const url = editing
      ? `/api/admin/branches/${editing.id}`
      : "/api/admin/branches";
    const method = editing ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j?.error ?? "ذخیره انجام نشد");
      return;
    }
    setOpen(false);
    await load();
  }

  async function toggleActive(row: Branch) {
    const res = await fetch(`/api/admin/branches/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !row.isActive }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j?.error ?? "به‌روزرسانی انجام نشد");
      return;
    }
    await load();
  }

  return (
    <div className="space-y-4" dir="rtl">
      {/* کارت بالای صفحه */}
      <div className="rounded-2xl bg-white p-5 shadow-sm shadow-emerald-800 border-r-8 border-r-navbar-secondary">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <div className="text-lg font-semibold text-cms-primary">
              مدیریت شعب
            </div>
            <p className="text-sm text-gray-600 mt-1">
              در این بخش می‌توانید شعب را اضافه، ویرایش یا فعال/غیرفعال کنید.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className="px-4 h-10 rounded-xl bg-navbar-secondary text-white hover:bg-navbar-hover transition"
              onClick={openCreate}
            >
              شعبه جدید
            </button>
            <button
              className="px-4 h-10 rounded-xl border border-navbar-secondary text-navbar-secondary hover:bg-navbar-secondary hover:text-white transition"
              onClick={load}
            >
              نوسازی
            </button>
          </div>
        </div>

        {/* فیلترها */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            className="w-full md:w-80 rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-navbar-secondary"
            placeholder="جستجو بر اساس نام، کلید یا شهر…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={onlyActive}
              onChange={(e) => setOnlyActive(e.target.checked)}
              className="h-4 w-4"
            />
            فقط فعال‌ها
          </label>
        </div>
      </div>

      {/* جدول */}
      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm shadow-emerald-800 ">
        {error ? (
          <div className="p-4 text-red-600">{error}</div>
        ) : loading ? (
          <div className="p-4">در حال بارگذاری…</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-right bg-cms-primary text-white">
                <th className="p-3">نام</th>
                <th className="p-3">کلید</th>
                <th className="p-3">شهر</th>
                <th className="p-3">منطقه زمانی</th>
                <th className="p-3">وضعیت</th>
                <th className="p-3 w-48">اقدامات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-3">{r.name}</td>
                  <td className="p-3 ltr-input">{r.key}</td>
                  <td className="p-3">{r.city ?? "—"}</td>
                  <td className="p-3 ltr-input">{r.timezone ?? "—"}</td>
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center rounded px-2 py-0.5 text-xs ${
                        r.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {r.isActive ? "فعال" : "غیرفعال"}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button
                        className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50"
                        onClick={() => openEdit(r)}
                      >
                        ویرایش
                      </button>
                      <button
                        className="px-3 py-1.5 rounded-lg border border-navbar-secondary text-navbar-secondary hover:bg-navbar-secondary hover:text-white transition"
                        onClick={() => toggleActive(r)}
                      >
                        {r.isActive ? "غیرفعال کن" : "فعال کن"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td className="p-4 text-gray-500" colSpan={6}>
                    موردی یافت نشد.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* مودال ساده */}
      {open && (
        <div className="rounded-2xl bg-white p-5 shadow-sm shadow-emerald-800 border-r-8 border-r-navbar-secondary">
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold text-cms-primary">
              {editing ? "ویرایش شعبه" : "شعبه جدید"}
            </div>
            <button className="text-gray-500" onClick={() => setOpen(false)}>
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Field
              label="نام شعبه"
              value={form.name}
              onChange={(v) => {
                const name = v;
                const next = { ...form, name };
                if (!editing) next.key = keyFromName(name);
                setForm(next);
              }}
              inputProps={{ placeholder: "مثلاً کلینیک مرکزی تهران" }}
            />
            <Field
              label="کلید (key)"
              value={form.key}
              onChange={(v) => setForm({ ...form, key: v })}
              inputProps={{
                placeholder: "tehran-main",
              }}
            />
            <Field
              label="شهر"
              value={form.city ?? ""}
              onChange={(v) => setForm({ ...form, city: v })}
              inputProps={{ placeholder: "تهران" }}
            />
            <Field
              label="منطقه زمانی"
              value={form.timezone ?? ""}
              onChange={(v) => setForm({ ...form, timezone: v })}
              inputProps={{
                placeholder: "َAsia/Tehran",
              }}
            />
            <label className="inline-flex items-center gap-2 mt-1">
              <input
                type="checkbox"
                checked={form.isActive ?? true}
                onChange={(e) =>
                  setForm({ ...form, isActive: e.target.checked })
                }
                className="h-4 w-4"
              />
              <span>فعال</span>
            </label>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              className="px-5 h-11 rounded-xl bg-navbar-secondary text-white font-medium hover:bg-navbar-hover transition"
              onClick={save}
            >
              ذخیره
            </button>
            <button
              className="px-5 h-11 rounded-xl border border-gray-300 hover:bg-gray-50"
              onClick={() => setOpen(false)}
            >
              انصراف
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ——— Field کامپوننت کوچک ——— */
function Field({
  label,
  value,
  onChange,
  error,
  inputProps,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}) {
  const isLtr =
    ["email", "password", "tel"].includes(inputProps?.type || "") ||
    inputProps?.dir === "ltr";
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1 pr-1">
        {label}
      </label>
      <input
        className={`w-full rounded-xl border px-3 py-2 outline-none transition focus:ring-2 ${
          isLtr ? "ltr-input" : ""
        } ${
          error
            ? "border-red-500 focus:ring-red-300"
            : "border-gray-300 focus:ring-navbar-secondary"
        } ${inputProps?.className ?? ""}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...inputProps}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
