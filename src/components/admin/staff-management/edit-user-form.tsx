"use client";

import { useEffect, useMemo, useState } from "react";
import { User as dbUser } from "@/config/types/auth/types"; // Adjust import path as needed

type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  isActive: boolean;
  imageUrl?: string | null; // NEW (optional)
};

export default function EditUserForm({ userId }: { userId: string }) {
  // ---- ui state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ---- form/original state
  const [form, setForm] = useState<User>({
    id: userId,
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    isActive: true,
    imageUrl: null,
  });
  const [original, setOriginal] = useState<User | null>(null);

  // password change (optional)
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  // ---- touched flags (for showing inline errors after interaction)
  const [touched, setTouched] = useState({
    firstName: false,
    lastName: false,
    email: false,
    password: false,
    password2: false,
    phone: false,
    address: false,
  });

  // ---- load current user
  useEffect(() => {
    let alive = true;
    (async () => {
      setError("");
      setSuccess("");
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/users/${userId}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("خطا در دریافت اطلاعات کاربر");
        const u: dbUser = await res.json();
        if (!alive) return;
        const firstName = u.name.slice(0, u.name.indexOf(" "));
        const lastName = u.name.slice(u.name.indexOf(" ") + 1);
        // normalize user data
        const normalized: User = {
          id: u.id,
          firstName: firstName ?? "",
          lastName: lastName ?? "",
          email: u.email ?? "",
          phone: u.phone ?? "",
          address: u.address ?? "",
          isActive: Boolean(u.isActive),
          imageUrl: u.image ?? null,
        };
        setForm(normalized);
        setOriginal(normalized);
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "بازیابی اطلاعات ناموفق بود");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [userId]);

  // ---- validation (only for provided fields)
  const emailError = (() => {
    const v = form.email.trim();
    if (!v) return null; // optional on update
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : "ایمیل معتبر نیست.";
  })();

  const passwordError = password
    ? password.length < 8
      ? "رمز عبور حداقل باید ۸ کاراکتر باشد."
      : null
    : null;

  const password2Error =
    password && password2 && password !== password2
      ? "رمز عبور و تکرار آن یکسان نیست."
      : null;

  const showEmailError = touched.email ? emailError : null;
  const showPasswordError = touched.password ? passwordError : null;
  const showPassword2Error = touched.password2 ? password2Error : null;

  const hasBlockingErrors = !!emailError || !!passwordError || !!password2Error;

  // compute changed fields (so we don't clear values if left empty)
  const changedPayload = useMemo(() => {
    if (!original) return {};
    const payload: Record<string, unknown> = {};
    const keys: (keyof User)[] = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "address",
      "isActive",
    ];
    for (const k of keys) {
      const newVal = form[k] ?? "";
      const oldVal = original[k] ?? "";
      if (newVal !== oldVal) {
        // normalize empty strings to null for optional fields
        if (k === "phone" || k === "address") {
          payload[k] =
            typeof newVal === "string" && newVal.trim() === "" ? null : newVal;
        } else {
          payload[k] = newVal;
        }
      }
    }
    if (password) payload.password = password;
    return payload;
  }, [form, original, password]);

  const nothingChanged = useMemo(
    () => Object.keys(changedPayload).length === 0,
    [changedPayload]
  );

  // ---- handlers
  const setField = <K extends keyof User>(key: K, val: User[K]) =>
    setForm((p) => ({ ...p, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // reveal errors if there are blocking ones
    if (hasBlockingErrors) {
      setTouched({
        firstName: true,
        lastName: true,
        email: true,
        password: true,
        password2: true,
        phone: true,
        address: true,
      });
      setError("لطفاً خطاهای فرم را برطرف کنید.");
      return;
    }

    // If nothing changed, just inform the admin (no request)
    if (nothingChanged) {
      setSuccess("تغییری برای ذخیره وجود ندارد.");
      return;
    }

    

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changedPayload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "به‌روزرسانی ناموفق بود");
      }
      setSuccess("اطلاعات کاربر با موفقیت به‌روزرسانی شد.");
      setPassword("");
      setPassword2("");
      // update original with new form (apply changes locally)
      setOriginal((prev) =>
        prev
          ? ({ ...prev, ...changedPayload, password: undefined } as User)
          : form
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطای غیرمنتظره رخ داد");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 rounded-2xl bg-white shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-40 bg-gray-200 rounded" />
          <div className="h-24 w-24 bg-gray-200 rounded-full mx-auto" />
          <div className="h-10 w-full bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  // initials for avatar fallback
  const initials = `${(form.firstName || "").charAt(0)}${(
    form.lastName || ""
  ).charAt(0)}`.toUpperCase();

  return (
    <div className="p-6 pb-12 bg-gradient-to-b from-white to-gray-50 rounded-2xl shadow-md ring-1 ring-gray-100 select-none">
      <h1 className="text-2xl md:text-3xl font-extrabold text-navbar-primary text-center mb-4">
        ویرایش کاربر
      </h1>

      {/* Avatar section (top, centered) */}
      <div className="flex flex-col items-center mb-6">
        {form.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={form.imageUrl}
            alt="Avatar"
            className="w-28 h-28 rounded-full object-cover border border-gray-200 shadow-sm"
          />
        ) : (
          <div className="w-28 h-28 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xl font-semibold text-gray-600">
            {initials || "?"}
          </div>
        )}
        <div className="mt-2 text-sm text-gray-500 select-text">
          {form.email || "بدون ایمیل"}
        </div>
      </div>

      {error && <Banner kind="error" text={error} />}
      {success && <Banner kind="success" text={success} />}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 md:p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label="نام"
              value={form.firstName}
              onChange={(v) => setField("firstName", v)}
              inputProps={{
                placeholder: "مثلاً علی",
                onBlur: () => setTouched((t) => ({ ...t, firstName: true })),
              }}
            />
            <Field
              label="نام خانوادگی"
              value={form.lastName}
              onChange={(v) => setField("lastName", v)}
              inputProps={{
                placeholder: "مثلاً رضایی",
                onBlur: () => setTouched((t) => ({ ...t, lastName: true })),
              }}
            />
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label="ایمیل"
              value={form.email}
              onChange={(v) => setField("email", v)}
              error={showEmailError ?? undefined}
              inputProps={{
                type: "email",
                inputMode: "email",
                dir: "ltr",
                lang: "en",
                placeholder: "username@example.com",
                autoComplete: "email",
                onBlur: () => setTouched((t) => ({ ...t, email: true })),
              }}
            />
            <Field
              label="تلفن"
              value={form.phone ?? ""}
              onChange={(v) => setField("phone", v)}
              inputProps={{
                type: "tel",
                inputMode: "tel",
                dir: "ltr",
                placeholder: "09xxxxxxxxx",
                onBlur: () => setTouched((t) => ({ ...t, phone: true })),
              }}
            />
          </div>

          <div className="mt-4">
            <Field
              label="آدرس"
              value={form.address ?? ""}
              onChange={(v) => setField("address", v)}
              inputProps={{
                placeholder: "کوچه، خیابان، شهر...",
                onBlur: () => setTouched((t) => ({ ...t, address: true })),
              }}
            />
          </div>

          {/* Active toggle */}
          <div className="mt-4 flex items-center gap-3">
            <input
              id="isActive"
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setField("isActive", e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="isActive" className="text-sm text-gray-800">
              کاربر فعال است
            </label>
          </div>
        </div>

        {/* Password change (optional) */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 md:p-6 shadow-sm">
          <div className="mb-2 font-medium text-gray-800">
            تغییر رمز عبور (اختیاری)
          </div>
          <p className="text-xs text-gray-500 mb-4">
            در صورت تکمیل این قسمت‌ها، رمز عبور تغییر می‌کند.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label="رمز عبور جدید"
              value={password}
              onChange={setPassword}
              error={showPasswordError ?? undefined}
              inputProps={{
                type: "password",
                autoComplete: "new-password",
                placeholder: "حداقل ۸ کاراکتر",
                onBlur: () => setTouched((t) => ({ ...t, password: true })),
              }}
            />
            <Field
              label="تکرار رمز عبور جدید"
              value={password2}
              onChange={setPassword2}
              error={showPassword2Error ?? undefined}
              inputProps={{
                type: "password",
                autoComplete: "new-password",
                placeholder: "تکرار رمز عبور",
                onBlur: () => setTouched((t) => ({ ...t, password2: true })),
              }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving || hasBlockingErrors}
            className="w-full md:w-auto px-6 h-11 rounded-xl bg-navbar-secondary text-white font-medium tracking-wide shadow-sm hover:bg-navbar-hover transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving
              ? "در حال ذخیره..."
              : nothingChanged
              ? "چیزی برای ذخیره نیست"
              : "ذخیره تغییرات"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ——— Small, local UI helpers ——— */

function Field({
  label,
  value,
  onChange,
  error,
  required,
  inputProps,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  required?: boolean;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}) {
  const isLtr = ["email", "password", "tel"].includes(inputProps?.type || "");
  return (
    <div className="group">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </label>
      <input
        className={`w-full rounded-xl border px-3 py-2 outline-none transition focus:ring-2 ${
          isLtr ? "ltr-input" : ""
        } ${
          error
            ? "border-red-500 focus:ring-red-300"
            : "border-gray-300 focus:ring-navbar-secondary"
        }`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...inputProps}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}

function Banner({ kind, text }: { kind: "error" | "success"; text: string }) {
  const cls =
    kind === "error"
      ? "bg-red-50 text-red-700 ring-1 ring-red-100"
      : "bg-green-50 text-green-700 ring-1 ring-green-100";
  return <div className={`${cls} p-3 rounded-xl mb-4 text-center`}>{text}</div>;
}
