"use client";

import { useEffect, useMemo, useState } from "react";
import { User as dbUser } from "@/config/types/auth/types";
import {
  validateEmail,
  validateNewPassword,
} from "@/lib/validators/validators";

type User = {
  id: string;
  fullName: string; // ← single field
  email: string;
  phone?: string | null;
  address?: string | null;
  isActive: boolean;
  imageUrl?: string | null;
};
type UpdatePayload = {
  name?: string | null;
  email?: string;
  phone?: string | null;
  address?: string | null;
  isActive?: boolean;
  password?: string;
};

export default function EditUserForm({ userId }: { userId: string }) {
  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // form/original state
  const [form, setForm] = useState<User>({
    id: userId,
    fullName: "",
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

  // touched flags
  const [touched, setTouched] = useState({
    fullName: false,
    email: false,
    password: false,
    password2: false,
    phone: false,
    address: false,
  });

  // load current user
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

        const normalized: User = {
          id: u.id,
          fullName: u.name ?? "",
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

  function resetPreview() {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(null);
  }

  function onPickAvatar(f: File | null) {
    if (!f) {
      setAvatarFile(null);
      resetPreview();
      return;
    }
    const ok = ["image/jpeg", "image/png", "image/webp"];
    if (!ok.includes(f.type)) {
      setError("فقط JPG/PNG/WEBP مجاز است.");
      return;
    }
    if (f.size > 2 * 1024 * 1024) {
      setError("حجم فایل نباید بیش از ۲ مگابایت باشد.");
      return;
    }
    setError("");
    setAvatarFile(f);
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(URL.createObjectURL(f));
  }

  async function uploadAvatarNow() {
    if (!avatarFile) return;
    setUploading(true);
    setError("");
    setSuccess("");
    try {
      const fd = new FormData();
      fd.append("file", avatarFile);
      const res = await fetch(`/api/admin/users/${userId}/avatar`, {
        method: "POST",
        body: fd,
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "آپلود تصویر ناموفق بود");
      setField("imageUrl", j.url);
      setSuccess("تصویر با موفقیت به‌روزرسانی شد.");
      setAvatarFile(null);
      resetPreview();
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا در آپلود تصویر");
    } finally {
      setUploading(false);
    }
  }

  // validation
  const emailCheck = validateEmail(form.email.trim());
  const passwordCheck = password
    ? validateNewPassword(password)
    : { isValid: true, error: null };
  const password2Check =
    password && password2 && password !== password2
      ? { isValid: false, error: "رمز عبور و تکرار آن یکسان نیست." }
      : { isValid: true, error: null };

  const showEmailError = touched.email ? emailCheck.error : null;
  const showPasswordError = touched.password ? passwordCheck.error : null;
  const showPassword2Error = touched.password2 ? password2Check.error : null;

  const hasBlockingErrors =
    !emailCheck.isValid || !passwordCheck.isValid || !password2Check.isValid;

  // changed payload
 const changedPayload = useMemo<UpdatePayload>(() => {
  if (!original) return {};
  const p: UpdatePayload = {};

  // name from fullName
  if (form.fullName !== original.fullName) {
    const n = form.fullName.trim();
    p.name = n.length ? n : null;
  }

  // email
  if (form.email !== original.email) {
    p.email = form.email.trim().toLowerCase();
  }

  // phone (optional)
  const newPhone = form.phone?.trim() || null;
  const oldPhone = original.phone ?? null;
  if (newPhone !== oldPhone) p.phone = newPhone;

  // address (optional)
  const newAddr = form.address?.trim() || null;
  const oldAddr = original.address ?? null;
  if (newAddr !== oldAddr) p.address = newAddr;

  // isActive
  if (form.isActive !== original.isActive) p.isActive = form.isActive;

  // password
  if (password) p.password = password;

  return p;
}, [form, original, password]);


  const nothingChanged = useMemo(
    () => Object.keys(changedPayload).length === 0,
    [changedPayload]
  );

  // handlers
  const setField = <K extends keyof User>(key: K, val: User[K]) =>
    setForm((p) => ({ ...p, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (hasBlockingErrors) {
      setTouched((t) => ({
        ...t,
        fullName: true,
        email: true,
        password: true,
        password2: true,
        phone: true,
        address: true,
      }));
      setError("لطفاً خطاهای فرم را برطرف کنید.");
      return;
    }

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

      // update original snapshot
      setOriginal((prev) => {
        const next = prev ? { ...prev } : form;
        if ("name" in changedPayload)
          next.fullName = (changedPayload.name as string) ?? "";
        if ("email" in changedPayload)
          next.email = changedPayload.email as string;
        if ("phone" in changedPayload)
          next.phone = (changedPayload.phone as string | null) ?? null;
        if ("address" in changedPayload)
          next.address = (changedPayload.address as string | null) ?? null;
        if ("isActive" in changedPayload)
          next.isActive = changedPayload.isActive as boolean;
        return next;
      });
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

  // initials from full name
  const parts = (form.fullName || "").trim().split(/\s+/).filter(Boolean);
  const initials = `${parts[0]?.[0] ?? ""}${
    parts[parts.length - 1]?.[0] ?? ""
  }`.toUpperCase();

  return (
    <div className="p-6 pb-12 bg-gradient-to-b from-white to-gray-50 rounded-2xl shadow-md ring-1 ring-gray-100 select-none">
      <h1 className="text-2xl md:text-3xl font-extrabold text-navbar-primary text-center mb-4">
        ویرایش کاربر
      </h1>

      {/* Avatar */}
      <div className="flex flex-col items-center mb-6">
        {avatarPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarPreview}
            alt="Avatar preview"
            className="w-28 h-28 rounded-full object-cover border border-gray-200 shadow-sm"
          />
        ) : form.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={form.imageUrl}
            alt="Avatar"
            className="w-28 h-28 rounded-full object-cover border border-gray-200 shadow-sm"
          />
        ) : (
          <div className="w-28 h-28 rounded-full bg-gray-100 border border-cms-secondary flex items-center justify-center text-xl font-semibold text-gray-600">
            {initials || "?"}
          </div>
        )}

        <div className="mt-3 flex items-center gap-2">
          <label className="px-3 py-1.5 rounded-lg border border-cms-secondary text-sm cursor-pointer hover:bg-cms-secondary hover:text-white hover:border-white transform duration-200">
            انتخاب تصویر جدید
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => onPickAvatar(e.target.files?.[0] || null)}
            />
          </label>
          {avatarFile && (
            <>
              <button
                type="button"
                onClick={uploadAvatarNow}
                disabled={uploading}
                className="px-3 py-1.5 rounded-lg bg-navbar-secondary text-white text-sm disabled:opacity-60"
              >
                {uploading ? "در حال آپلود..." : "آپلود"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAvatarFile(null);
                  resetPreview();
                }}
                className="px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50"
              >
                لغو
              </button>
            </>
          )}
        </div>

        <div className="mt-2 text-sm text-gray-500 select-text">
          {form.email || "بدون ایمیل"}
        </div>
      </div>

      {error && <Banner kind="error" text={error} />}
      {success && <Banner kind="success" text={success} />}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <div className="rounded-2xl bg-white p-6 m-1 mb-6 shadow-sm shadow-emerald-800 border-r-7 border-r-navbar-secondary">
          <div className="text-lg font-semibold text-cms-primary mb-4">
            اطلاعات کاربر
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label="نام و نام خانوادگی"
              value={form.fullName}
              onChange={(v) => setField("fullName", v)}
              inputProps={{
                placeholder: "مثلاً علی رضایی",
                onBlur: () => setTouched((t) => ({ ...t, fullName: true })),
              }}
            />
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
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <div className="rounded-2xl bg-white p-4 md:p-6 shadow-sm shadow-emerald-800 border-r-7 border-r-navbar-secondary">
          <div className="mb-4 text-lg text-cms-primary font-semibold">
            تغییر رمز عبور (اختیاری)
          </div>
          <p className="text-sm text-gray-500 mb-4">
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
      <label className="block text-sm font-medium text-gray-700 mb-1 pr-2">
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
