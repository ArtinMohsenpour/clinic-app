"use client";

import { useState, useEffect, useMemo } from "react";
// import { authClient } from "@/lib/auth-client";
import { validateEmail, validateNewPassword } from "@/lib/validators";

type RoleOption = { id: string; name: string; key?: string };

export default function SignupForm({
  roles: rolesProp,
}: {
  roles?: RoleOption[];
}) {
  // ---- form state
  const [form, setForm] = useState({
    fullname: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    roles: [] as string[], // <- NEW: selected role IDs
    imageFile: null as File | null, // <- optional avatar (local preview only)
  });
  const [confirmPassword, setConfirmPassword] = useState("");

  // ---- ui state
  const [allRoles, setAllRoles] = useState<RoleOption[]>(rolesProp ?? []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [touched, setTouched] = useState({
    fullname: false,
    email: false,
    password: false,
    confirmPassword: false,
    roles: false,
  });

  // ---- validation
  const emailError = validateEmail(form.email).error ?? null;
  const passwordError = validateNewPassword(form.password).error ?? null;
  const confirmPasswordError =
    form.password && confirmPassword && confirmPassword !== form.password
      ? "رمز عبور و تکرار آن یکسان نیست."
      : null;
  const nameError =
    !form.fullname.trim() || !form.fullname.trim()
      ? "نام و نام خانوادگی الزامی است."
      : null;
  const rolesError =
    form.roles.length === 0 ? "حداقل یک نقش را انتخاب کنید." : null;

  // only show if touched
  const showNameError = touched.fullname ? nameError : null;
  const showEmailError = touched.email ? emailError : null;
  const showPasswordError = touched.password ? passwordError : null;
  const showConfirmPasswordError = touched.confirmPassword
    ? confirmPasswordError
    : null;
  const showRolesError = touched.roles ? rolesError : null;

  const submitDisabled = useMemo(
    () =>
      isLoading ||
      !!emailError ||
      !!passwordError ||
      !!confirmPasswordError ||
      !!nameError ||
      !!rolesError,
    [
      isLoading,
      emailError,
      passwordError,
      confirmPasswordError,
      nameError,
      rolesError,
    ]
  );

  // ---- upload the avatar image

  async function uploadAvatar(userId: string, file: File): Promise<string> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/admin/users/${userId}/avatar`, {
      method: "POST",
      body: fd,
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j?.error || "آپلود تصویر ناموفق بود");
    return j.url as string; // server already sets prisma.user.image
  }

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
      // 1) Create user
      const res = await fetch("/api/admin/users/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullname: form.fullname.trim(), // maps to `name` in route
          email: form.email.trim().toLowerCase(),
          password: form.password,
          phone: form.phone || null,
          address: form.address || null,
          roles: form.roles,
        }),
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "خطا در ذخیره اطلاعات پروفایل");

      const newUserId: string | undefined = j?.id || j?.user?.id;
      if (!newUserId) throw new Error("شناسه کاربر جدید از سرور دریافت نشد.");

      // 2) Upload avatar (optional)
      if (form.imageFile) {
        setUploadingAvatar(true);
        try {
          await uploadAvatar(newUserId, form.imageFile);
        } finally {
          setUploadingAvatar(false);
        }
      }

      setSuccess("کاربر با موفقیت ایجاد شد.");
      // Reset
      setForm({
        fullname: "",
        email: "",
        password: "",
        phone: "",
        address: "",
        roles: [],
        imageFile: null,
      });
      if (preview) URL.revokeObjectURL(preview);
      setPreview(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "یک خطای غیرمنتظره رخ داد");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 pb-12 bg-gradient-to-b from-white to-gray-50 rounded-2xl shadow-md ring-1 ring-gray-100 select-none">
      <div>
        <h1 className="text-3xl font-extrabold text-center mb-6 text-navbar-primary tracking-tight">
          ایجاد کاربر جدید
        </h1>

        {error && <Banner kind="error" text={error} />}
        {success && <Banner kind="success" text={success} />}

        <form onSubmit={handleSignUp} className="space-y-6 ">
          {/* Primary details card */}
          <div className="rounded-2xl border border-gray-100 bg-background-gray p-4 md:p-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ">
              <Field
                label="نام و نام خانوادگی"
                value={form.fullname}
                onChange={(v) => handleChange("fullname", v)}
                onBlur={() => setTouched((t) => ({ ...t, fullname: true }))}
                required
                inputProps={{ placeholder: "مثلاً علی" }}
              />
              <Field
                label="ایمیل"
                value={form.email}
                onChange={(v) => handleChange("email", v)}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                error={showEmailError ?? undefined}
                required
                inputProps={{
                  type: "email",
                  inputMode: "email",
                  dir: "ltr",
                  lang: "en",
                  placeholder: "username@example.com",
                  autoComplete: "email",
                }}
              />
            </div>
            {showNameError && <Hint text={showNameError} />}

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 ">
              <Field
                label="رمز عبور"
                value={form.password}
                onChange={(v) => handleChange("password", v)}
                onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                error={showPasswordError ?? undefined}
                required
                inputProps={{
                  type: "password",
                  autoComplete: "new-password",
                  placeholder: "حداقل ۸ کاراکتر قوی",
                }}
              />
              <Field
                label="تکرار رمز عبور"
                value={confirmPassword}
                onChange={(v) => setConfirmPassword(v)}
                onBlur={() =>
                  setTouched((t) => ({ ...t, confirmPassword: true }))
                }
                error={showConfirmPasswordError ?? undefined}
                required
                inputProps={{
                  type: "password",
                  autoComplete: "new-password",
                  placeholder: "تکرار رمز عبور",
                }}
              />
            </div>

            {/* NEW: Confirm password */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Keep layout balanced; add phone next to it */}
              <Field
                label="آدرس (اختیاری)"
                value={form.address}
                onChange={(v) => handleChange("address", v)}
                inputProps={{ placeholder: "کوچه، خیابان، شهر..." }}
              />
              <Field
                label="تلفن (اختیاری)"
                value={form.phone}
                onChange={(v) => handleChange("phone", v)}
                inputProps={{
                  placeholder: "09xxxxxxxxx",
                  inputMode: "tel",
                }}
              />
            </div>
          </div>

          {/* roles */}

          <div>
            <div className="mb-2 font-medium">نقش‌ها</div>
            {allRoles.length === 0 ? (
              <p className="text-sm text-gray-500">
                نقشی برای انتخاب وجود ندارد.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-background-gray p-4 rounded-lg shadow-sm">
                {allRoles.map((r, i) => {
                  const checked = form.roles.includes(r.id);
                  return (
                    <label
                      key={r.id}
                      className="flex items-center text-gray-800 justify-between gap-2 border rounded-lg px-3 py-2 hover:bg-cms-secondary hover:text-white transition cursor-pointer"
                    >
                      <span className="">
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
            {showRolesError && <Hint text={showRolesError} />}
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
          <div className="flex justify-center mt-6 w-full">
            <button
              type="submit"
              disabled={submitDisabled}
              className="w-fit mx-auto items-center justify-center text-center px-20 py-2 bg-navbar-secondary text-white rounded hover:bg-navbar-hover transition disabled:opacity-60"
            >
              {isLoading
                ? uploadingAvatar
                  ? "در حال ایجاد و آپلود تصویر..."
                  : "در حال ایجاد..."
                : "ایجاد کاربر"}
            </button>
          </div>
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
  onBlur,
  error,
  required,
  inputProps,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void; // NEW
  error?: string;
  required?: boolean;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}) {
  return (
    <div className="group">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </label>
      <input
        className={`w-full rounded-xl border bg-white px-3 py-2 outline-none transition focus:ring-2 ${
          ["email", "tel"].includes(inputProps?.type || "") ? "ltr-input" : ""
        } ${
          error
            ? "border-red-500 focus:ring-red-300"
            : "border-gray-300 focus:ring-navbar-secondary"
        }`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
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
            // eslint-disable-next-line @next/next/no-img-element
            <img
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
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                if (!f) return onPick(null);
                const ok = ["image/jpeg", "image/png", "image/webp"];
                if (!ok.includes(f.type)) {
                  alert("فقط JPG/PNG/WEBP مجاز است.");
                  return;
                }
                if (f.size > 2 * 1024 * 1024) {
                  alert("حجم فایل نباید بیش از ۲ مگابایت باشد.");
                  return;
                }
                onPick(f);
              }}
            />
          </label>
        </div>
      </div>
    </div>
  );
}

