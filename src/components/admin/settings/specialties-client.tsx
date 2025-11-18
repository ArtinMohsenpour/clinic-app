"use client";

import { useMemo, useState } from "react";
import { z } from "zod";

const specialtySchema = z.object({
  name: z.string().min(2, "نام تخصص حداقل باید ۲ کاراکتر باشد."),
  key: z
    .string()
    .min(2, "کلید تخصص حداقل باید ۲ کاراکتر باشد.")
    .regex(
      /^[a-z0-9-]+$/,
      "کلید فقط می‌تواند شامل حروف کوچک انگلیسی، اعداد و خط تیره باشد."
    ),
});
type SpecialtyInput = z.infer<typeof specialtySchema>;

type Specialty = {
  id: string;
  name: string;
  key: string;
  createdAt: string | Date;
};

function keyFromName(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function SpecialtiesClient({
  initialData,
}: {
  initialData: Specialty[];
}) {
  const [rows, setRows] = useState<Specialty[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // modal state
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Specialty | null>(null);
  const [form, setForm] = useState<SpecialtyInput>({
    name: "",
    key: "",
  });

  // filters
  const [q, setQ] = useState("");

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const n = q.trim().toLowerCase();
        if (!n) return true;
        return (
          r.name.toLowerCase().includes(n) || r.key.toLowerCase().includes(n)
        );
      }),
    [rows, q]
  );

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/specialties", {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("خطا در بارگذاری تخصص‌ها");
      setRows(await res.json());
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setError(e?.message ?? "خطا در بارگذاری");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm({ name: "", key: "" });
    setOpen(true);
  }

  function openEdit(row: Specialty) {
    setEditing(row);
    setForm({ name: row.name, key: row.key });
    setOpen(true);
  }

  async function save() {
    const parsed = specialtySchema.safeParse(form);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message;
      alert(firstError || "لطفاً فرم را به درستی تکمیل کنید.");
      return;
    }

    const url = editing
      ? `/api/admin/specialties/${editing.id}`
      : "/api/admin/specialties";
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
    await refresh();
  }

  async function onDelete(id: string) {
    if (!confirm("آیا از حذف این تخصص مطمئن هستید؟")) return;

    const res = await fetch(`/api/admin/specialties/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j?.error ?? "حذف انجام نشد");
      return;
    }

    await refresh();
  }

  return (
    <div className="space-y-4" dir="rtl">
      <div className="rounded-2xl bg-white p-5 shadow-sm shadow-emerald-800 border-r-8 border-r-navbar-secondary">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <div className="text-lg font-semibold text-cms-primary">
              مدیریت تخصص‌ها
            </div>
            <p className="text-sm text-gray-600 mt-1">
              ایجاد و ویرایش تخصص‌های پزشکی.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className="px-4 h-10 rounded-xl bg-navbar-secondary text-white hover:bg-navbar-hover transition"
              onClick={openCreate}
            >
              تخصص جدید
            </button>
            <button
              className="px-4 h-10 rounded-xl border border-navbar-secondary text-navbar-secondary hover:bg-navbar-secondary hover:text-white transition"
              onClick={refresh}
            >
              نوسازی
            </button>
          </div>
        </div>
        <div className="mt-4">
          <input
            className="w-full md:w-80 rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-navbar-secondary"
            placeholder="جستجو بر اساس نام یا کلید..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm shadow-emerald-800">
        {error ? (
          <div className="p-4 text-rose-600">{error}</div>
        ) : loading ? (
          <div className="p-4">در حال بارگذاری...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-right bg-cms-primary text-white">
                <th className="p-3">نام تخصص</th>
                <th className="p-3">کلید (Key)</th>
                <th className="p-3 w-48">اقدامات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-3">{r.name}</td>
                  <td className="p-3 font-mono">{r.key}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button
                        className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50"
                        onClick={() => openEdit(r)}
                      >
                        ویرایش
                      </button>
                      <button
                        className="px-3 py-1.5 rounded-lg border border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white transition"
                        onClick={() => onDelete(r.id)}
                      >
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td className="p-4 text-center text-gray-500" colSpan={3}>
                    موردی یافت نشد.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={() => setOpen(false)}
        ></div>
      )}
      {open && (
        <div
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl p-6 shadow-2xl z-50 w-[min(500px,90vw)]"
          dir="rtl"
        >
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold text-cms-primary">
              {editing ? "ویرایش تخصص" : "تخصص جدید"}
            </div>
            <button
              className="text-gray-500 hover:text-gray-800"
              onClick={() => setOpen(false)}
            >
              ✕
            </button>
          </div>
          <div className="space-y-4 mt-4">
            <Field
              label="نام تخصص"
              value={form.name}
              onChange={(v) => {
                const next = { ...form, name: v };
                if (!editing) next.key = keyFromName(v);
                setForm(next);
              }}
              inputProps={{ placeholder: "مثلاً: قلب و عروق" }}
            />
            <Field
              label="کلید (Key)"
              value={form.key}
              onChange={(v) => setForm({ ...form, key: v })}
              inputProps={{
                placeholder: "cardiology",
                dir: "ltr",
                className: "font-mono",
              }}
            />
          </div>
          <div className="flex gap-2 pt-6">
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
  inputProps,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1 pr-1">
        {label}
      </label>
      <input
        className={`w-full rounded-xl border px-3 py-2 outline-none transition focus:ring-2 border-gray-300 focus:ring-navbar-secondary ${
          inputProps?.className ?? ""
        }`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...inputProps}
      />
    </div>
  );
}
