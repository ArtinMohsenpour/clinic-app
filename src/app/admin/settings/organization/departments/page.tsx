"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";

const departmentSchema = z.object({
  name: z.string().min(2),
  key: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/),
  isActive: z.boolean().optional(),
});
type DeptInput = z.infer<typeof departmentSchema>;

type Department = {
  id: string;
  name: string;
  key: string;
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

export default function DepartmentsPage() {
  const [rows, setRows] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form, setForm] = useState<DeptInput>({
    name: "",
    key: "",
    isActive: true,
  });

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
            r.name.toLowerCase().includes(n) || r.key.toLowerCase().includes(n)
          );
        }),
    [rows, q, onlyActive]
  );

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/departments", { cache: "no-store" });
      if (!res.ok) throw new Error("خطا در بارگذاری دپارتمان‌ها");
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
    setForm({ name: "", key: "", isActive: true });
    setOpen(true);
  }

  function openEdit(row: Department) {
    setEditing(row);
    setForm({ name: row.name, key: row.key, isActive: row.isActive });
    setOpen(true);
  }

  async function save() {
    const parsed = departmentSchema.safeParse(form);
    if (!parsed.success) {
      alert("لطفاً نام و کلید معتبر وارد کنید.");
      return;
    }
    const url = editing
      ? `/api/admin/departments/${editing.id}`
      : "/api/admin/departments";
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

  async function toggleActive(row: Department) {
    const res = await fetch(`/api/admin/departments/${row.id}`, {
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

  function StatusText({ active }: { active: boolean }) {
    return (
      <span className="flex items-center gap-1.5">
        <span
          className={`w-2.5 h-2.5 rounded-full ${
            active ? "bg-emerald-500" : "bg-rose-500"
          }`}
        ></span>
        <span className={active ? "text-emerald-600" : "text-rose-600"}>
          {active ? "فعال" : "غیرفعال"}
        </span>
      </span>
    );
  }

  return (
    <div className="space-y-4 select-none" dir="rtl">
      <div className="rounded-2xl bg-white p-5 shadow-sm shadow-emerald-800 border-r-8 border-r-navbar-secondary">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <div className="text-lg font-semibold text-cms-primary">
              مدیریت دپارتمان‌ها
            </div>
            <p className="text-sm text-gray-600 mt-1">
              دپارتمان‌ها را اضافه، ویرایش یا فعال/غیرفعال کنید.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className="px-4 h-10 rounded-xl bg-navbar-secondary text-white hover:bg-navbar-hover transition"
              onClick={openCreate}
            >
              دپارتمان جدید
            </button>
            <button
              className="px-4 h-10 rounded-xl border border-navbar-secondary text-navbar-secondary hover:bg-navbar-secondary hover:text-white transition"
              onClick={load}
            >
              نوسازی
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            className="w-full md:w-80 rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-navbar-secondary"
            placeholder="جستجو بر اساس نام یا کلید…"
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

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm shadow-emerald-800">
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
                <th className="p-3">وضعیت</th>
                <th className="p-3 w-48">اقدامات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-3">{r.name}</td>
                  <td className="p-3">{r.key}</td>
                  <td className="px-4 py-3">
                    <StatusText active={r.isActive} />
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
                  <td className="p-4 text-gray-500" colSpan={4}>
                    موردی یافت نشد.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {open && (
        <div className="rounded-2xl bg-white p-5 shadow-sm shadow-emerald-800 border-r-8 border-r-navbar-secondary">
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold text-cms-primary">
              {editing ? "ویرایش دپارتمان" : "دپارتمان جدید"}
            </div>
            <button className="text-gray-500" onClick={() => setOpen(false)}>
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Field
              label="نام دپارتمان"
              value={form.name}
              onChange={(v) => {
                const name = v;
                const next = { ...form, name };
                if (!editing) next.key = keyFromName(name);
                setForm(next);
              }}
              inputProps={{ placeholder: "مثلاً رادیولوژی" }}
            />
            <Field
              label="کلید (key)"
              value={form.key}
              onChange={(v) => setForm({ ...form, key: v })}
              inputProps={{
                placeholder: "radiology",
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
