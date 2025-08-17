"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";

/* --- Types reflect your GET /api/admin/profile/me selection --- */
type Doc = { id: string; title: string; type: string; createdAt: string };

type RoleBadge = { role: { key: string; name: string } };
type Placement = {
  isPrimary: boolean;
  branch: { id: string; key: string; name: string };
  department: { id: string; key: string; name: string } | null;
};

type Me = {
  id: string;
  name: string; // read-only
  email: string; // read-only
  image?: string | null;
  phone?: string | null;
  address?: string | null;
  profile?: {
    secondaryEmail?: string | null;
    locale?: string | null;
    timezone?: string | null;
    notifyByEmail: boolean; // ensured in state
    emergencyName?: string | null;
    emergencyPhone?: string | null;
    avatarThumbUrl?: string | null;
  } | null;
  roles: RoleBadge[];
  branches: Placement[];
  documents: Doc[];
};

/* ---- Client-side validation schema mirrors server Zod ---- */
const PatchSchema = z.object({
  phone: z
    .string()
    .min(5, "حداقل ۵ کاراکتر")
    .max(32, "حداکثر ۳۲ کاراکتر")
    .optional()
    .or(z.literal("")),
  address: z
    .string()
    .max(300, "حداکثر ۳۰۰ کاراکتر")
    .optional()
    .or(z.literal("")),
  secondaryEmail: z
    .string()
    .email("ایمیل نامعتبر است")
    .optional()
    .or(z.literal("")),
  locale: z
    .string()
    .min(2, "حداقل ۲ کاراکتر")
    .max(10, "حداکثر ۱۰ کاراکتر")
    .optional()
    .or(z.literal("")),
  timezone: z
    .string()
    .min(3, "حداقل ۳ کاراکتر")
    .max(64, "حداکثر ۶۴ کاراکتر")
    .optional()
    .or(z.literal("")),
  notifyByEmail: z.boolean().optional(),
  emergencyName: z
    .string()
    .max(120, "حداکثر ۱۲۰ کاراکتر")
    .optional()
    .or(z.literal("")),
  emergencyPhone: z
    .string()
    .max(32, "حداکثر ۳۲ کاراکتر")
    .optional()
    .or(z.literal("")),
});

type Errors = Partial<
  Record<
    | "phone"
    | "address"
    | "secondaryEmail"
    | "locale"
    | "timezone"
    | "emergencyName"
    | "emergencyPhone",
    string
  >
>;

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB to match your admin API

