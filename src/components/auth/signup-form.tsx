"use client";

import { useState, useEffect, useMemo } from "react";
import {
  validateEmail,
  validateNewPassword,
} from "@/lib/validators/validators";

type RoleOption = { id: string; name: string; key?: string };
type BranchOption = { id: string; name: string; key?: string; city?: string };
type DepartmentOption = { id: string; name: string; key?: string };

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
    roles: [] as string[],
    imageFile: null as File | null,

    // Admin flags
    isActive: true,
    mustChangePassword: false,

    // Profile fields
    profile: {
      secondaryEmail: "",
      locale: "",
      timezone: "",
      notifyByEmail: true,
      emergencyName: "",
      emergencyPhone: "",
    },

    // New: initial placement for the user
    placement: {
      branchId: "", // required if you want to create placement
      departmentId: "", // optional, global
      positionTitle: "",
      isPrimary: true,
    },
  });
  const [confirmPassword, setConfirmPassword] = useState("");

  // ---- lists
  const [allRoles, setAllRoles] = useState<RoleOption[]>(rolesProp ?? []);
  const [allBranches, setAllBranches] = useState<BranchOption[]>([]);
  const [allDepartments, setAllDepartments] = useState<DepartmentOption[]>([]);

  // ---- ui state
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
    address: false,
    phone: false,
    // profile touched
    secondaryEmail: false,
    locale: false,
    timezone: false,
    emergencyName: false,
    emergencyPhone: false,
    // placement touched
    branchId: false,
    departmentId: false,
    positionTitle: false,
  });

  // ---- validation
  const emailError = validateEmail(form.email).error ?? null;
  const passwordError = validateNewPassword(form.password).error ?? null;
  const confirmPasswordError =
    form.password && confirmPassword && confirmPassword !== form.password
      ? "رمز عبور و تکرار آن یکسان نیست."
      : null;

  const n = form.fullname.trim();
  const nameError = !n
    ? "نام و نام خانوادگی الزامی است."
    : n.length < 2
    ? "حداقل ۲ کاراکتر."
    : n.length > 120
    ? "حداکثر ۱۲۰ کاراکتر."
    : null;

  const a = (form.address ?? "").trim();
  const addressError = !a
    ? null
    : a.length > 200
    ? "حداکثر 200 کاراکتر."
    : null;

  const p = (form.phone ?? "").trim();
  const phoneNumberError = !p
    ? null
    : p.length < 5
    ? "حداقل ۵ رقم."
    : p.length > 32
    ? "حداکثر ۳۲ کاراکتر."
    : null;

  const se = (form.profile.secondaryEmail ?? "").trim();
  const secondaryEmailError =
    se && validateEmail(se).error ? "ایمیل نامعتبر است." : null;

  const loc = (form.profile.locale ?? "").trim();
  const localeError = !loc
    ? null
    : loc.length < 2
    ? "حداقل ۲ کاراکتر."
    : loc.length > 10
    ? "حداکثر ۱۰ کاراکتر."
    : null;

  const tz = (form.profile.timezone ?? "").trim();
  const timezoneError = !tz
    ? null
    : tz.length < 3
    ? "حداقل ۳ کاراکتر."
    : tz.length > 64
    ? "حداکثر ۶۴ کاراکتر."
    : null;

  const emn = (form.profile.emergencyName ?? "").trim();
  const emergencyNameError = !emn
    ? null
    : emn.length > 120
    ? "حداکثر ۱۲۰ کاراکتر."
    : null;

  const emp = (form.profile.emergencyPhone ?? "").trim();
  const emergencyPhoneError = !emp
    ? null
    : emp.length > 32
    ? "حداکثر ۳۲ کاراکتر."
    : null;

  const rolesError =
    form.roles.length === 0 ? "حداقل یک نقش را انتخاب کنید." : null;

  const showNameError = touched.fullname ? nameError : null;
  const showEmailError = touched.email ? emailError : null;
  const showPasswordError = touched.password ? passwordError : null;
  const showConfirmPasswordError = touched.confirmPassword
    ? confirmPasswordError
    : null;
  const showRolesError = touched.roles ? rolesError : null;
  const showAddressError = touched.address ? addressError : null;
  const showPhoneError = touched.phone ? phoneNumberError : null;
  const showSecondaryEmailError = touched.secondaryEmail
    ? secondaryEmailError
    : null;
  const showLocaleError = touched.locale ? localeError : null;
  const showTimezoneError = touched.timezone ? timezoneError : null;
  const showEmergencyNameError = touched.emergencyName
    ? emergencyNameError
    : null;
  const showEmergencyPhoneError = touched.emergencyPhone
    ? emergencyPhoneError
    : null;

  const submitDisabled = useMemo(
    () =>
      isLoading ||
      !!emailError ||
      !!passwordError ||
      !!confirmPasswordError ||
      !!nameError ||
      !!rolesError ||
      !!addressError ||
      !!phoneNumberError ||
      !!secondaryEmailError ||
      !!localeError ||
      !!timezoneError ||
      !!emergencyNameError ||
      !!emergencyPhoneError,
    [
      isLoading,
      emailError,
      passwordError,
      confirmPasswordError,
      nameError,
      rolesError,
      addressError,
      phoneNumberError,
      secondaryEmailError,
      localeError,
      timezoneError,
      emergencyNameError,
      emergencyPhoneError,
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
    return j.url as string;
  }

  // ---- load roles/branches/departments if not passed
  useEffect(() => {
    (async () => {
      try {
        if (!rolesProp?.length) {
          const res = await fetch("/api/roles", { cache: "no-store" });
          if (res.ok) setAllRoles(await res.json());
        }
      } catch {
        setAllRoles(rolesProp ?? []);
      }
      try {
        const [bRes, dRes] = await Promise.all([
          fetch("/api/admin/branches", { cache: "no-store" }),
          fetch("/api/admin/departments", { cache: "no-store" }),
        ]);
        if (bRes.ok) setAllBranches(await bRes.json());
        if (dRes.ok) setAllDepartments(await dRes.json());
      } catch {
        setAllBranches([]);
        setAllDepartments([]);
      }
    })();
  }, [rolesProp]);

  // ---- helpers
  const handleChange = (
    field: keyof typeof form,
    value: string | File | null | boolean
  ) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setForm((p) => ({ ...p, [field]: value as any }));
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
      setTouched((t) => ({
        ...t,
        fullname: true,
        email: true,
        password: true,
        confirmPassword: true,
        roles: true,
        address: true,
        phone: true,
        secondaryEmail: true,
        locale: true,
        timezone: true,
        emergencyName: true,
        emergencyPhone: true,
        branchId: true,
        departmentId: true,
        positionTitle: true,
      }));
      setError("لطفاً خطاهای فرم را برطرف کنید.");
      return;
    }

    setIsLoading(true);
    try {
      // Build placement (optional unless you want to enforce)
      const hasPlacement = !!form.placement.branchId;
      const placement = hasPlacement
        ? {
            branchId: form.placement.branchId,
            departmentId: form.placement.departmentId || null,
            isPrimary: !!form.placement.isPrimary,
            positionTitle: form.placement.positionTitle.trim() || null,
          }
        : undefined;

      // 1) Create user
      const res = await fetch("/api/admin/users/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullname: form.fullname.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          phone: form.phone || null,
          address: form.address || null,
          roles: form.roles,
          isActive: !!form.isActive,
          mustChangePassword: !!form.mustChangePassword,
          profile: {
            secondaryEmail: form.profile.secondaryEmail?.trim() || null,
            locale: form.profile.locale?.trim() || null,
            timezone: form.profile.timezone?.trim() || null,
            notifyByEmail: Boolean(form.profile.notifyByEmail),
            emergencyName: form.profile.emergencyName?.trim() || null,
            emergencyPhone: form.profile.emergencyPhone?.trim() || null,
          },
          placement,
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
        isActive: true,
        mustChangePassword: false,
        profile: {
          secondaryEmail: "",
          locale: "",
          timezone: "",
          notifyByEmail: true,
          emergencyName: "",
          emergencyPhone: "",
        },
        placement: {
          branchId: "",
          departmentId: "",
          positionTitle: "",
          isPrimary: true,
        },
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

        <form onSubmit={handleSignUp} className="space-y-6">
          {/* Primary details card */}
          <div className="rounded-2xl border border-gray-100 bg-background-gray p-4 md:p-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label="نام و نام خانوادگی"
                value={form.fullname}
                onChange={(v) => handleChange("fullname", v)}
                onBlur={() => setTouched((t) => ({ ...t, fullname: true }))}
                required
                inputProps={{ placeholder: "مثلاً علی رضایی" }}
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

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  maxLength: 48,
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
                  maxLength: 48,
                }}
              />
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label="آدرس (اختیاری)"
                value={form.address}
                onChange={(v) => handleChange("address", v)}
                onBlur={() => setTouched((t) => ({ ...t, address: true }))}
                inputProps={{
                  placeholder: "کوچه، خیابان، شهر...",
                  maxLength: 200,
                }}
                error={showAddressError ?? undefined}
              />
              <Field
                label="تلفن (اختیاری)"
                value={form.phone}
                onChange={(v) => handleChange("phone", v)}
                onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                error={showPhoneError ?? undefined}
                inputProps={{
                  placeholder: "09xxxxxxxxx",
                  inputMode: "tel",
                  type: "tel",
                  minLength: 5,
                  maxLength: 32,
                }}
              />
            </div>

            {/* Admin flags */}
            <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => handleChange("isActive", e.target.checked)}
                  className="h-4 w-4"
                />
                <span>کاربر فعال است</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.mustChangePassword}
                  onChange={(e) =>
                    handleChange("mustChangePassword", e.target.checked)
                  }
                  className="h-4 w-4"
                />
                <span>تغییر اجباری رمز عبور در اولین ورود</span>
              </label>
            </div>
          </div>

          {/* Profile fields */}
          <div className="rounded-2xl border border-gray-100 bg-background-gray p-4 md:p-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label="ایمیل دوم (اختیاری)"
                value={form.profile.secondaryEmail}
                onChange={(v) =>
                  setForm((p) => ({
                    ...p,
                    profile: { ...p.profile, secondaryEmail: v },
                  }))
                }
                onBlur={() =>
                  setTouched((t) => ({ ...t, secondaryEmail: true }))
                }
                error={showSecondaryEmailError ?? undefined}
                inputProps={{
                  type: "email",
                  dir: "ltr",
                  inputMode: "email",
                  placeholder: "alt@example.com",
                }}
              />
              <Field
                label="زبان (locale) (اختیاری)"
                value={form.profile.locale}
                onChange={(v) =>
                  setForm((p) => ({
                    ...p,
                    profile: { ...p.profile, locale: v },
                  }))
                }
                onBlur={() => setTouched((t) => ({ ...t, locale: true }))}
                error={showLocaleError ?? undefined}
                inputProps={{ placeholder: "fa-IR", maxLength: 10 }}
              />
              <Field
                label="منطقه زمانی (اختیاری)"
                value={form.profile.timezone}
                onChange={(v) =>
                  setForm((p) => ({
                    ...p,
                    profile: { ...p.profile, timezone: v },
                  }))
                }
                onBlur={() => setTouched((t) => ({ ...t, timezone: true }))}
                error={showTimezoneError ?? undefined}
                inputProps={{ placeholder: "Europe/Tehran", maxLength: 64 }}
              />
              <Field
                label="نام شخص اضطراری (اختیاری)"
                value={form.profile.emergencyName}
                onChange={(v) =>
                  setForm((p) => ({
                    ...p,
                    profile: { ...p.profile, emergencyName: v },
                  }))
                }
                onBlur={() =>
                  setTouched((t) => ({ ...t, emergencyName: true }))
                }
                error={showEmergencyNameError ?? undefined}
                inputProps={{ maxLength: 120 }}
              />
              <Field
                label="شماره شخص اضطراری (اختیاری)"
                value={form.profile.emergencyPhone}
                onChange={(v) =>
                  setForm((p) => ({
                    ...p,
                    profile: { ...p.profile, emergencyPhone: v },
                  }))
                }
                onBlur={() =>
                  setTouched((t) => ({ ...t, emergencyPhone: true }))
                }
                error={showEmergencyPhoneError ?? undefined}
                inputProps={{
                  type: "tel",
                  dir: "ltr",
                  maxLength: 32,
                  inputMode: "tel",
                }}
              />
            </div>

            <div className="mt-4">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.profile.notifyByEmail}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      profile: {
                        ...p.profile,
                        notifyByEmail: e.target.checked,
                      },
                    }))
                  }
                  className="h-4 w-4"
                />
                <span>اعلان ایمیلی</span>
              </label>
            </div>
          </div>

          {/* Placement (Branch / Department / Title / Primary) */}
          <div className="rounded-2xl border border-gray-100 bg-background-gray p-4 md:p-6 shadow-sm">
            <div className="mb-2 font-medium">محل خدمت / واحد</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField
                label="شعبه (Branch)"
                value={form.placement.branchId}
                onChange={(v) =>
                  setForm((p) => ({
                    ...p,
                    placement: { ...p.placement, branchId: v },
                  }))
                }
                onBlur={() => setTouched((t) => ({ ...t, branchId: true }))}
                options={[{ id: "", name: "— انتخاب شعبه —" }, ...allBranches]}
              />
              <SelectField
                label="دپارتمان (اختیاری)"
                value={form.placement.departmentId}
                onChange={(v) =>
                  setForm((p) => ({
                    ...p,
                    placement: { ...p.placement, departmentId: v },
                  }))
                }
                onBlur={() => setTouched((t) => ({ ...t, departmentId: true }))}
                options={[
                  { id: "", name: "— بدون دپارتمان —" },
                  ...allDepartments,
                ]}
              />
              {/* <Field
                label="عنوان شغلی (اختیاری)"
                value={form.placement.positionTitle}
                onChange={(v) =>
                  setForm((p) => ({
                    ...p,
                    placement: { ...p.placement, positionTitle: v },
                  }))
                }
                onBlur={() =>
                  setTouched((t) => ({ ...t, positionTitle: true }))
                }
                inputProps={{
                  placeholder: "مثلاً: پرستار ارشد",
                  maxLength: 120,
                }}
              /> */}
              {/* <div className="flex items-end">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.placement.isPrimary}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        placement: {
                          ...p.placement,
                          isPrimary: e.target.checked,
                        },
                      }))
                    }
                    className="h-4 w-4"
                  />
                  <span>اصلی (Primary)</span>
                </label>
              </div> */}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              انتخاب شعبه اختیاری است؛ در صورت انتخاب، کاربر با این محل خدمت
              ایجاد می‌شود.
            </p>
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
                      <span>
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
  onBlur?: () => void;
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

function SelectField({
  label,
  value,
  onChange,
  onBlur,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  options: { id: string; name: string }[];
}) {
  return (
    <div className="group">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <select
        className="w-full rounded-xl border bg-white px-3 py-2 outline-none transition focus:ring-2 border-gray-300 focus:ring-navbar-secondary"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
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
