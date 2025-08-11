"use client";

import { useState, useEffect, useMemo } from "react";
// import { authClient } from "@/lib/auth-client";
import { validateEmail, validateNewPassword } from "@/lib/validators";

import Image from "next/image";

type RoleOption = { id: string; name: string; key?: string };

export default function SignupForm({
  roles: rolesProp,
}: {
  roles?: RoleOption[];
}) {
  // ---- form state
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    roles: [] as string[], // <- NEW: selected role IDs
    imageFile: null as File | null, // <- optional avatar (local preview only)
  });

  // ---- ui state
  const [allRoles, setAllRoles] = useState<RoleOption[]>(rolesProp ?? []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [preview, setPreview] = useState<string | null>(null);

  // ---- validation
  const emailError = validateEmail(form.email).error ?? null;
  const passwordError = validateNewPassword(form.password).error ?? null;
  const nameError =
    !form.firstName.trim() || !form.lastName.trim()
      ? "نام و نام خانوادگی الزامی است."
      : null;
  const rolesError =
    form.roles.length === 0 ? "حداقل یک نقش را انتخاب کنید." : null;

  const submitDisabled = useMemo(
    () =>
      isLoading ||
      !!emailError ||
      !!passwordError ||
      !!nameError ||
      !!rolesError,
    [isLoading, emailError, passwordError, nameError, rolesError]
  );

  // ---- load roles if not passed as prop
  useEffect(() => {
    if (rolesProp?.length) return;
    (async () => {
      try {
        const res = await fetch("/api/roles", { cache: "no-store" });
        if (!res.ok) throw new Error("failed");
        const data: RoleOption[] = await res.json();
        setAllRoles(data);
      } catch {
        // fallback to empty; UI will show no roles
        setAllRoles([]);
      }
    })();
  }, [rolesProp]);

  // ---- helpers
  const handleChange = (
    field: keyof typeof form,
    value: string | File | null
  ) => {
    setForm((p) => ({ ...p, [field]: value }));
  };

  const toggleRole = (roleId: string) => {
    setForm((p) => ({
      ...p,
      roles: p.roles.includes(roleId)
        ? p.roles.filter((r) => r !== roleId)
        : [...p.roles, roleId],
    }));
  };

  // ---- submit
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (submitDisabled) {
      setError("لطفاً خطاهای فرم را برطرف کنید.");
      return;
    }

    setIsLoading(true);
    try {
      // const email = form.email.trim().toLowerCase();
      // const name = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();

      // Step 1: create credentials (BetterAuth makes Account with providerId="email")
      // const { error } = await authClient.signUp.email({
      //   email,
      //   password: form.password,
      //   name,
      //   callbackURL: "/admin",
      // });

      // if (error) {
      //   setError(error.message || "ثبت‌نام ناموفق بود.");
      //   return;
      // }

      // (Optional) image handling: for now just preview locally.
      // You can later upload to S3 or your VPS and send back the URL here.

      // Step 2: complete profile + assign roles (server links roles)
      const res = await fetch("/api/admin/users/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          phone: form.phone || null,
          address: form.address || null,
          roles: form.roles, // array of Role.id (UUID)
        }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "خطا در ذخیره اطلاعات پروفایل");
      }

      setSuccess("کاربر با موفقیت ایجاد شد.");
      // optional: reset
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        phone: "",
        address: "",
        roles: [],
        imageFile: null,
      });
      if (preview) URL.revokeObjectURL(preview);
      setPreview(null);

      // you already have callbackURL, this is a safety
      // router.replace("/admin");
      // router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "یک خطای غیرمنتظره رخ داد");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-start justify-center pt-16 mb-20">
      <div className="bg-white shadow-lg rounded-lg w-full max-w-2xl p-8">
        <h1 className="text-3xl font-bold text-center mb-6 text-navbar-primary">
          ایجاد کاربر جدید
        </h1>

        {error && <Banner kind="error" text={error} />}
        {success && <Banner kind="success" text={success} />}

        <form onSubmit={handleSignUp} className="space-y-5">
          {/* name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label="نام"
              value={form.firstName}
              onChange={(v) => handleChange("firstName", v)}
              required
            />
            <Field
              label="نام خانوادگی"
              value={form.lastName}
              onChange={(v) => handleChange("lastName", v)}
              required
            />
          </div>
          {nameError && <Hint text={nameError} />}

          {/* contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ltr-input">
            <Field
              label="ایمیل"
              value={form.email}
              onChange={(v) => handleChange("email", v)}
              error={emailError ?? undefined}
              required
              inputProps={{
                type: "email",
                inputMode: "email",
                dir: "ltr",
                lang: "en",
              }}
            />
            <Field
              label="رمز عبور"
              value={form.password}
              onChange={(v) => handleChange("password", v)}
              error={passwordError ?? undefined}
              required
              inputProps={{ type: "password", autoComplete: "new-password" }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label="تلفن (اختیاری)"
              value={form.phone}
              onChange={(v) => handleChange("phone", v)}
            />
            <Field
              label="آدرس (اختیاری)"
              value={form.address}
              onChange={(v) => handleChange("address", v)}
            />
          </div>

          {/* roles */}

          <div>
            <div className="mb-2 font-medium">نقش‌ها</div>
            {allRoles.length === 0 ? (
              <p className="text-sm text-gray-500">
                نقشی برای انتخاب وجود ندارد.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {allRoles.map((r, i) => {
                  const checked = form.roles.includes(r.id);
                  return (
                    <label
                      key={r.id}
                      className="flex items-center justify-between gap-2 border rounded-lg px-3 py-2 hover:bg-gray-50"
                    >
                      <span className="text-gray-800">
                        {i + 1}. {r.name}
                      </span>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleRole(r.id)}
                      />
                    </label>
                  );
                })}
              </div>
            )}
            {rolesError && <Hint text={rolesError} />}
          </div>

          {/* avatar (local preview only) */}
          <FilePicker
            file={form.imageFile}
            preview={preview}
            onPick={(f) => {
              if (preview) URL.revokeObjectURL(preview);
              setForm((p) => ({ ...p, imageFile: f }));
              setPreview(f ? URL.createObjectURL(f) : null);
            }}
            onClear={() => {
              if (preview) URL.revokeObjectURL(preview);
              setForm((p) => ({ ...p, imageFile: null }));
              setPreview(null);
            }}
          />

          <button
            type="submit"
            disabled={submitDisabled}
            className="w-full bg-navbar-secondary text-white py-2 rounded hover:bg-navbar-hover transition disabled:opacity-60"
          >
            {isLoading ? "در حال ایجاد..." : "ایجاد کاربر"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ---- small UI helpers ---- */

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
  return (
    <div>
      <label className="block text-md font-medium text-gray-700 mb-1">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </label>
      <input
        className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 ${
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
      ? "bg-red-100 text-red-700"
      : "bg-green-100 text-green-700";
  return <div className={`${cls} p-3 rounded mb-4 text-center`}>{text}</div>;
}

function Hint({ text }: { text: string }) {
  return <p className="text-red-500 text-sm mt-1">{text}</p>;
}

function FilePicker({
  label = "تصویر کاربر (اختیاری)",
  onPick,
  file,
  preview,
  onClear,
}: {
  label?: string;
  onPick: (f: File | null) => void;
  file: File | null;
  preview: string | null;
  onClear: () => void;
}) {
  const [hover, setHover] = useState(false);

  return (
    <div>
      <div className="block text-md font-medium text-gray-700 mb-2">
        {label}
      </div>

      <div
        className={[
          "flex items-center justify-between gap-3 border rounded-xl px-3 py-2.5",
          "bg-white hover:bg-gray-50 transition",
          hover ? "ring-2 ring-navbar-secondary/40" : "border-gray-300",
        ].join(" ")}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <div className="flex items-center gap-3 min-w-0">
          {preview ? (
            <Image
              src={preview}
              alt="Preview"
              className="w-10 h-10 object-cover rounded-lg border"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg border border-dashed flex items-center justify-center text-xs text-gray-400">
              img
            </div>
          )}
          <div className="truncate">
            <div className="text-sm text-gray-800 truncate">
              {file ? file.name : "هیچ فایلی انتخاب نشده"}
            </div>
            <div className="text-xs text-gray-500">JPG/PNG تا 2MB</div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {file && (
            <button
              type="button"
              onClick={onClear}
              className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-100"
            >
              حذف
            </button>
          )}

          {/* Wrap input inside label — no htmlFor/id required */}
          <label className="cursor-pointer text-sm px-3 py-1.5 rounded-lg bg-navbar-secondary text-white hover:bg-navbar-hover">
            انتخاب فایل
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onPick(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
      </div>
    </div>
  );
}