export default function ProfileClient() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // form field errors
  const [errors, setErrors] = useState<Errors>({});

  // avatar UX like admin form
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  /* ---------- Data load ---------- */
  async function load(opts?: { keepSuccess?: boolean }) {
    setLoading(true);
    setError(null);
    if (!opts?.keepSuccess) setSuccess(null);
    const res = await fetch("/api/admin/profile/me", { cache: "no-store" });
    if (!res.ok) {
      setError("خطا در بارگذاری پروفایل");
      setLoading(false);
      return;
    }
    const j = (await res.json()) as Me;
    setMe({ ...j, profile: ensureProfile(j.profile) }); // guarantee notifyByEmail exists
    setErrors({}); // clear field errors on fresh load
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- Helpers ---------- */
  function ensureProfile(p: Me["profile"]): NonNullable<Me["profile"]> {
    return {
      notifyByEmail: p?.notifyByEmail ?? true,
      secondaryEmail: p?.secondaryEmail ?? null,
      locale: p?.locale ?? null,
      timezone: p?.timezone ?? null,
      emergencyName: p?.emergencyName ?? null,
      emergencyPhone: p?.emergencyPhone ?? null,
      avatarThumbUrl: p?.avatarThumbUrl ?? null,
    };
  }

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
    if (!ALLOWED_MIME.includes(f.type)) {
      setError("فقط JPG/PNG/WEBP مجاز است.");
      return;
    }
    if (f.size > MAX_SIZE) {
      setError("حجم فایل نباید بیش از ۲ مگابایت باشد.");
      return;
    }
    setError(null);
    setSuccess(null);
    setAvatarFile(f);
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(URL.createObjectURL(f));
  }

  async function uploadAvatarNow() {
    if (!avatarFile) return;
    setUploading(true);
    setError(null);
    setSuccess(null);
    try {
      const fd = new FormData();
      fd.append("file", avatarFile);
      const res = await fetch(`/api/admin/profile/avatar`, {
        method: "POST",
        body: fd,
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "آپلود تصویر ناموفق بود");
      setAvatarFile(null);
      resetPreview();
      setSuccess("تصویر با موفقیت به‌روزرسانی شد.");
      await load({ keepSuccess: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا در آپلود تصویر");
    } finally {
      setUploading(false);
    }
  }

  // Utility: normalize empties to undefined for PATCH
  const toUndef = (s?: string | null) => (s && s.trim().length ? s : undefined);

  // Validate a single field against PatchSchema and return message | undefined
  function validateOne<K extends keyof z.infer<typeof PatchSchema>>(
    key: K,
    value: unknown
  ): string | undefined {
    const data = { [key]: value } as Record<string, unknown>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = PatchSchema.pick({ [key]: true } as any).safeParse(data);
    if (!r.success) {
      const msg = r.error.issues[0]?.message || "مقدار نامعتبر";
      return msg;
    }
    return undefined;
  }

  // Run validation for all editable fields and return { ok, errs }
  function validateAll(current: Me): { ok: boolean; errs: Errors } {
    const payload = {
      phone: current.phone ?? "",
      address: current.address ?? "",
      secondaryEmail: current.profile?.secondaryEmail ?? "",
      locale: current.profile?.locale ?? "",
      timezone: current.profile?.timezone ?? "",
      notifyByEmail: current.profile?.notifyByEmail ?? true,
      emergencyName: current.profile?.emergencyName ?? "",
      emergencyPhone: current.profile?.emergencyPhone ?? "",
    };
    const res = PatchSchema.safeParse(payload);
    if (res.success) return { ok: true, errs: {} };

    // Collect per-field messages (first message per field)
    const errs: Errors = {};
    for (const issue of res.error.issues) {
      const path = issue.path[0] as keyof Errors;
      if (path && !errs[path]) errs[path] = issue.message || "نامعتبر";
    }
    return { ok: false, errs };
  }

  /* ---------- Save editable fields ---------- */
  async function save() {
    if (!me) return;
    // Validate all first
    const { ok, errs } = validateAll(me);
    setErrors(errs);
    if (!ok) {
      setError("لطفاً خطاهای فرم را برطرف کنید.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    const payload = {
      phone: toUndef(me.phone ?? ""),
      address: toUndef(me.address ?? ""),
      secondaryEmail: toUndef(me.profile?.secondaryEmail ?? ""),
      locale: toUndef(me.profile?.locale ?? ""),
      timezone: toUndef(me.profile?.timezone ?? ""),
      notifyByEmail: me.profile?.notifyByEmail ?? undefined,
      emergencyName: toUndef(me.profile?.emergencyName ?? ""),
      emergencyPhone: toUndef(me.profile?.emergencyPhone ?? ""),
    };

    const res = await fetch("/api/admin/profile/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) {
      setSuccess("اطلاعات با موفقیت ذخیره شد");
      await load({ keepSuccess: true });
    } else {
      const j = await res.json().catch(() => ({}));
      setError(j?.error ?? "ذخیره انجام نشد");
    }
  }

  // Disable save button if any current validation error
  const hasErrors = useMemo(() => Object.keys(errors).length > 0, [errors]);

  /* ---------- Render ---------- */
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
  if (error && !me) return <Banner kind="error" text={error} />;
  if (!me) return null;

  const avatarUrl =
    avatarPreview ||
    me.image ||
    me.profile?.avatarThumbUrl ||
    "/placeholder-avatar.png";

  // Compute initials from name for blank avatar fallback
  const parts = (me.name || "").trim().split(/\s+/).filter(Boolean);
  const initials = `${parts[0]?.[0] ?? ""}${
    parts[parts.length - 1]?.[0] ?? ""
  }`.toUpperCase();

  return (
    <div
      className="p-6 pb-12 bg-gradient-to-b from-white to-gray-50 rounded-2xl shadow-md ring-1 ring-gray-100 select-none space-y-6"
      dir="rtl"
    >
      <h1 className="text-2xl md:text-3xl font-extrabold text-navbar-primary text-center mb-6">
        پروفایل کاربر
      </h1>

      {/* Header + Avatar with choose/upload/cancel UX */}
      <div className="flex flex-col items-center">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt="avatar"
            className="w-28 h-28 rounded-full object-cover border border-gray-200 shadow-sm"
          />
        ) : (
          <div className="w-28 h-28 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xl font-semibold text-gray-600">
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
      </div>

      {/* Read-only identity and placements */}
      <div className="rounded-2xl bg-white p-6 m-1 mb-6 shadow-sm shadow-emerald-800 border-r-7 border-r-navbar-secondary">
        <div className="text-lg font-semibold text-cms-primary mb-4">
          اطلاعات کاربر{" "}
          <span className="text-sm font-light">(غیرقابل ادیت)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
          <div className="grid grid-cols-2 gap-4">
            <ReadOnlyField label="نام" value={me.name} />
            <ReadOnlyField label="ایمیل" value={me.email} dir="ltr" />

            <div>
              <div className="text-sm text-gray-700 mb-1 pr-1">نقش‌ها</div>
              <div className="flex flex-wrap gap-2">
                {me.roles?.length ? (
                  me.roles.map((r) => (
                    <span
                      key={r.role.key}
                      className="px-2.5 py-1 rounded-full text-xs bg-emerald-50 text-emerald-700 border border-emerald-200"
                    >
                      {r.role.name}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 text-sm">نقشی ثبت نشده</span>
                )}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-700 mb-1 pr-1">شهر محل کار</div>
              <div className="flex flex-col gap-1 pr-2">
                {me.branches?.length ? (
                  <ul className="space-y-1">
                    {me.branches.map((p, i) => (
                      <li
                        key={`${p.branch?.id ?? "branch"}-${
                          p.department?.id ?? "dept"
                        }-${i}`}
                        className="flex w-fit space-x-3 items-center justify-start rounded-lg bg-gray-50/60 px-2 py-1"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm text-gray-900">
                            <span className="font-semibold">
                              {p.branch?.name}
                            </span>

                            {p.department ? (
                              <span className="text-gray-600">
                                {" "}
                                · {p.department.name}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {p.isPrimary ? (
                          <span className="shrink-0 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700">
                            اصلی
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-sm text-gray-500">ثبت نشده</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Editable self-service fields with validation */}
      <div className="rounded-2xl bg-white p-5 shadow-sm shadow-emerald-800 border-r-8 border-r-navbar-secondary">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="شماره تماس"
            value={me.phone || ""}
            onChange={(v) => {
              setMe({ ...me, phone: v });
              setErrors((e) => ({ ...e, phone: validateOne("phone", v) }));
            }}
            error={errors.phone}
            inputProps={{
              type: "tel",
              minLength: 5,
              maxLength: 32,
              dir: "ltr",
            }}
          />

          <Field
            label="ایمیل دوم"
            value={me.profile?.secondaryEmail || ""}
            onChange={(v) => {
              setMe({
                ...me,
                profile: { ...ensureProfile(me.profile), secondaryEmail: v },
              });
              setErrors((e) => ({
                ...e,
                secondaryEmail: validateOne("secondaryEmail", v),
              }));
            }}
            error={errors.secondaryEmail}
            inputProps={{ type: "email" }}
          />

          <Field
            label="زبان (locale)"
            value={me.profile?.locale || ""}
            onChange={(v) => {
              setMe({
                ...me,
                profile: { ...ensureProfile(me.profile), locale: v },
              });
              setErrors((e) => ({ ...e, locale: validateOne("locale", v) }));
            }}
            error={errors.locale}
            inputProps={{ placeholder: "fa-IR", maxLength: 10 }}
          />

          <Field
            label="منطقه زمانی"
            value={me.profile?.timezone || ""}
            onChange={(v) => {
              setMe({
                ...me,
                profile: { ...ensureProfile(me.profile), timezone: v },
              });
              setErrors((e) => ({
                ...e,
                timezone: validateOne("timezone", v),
              }));
            }}
            error={errors.timezone}
            inputProps={{ placeholder: "Europe/Berlin", maxLength: 64 }}
          />

          <Field
            label="نام شخص اضطراری"
            value={me.profile?.emergencyName || ""}
            onChange={(v) => {
              setMe({
                ...me,
                profile: { ...ensureProfile(me.profile), emergencyName: v },
              });
              setErrors((e) => ({
                ...e,
                emergencyName: validateOne("emergencyName", v),
              }));
            }}
            error={errors.emergencyName}
            inputProps={{ maxLength: 120 }}
          />

          <Field
            label="شماره شخص اضطراری"
            value={me.profile?.emergencyPhone || ""}
            onChange={(v) => {
              setMe({
                ...me,
                profile: { ...ensureProfile(me.profile), emergencyPhone: v },
              });
              setErrors((e) => ({
                ...e,
                emergencyPhone: validateOne("emergencyPhone", v),
              }));
            }}
            error={errors.emergencyPhone}
            inputProps={{ type: "tel", maxLength: 32, dir: "ltr" }}
          />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={me.profile?.notifyByEmail ?? true}
              onChange={(e) =>
                setMe({
                  ...me,
                  profile: {
                    ...ensureProfile(me.profile),
                    notifyByEmail: e.target.checked,
                  },
                })
              }
              className="h-4 w-4"
            />
            <span>اعلان ایمیلی</span>
          </label>
        </div>

        <div className="flex gap-2 pt-5">
          <button
            type="button"
            className="px-5 h-11 rounded-xl bg-navbar-secondary text-white font-medium hover:bg-navbar-hover transition disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={save}
            disabled={saving || hasErrors}
          >
            {saving ? "در حال ذخیره…" : "ذخیره"}
          </button>
          {success && <Banner kind="success" text={success} />}
          {error && !success && <Banner kind="error" text={error} />}
        </div>
      </div>

      {/* Documents */}
      <div className="rounded-2xl bg-white p-5 shadow-sm shadow-emerald-800">
        <div className="text-lg font-semibold mb-3">مدارک من</div>
        <div className="rounded-2xl border border-navbar-active overflow-hidden shadow-sm select-none">
          <table className="w-full text-sm">
            <thead className="bg-navbar-primary">
              <tr className="text-right bg-cms-primary text-white">
                <th className="p-3">عنوان</th>
                <th className="p-3">نوع</th>
                <th className="p-3">تاریخ</th>
                <th className="p-3 w-32">اقدامات</th>
              </tr>
            </thead>
            <tbody>
              {me.documents.map((d) => (
                <tr key={d.id} className="border-t">
                  <td className="p-3">{d.title}</td>
                  <td className="p-3">{d.type}</td>
                  <td className="p-3">
                    {new Date(d.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    <a
                      className="px-3 py-1.5 rounded-lg border border-navbar-secondary text-navbar-secondary hover:bg-navbar-secondary hover:text-white transition"
                      href={`/api/profile/documents/${d.id}/download`}
                    >
                      دانلود
                    </a>
                  </td>
                </tr>
              ))}
              {!me.documents.length && (
                <tr>
                  <td className="p-4 text-gray-500" colSpan={4}>
                    مدرکی یافت نشد.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ——— Small, local UI helpers ——— */

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
  const max = inputProps?.maxLength;
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
            ? "border-rose-500 focus:ring-rose-200"
            : "border-gray-300 focus:ring-navbar-secondary"
        } ${inputProps?.className ?? ""}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {...(inputProps as any)}
      />
      {max ? (
        <div className="text-xs text-gray-400 mt-1">
          {value.length}/{max}
        </div>
      ) : null}
      {error && <p className="text-rose-600 text-sm mt-1">{error}</p>}
    </div>
  );
}

function ReadOnlyField({
  label,
  value,
  dir,
}: {
  label: string;
  value: string | null | undefined;
  dir?: "ltr" | "rtl";
}) {
  return (
    <div>
      <div className="text-sm text-gray-700 mb-1 pr-1">{label}</div>
      <div
        className={`w-full rounded-xl border px-3 py-2 bg-gray-50 text-gray-700 border-gray-200 ${
          dir === "ltr" ? "ltr-input" : ""
        }`}
      >
        {value ?? "—"}
      </div>
    </div>
  );
}

function Banner({ kind, text }: { kind: "error" | "success"; text: string }) {
  const cls =
    kind === "error"
      ? "bg-red-50 text-red-700 ring-1 ring-red-100"
      : "bg-green-50 text-green-700 ring-1 ring-green-100";
  return <div className={`${cls} p-3 rounded-xl`}>{text}</div>;
}
