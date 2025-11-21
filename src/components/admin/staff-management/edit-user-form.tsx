"use client";

import { useEffect, useMemo, useState } from "react";
import {
  validateEmail,
  validateNewPassword,
} from "@/lib/validators/validators";
import { ProfileState } from "@/config/types/auth/types";
import { useRouter } from "next/navigation";
import { User } from "lucide-react";

// ---- Types ----
type PlacementView = {
  isPrimary: boolean;
  branch: { id: string; key?: string; name: string; city?: string | null };
  department: { id: string; key?: string; name: string } | null;
};

type BranchOption = {
  id: string;
  name: string;
  key?: string;
  city?: string | null;
};
type DepartmentOption = { id: string; name: string; key?: string };
type SpecialtyOption = { id: string; name: string }; // <-- NEW

type PlacementForm = {
  branchId: string; // required to set placement; can be ""
  departmentId: string | null; // nullable
  isPrimary: boolean;
  positionTitle: string; // optional ("" -> null)
};

type User = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  isActive: boolean;
  mustChangePassword?: boolean;
  imageUrl?: string | null;
  specialtyId?: string | null; // <-- NEW
  profile: ProfileState;
  branches?: PlacementView[]; // from API for current placements
  roles?: { role: { id: string; key: string; name: string } }[]; // if added to GET
};

type UpdatePayload = {
  name?: string | null;
  email?: string;
  phone?: string | null;
  address?: string | null;
  isActive?: boolean;
  mustChangePassword?: boolean;
  password?: string;
  specialtyId?: string | null; // <-- NEW
  profile?: Partial<{
    secondaryEmail: string | null;
    locale: string | null;
    timezone: string | null;
    notifyByEmail: boolean;
    emergencyName: string | null;
    emergencyPhone: string | null;
  }>;
  // server expects a *single* role key
  role?: string | null;
  // server expects single primary placement (we replace existing)
  placement?: {
    branchId: string;
    departmentId?: string | null;
    isPrimary?: boolean;
    positionTitle?: string | null;
  };
};

export default function EditUserForm({ userId }: { userId: string }) {
  const router = useRouter();

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // options
  const [allBranches, setAllBranches] = useState<BranchOption[]>([]);
  const [allDepartments, setAllDepartments] = useState<DepartmentOption[]>([]);
  const [allSpecialties, setAllSpecialties] = useState<SpecialtyOption[]>([]); // <-- NEW
  type RoleOption = { id: string; key: string; name: string };

  const [allRoles, setAllRoles] = useState<RoleOption[]>([]);
  const [selectedRoleKey, setSelectedRoleKey] = useState<string | null>(null);
  const [originalRoleKey, setOriginalRoleKey] = useState<string | null>(null);
  // placement state (we edit only ONE primary placement)
  const [placement, setPlacement] = useState<PlacementForm>({
    branchId: "",
    departmentId: null,
    isPrimary: true,
    positionTitle: "",
  });
  const [originalPlacement, setOriginalPlacement] = useState<PlacementForm>({
    branchId: "",
    departmentId: null,
    isPrimary: true,
    positionTitle: "",
  });

  // form/original state
  const [form, setForm] = useState<User>({
    id: userId,
    fullName: "",
    email: "",
    phone: "",
    address: "",
    isActive: true,
    mustChangePassword: false,
    imageUrl: null,
    specialtyId: null, // <-- NEW
    profile: {
      secondaryEmail: "",
      locale: "",
      timezone: "",
      notifyByEmail: true,
      emergencyName: "",
      emergencyPhone: "",
    },
    branches: [],
    roles: [],
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
    specialtyId: false, // <-- NEW
    // profile:
    secondaryEmail: false,
    locale: false,
    timezone: false,
    emergencyName: false,
    emergencyPhone: false,
    // placement:
    branch: false,
    department: false,
    positionTitle: false,
  });

  const isDoctorRoleSelected = useMemo(() => {
    return selectedRoleKey === "doctor";
  }, [selectedRoleKey]);

  // ---- load user + options
  useEffect(() => {
    let alive = true;
    (async () => {
      setError("");
      setSuccess("");
      setLoading(true);
      try {
        const [userRes, brRes, depRes, roleRes, specRes] = await Promise.all([
          fetch(`/api/admin/users/${userId}`, { cache: "no-store" }),
          fetch(`/api/admin/branches`, { cache: "no-store" }),
          fetch(`/api/admin/departments`, { cache: "no-store" }),
          fetch(`/api/admin/roles`, { cache: "no-store" }),
          fetch(`/api/admin/specialties`, { cache: "no-store" }), // <-- NEW
        ]);

        if (!userRes.ok) throw new Error("خطا در دریافت اطلاعات کاربر");

        const u = await userRes.json();
        const branches: BranchOption[] = brRes.ok ? await brRes.json() : [];
        const depts: DepartmentOption[] = depRes.ok ? await depRes.json() : [];
        const roles: RoleOption[] = roleRes.ok ? await roleRes.json() : [];
        const specialties: SpecialtyOption[] = specRes.ok
          ? await specRes.json()
          : []; // <-- NEW

        if (!alive) return;

        const primary =
          (u.branches || []).find((x: PlacementView) => x.isPrimary) ||
          (u.branches || [])[0] ||
          null;

        const normalized: User = {
          id: u.id,
          fullName: u.name ?? "",
          email: u.email ?? "",
          phone: u.phone ?? "",
          address: u.address ?? "",
          isActive: Boolean(u.isActive),
          mustChangePassword: Boolean(u.mustChangePassword),
          imageUrl: u.image ?? null,
          specialtyId: u.specialtyId ?? null, // <-- NEW
          profile: {
            secondaryEmail: u.profile?.secondaryEmail ?? "",
            locale: u.profile?.locale ?? "",
            timezone: u.profile?.timezone ?? "",
            notifyByEmail: u.profile?.notifyByEmail ?? true,
            emergencyName: u.profile?.emergencyName ?? "",
            emergencyPhone: u.profile?.emergencyPhone ?? "",
          },
          branches: u.branches ?? [],
          roles: u.roles ?? [],
        };
        const currentRoleKey = u.roles?.[0]?.role?.key ?? null;
        setSelectedRoleKey(currentRoleKey);
        setOriginalRoleKey(currentRoleKey);

        setForm(normalized);
        setOriginal(normalized);

        const pNow: PlacementForm = {
          branchId: primary?.branch?.id ?? "",
          departmentId: primary?.department?.id ?? null,
          isPrimary: true,
          positionTitle: "",
        };
        setPlacement(pNow);
        setOriginalPlacement(pNow);

        setAllBranches(branches);
        setAllDepartments(depts);
        setAllRoles(roles);
        setAllSpecialties(specialties); // <-- NEW
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

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/roles", { cache: "no-store" });
        if (!res.ok) throw new Error("failed to load roles");
        const rows: RoleOption[] = await res.json();
        setAllRoles(rows);
      } catch {
        setAllRoles([]);
      }
    })();
  }, []);

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

  // ---- validation
  const emailCheck = validateEmail(form.email.trim());
  const passwordCheck = password
    ? validateNewPassword(password)
    : { isValid: true, error: null };
  const password2Check =
    password && password2 && password !== password
      ? { isValid: false, error: "رمز عبور و تکرار آن یکسان نیست." }
      : { isValid: true, error: null };
  const specialtyError =
    isDoctorRoleSelected && !form.specialtyId
      ? "انتخاب تخصص الزامی است."
      : null;

  const se = form.profile.secondaryEmail.trim();
  const secondaryEmailError =
    se && validateEmail(se).error ? "ایمیل نامعتبر است." : null;

  const loc = form.profile.locale.trim();
  const localeError = !loc
    ? null
    : loc.length < 2
    ? "حداقل ۲ کاراکتر."
    : loc.length > 10
    ? "حداکثر ۱۰ کاراکتر."
    : null;

  const tz = form.profile.timezone.trim();
  const timezoneError = !tz
    ? null
    : tz.length < 3
    ? "حداقل ۳ کاراکتر."
    : tz.length > 64
    ? "حداکثر ۶۴ کاراکتر."
    : null;

  const emn = form.profile.emergencyName.trim();
  const emergencyNameError = !emn
    ? null
    : emn.length > 120
    ? "حداکثر ۱۲۰ کاراکتر."
    : null;

  const emp = form.profile.emergencyPhone.trim();
  const emergencyPhoneError = !emp
    ? null
    : emp.length > 32
    ? "حداکثر ۳۲ کاراکتر."
    : null;

  const showEmailError = touched.email ? emailCheck.error : null;
  const showPasswordError = touched.password ? passwordCheck.error : null;
  const showPassword2Error = touched.password2 ? password2Check.error : null;
  const showSpecialtyError = touched.specialtyId ? specialtyError : null;
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

  const hasBlockingErrors =
    !emailCheck.isValid ||
    !passwordCheck.isValid ||
    !password2Check.isValid ||
    !!secondaryEmailError ||
    !!localeError ||
    !!timezoneError ||
    !!emergencyNameError ||
    !!emergencyPhoneError;

  // ---- diff builder
  const changedPayload = useMemo<UpdatePayload>(() => {
    if (!original) return {};
    const p: UpdatePayload = {};

    if (form.fullName.trim() !== original.fullName)
      p.name = form.fullName.trim();
    if (form.email.trim().toLowerCase() !== original.email)
      p.email = form.email.trim().toLowerCase();
    if ((form.phone ?? "") !== (original.phone ?? ""))
      p.phone = form.phone || null;
    if ((form.address ?? "") !== (original.address ?? ""))
      p.address = form.address || null;
    if (form.isActive !== original.isActive) p.isActive = form.isActive;
    if (form.mustChangePassword !== original.mustChangePassword)
      p.mustChangePassword = form.mustChangePassword;
    if (password) p.password = password;
    if (form.specialtyId !== original.specialtyId)
      p.specialtyId = form.specialtyId || null;

    const profChanges: Partial<ProfileState> = {};
    if (form.profile.secondaryEmail !== original.profile.secondaryEmail)
      profChanges.secondaryEmail = form.profile.secondaryEmail;
    if (form.profile.locale !== original.profile.locale)
      profChanges.locale = form.profile.locale;
    if (form.profile.timezone !== original.profile.timezone)
      profChanges.timezone = form.profile.timezone;
    if (form.profile.notifyByEmail !== original.profile.notifyByEmail)
      profChanges.notifyByEmail = form.profile.notifyByEmail;
    if (form.profile.emergencyName !== original.profile.emergencyName)
      profChanges.emergencyName = form.profile.emergencyName;
    if (form.profile.emergencyPhone !== original.profile.emergencyPhone)
      profChanges.emergencyPhone = form.profile.emergencyPhone;
    if (Object.keys(profChanges).length > 0) p.profile = profChanges;

    if (selectedRoleKey !== originalRoleKey) p.role = selectedRoleKey;

    if (
      placement.branchId !== originalPlacement.branchId ||
      placement.departmentId !== originalPlacement.departmentId
    ) {
      p.placement = {
        branchId: placement.branchId,
        departmentId: placement.departmentId,
      };
    }

    return p;
  }, [
    form,
    original,
    password,
    selectedRoleKey,
    originalRoleKey,
    placement,
    originalPlacement,
  ]);

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
      setOriginal(form);
      setOriginalRoleKey(selectedRoleKey);
      setOriginalPlacement(placement);
      router.push("/admin/staff-management");
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
          <div className="w-28 h-28 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400">
            <User className="w-12 h-12" />
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

        <div className="mt-2 text-sm text-gray-500 select-text ltr-input">
          {form.email || "بدون ایمیل"}
        </div>
      </div>

      {error && <Banner kind="error" text={error} />}
      {success && <Banner kind="success" text={success} />}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic info */}
        <div className="rounded-2xl bg-white p-6 m-1 mb-10 shadow-sm shadow-emerald-800 border-r-7 border-r-navbar-secondary">
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
        </div>

        {/* Profile */}
        <div className="rounded-2xl bg-white p-5 mb-10 shadow-sm shadow-emerald-800 border-r-7 border-r-navbar-secondary mt-6">
          <div className="text-lg font-semibold text-cms-primary mb-4">
            پروفایل
          </div>

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
              error={showSecondaryEmailError ?? undefined}
              inputProps={{
                type: "email",
                inputMode: "email",
                dir: "ltr",
                placeholder: "alt@example.com",
                onBlur: () =>
                  setTouched((t) => ({ ...t, secondaryEmail: true })),
              }}
            />
            <Field
              label="زبان (locale)"
              value={form.profile.locale}
              onChange={(v) =>
                setForm((p) => ({
                  ...p,
                  profile: { ...p.profile, locale: v },
                }))
              }
              error={showLocaleError ?? undefined}
              inputProps={{
                placeholder: "fa-IR",
                maxLength: 10,
                onBlur: () => setTouched((t) => ({ ...t, locale: true })),
              }}
            />
            <Field
              label="منطقه زمانی"
              value={form.profile.timezone}
              onChange={(v) =>
                setForm((p) => ({
                  ...p,
                  profile: { ...p.profile, timezone: v },
                }))
              }
              error={showTimezoneError ?? undefined}
              inputProps={{
                placeholder: "Europe/Berlin",
                maxLength: 64,
                onBlur: () => setTouched((t) => ({ ...t, timezone: true })),
              }}
            />
            <Field
              label="نام شخص اضطراری"
              value={form.profile.emergencyName}
              onChange={(v) =>
                setForm((p) => ({
                  ...p,
                  profile: { ...p.profile, emergencyName: v },
                }))
              }
              error={showEmergencyNameError ?? undefined}
              inputProps={{
                maxLength: 120,
                onBlur: () =>
                  setTouched((t) => ({ ...t, emergencyName: true })),
              }}
            />
            <Field
              label="شماره شخص اضطراری"
              value={form.profile.emergencyPhone}
              onChange={(v) =>
                setForm((p) => ({
                  ...p,
                  profile: { ...p.profile, emergencyPhone: v },
                }))
              }
              error={showEmergencyPhoneError ?? undefined}
              inputProps={{
                type: "tel",
                dir: "ltr",
                maxLength: 32,
                inputMode: "tel",
                onBlur: () =>
                  setTouched((t) => ({ ...t, emergencyPhone: true })),
              }}
            />
          </div>

          <div className="mt-4 flex items-center gap-3">
            <input
              id="notifyByEmail"
              type="checkbox"
              checked={form.profile.notifyByEmail}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  profile: { ...p.profile, notifyByEmail: e.target.checked },
                }))
              }
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="notifyByEmail" className="text-sm text-gray-800">
              اعلان ایمیلی
            </label>
          </div>
        </div>

        {/* Placement */}
        <div className="rounded-2xl bg-white p-5 mb-10 shadow-sm shadow-emerald-800 border-r-7 border-r-navbar-secondary mt-6">
          <div className="text-lg font-semibold text-cms-primary mb-4">
            محل فعالیت (شعبه / دپارتمان)
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Branch */}
            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-1 pr-2">
                شعبه
              </label>
              <select
                className="w-full rounded-xl border px-3 py-2 outline-none transition focus:ring-2 border-gray-300 focus:ring-navbar-secondary bg-white"
                value={placement.branchId}
                onChange={(e) => {
                  setPlacement((p) => ({
                    ...p,
                    branchId: e.target.value,
                  }));
                  setTouched((t) => ({ ...t, branch: true }));
                }}
              >
                <option value="">— انتخاب نشده —</option>
                {allBranches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                    {b.city ? ` — ${b.city}` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Department */}
            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-1 pr-2">
                دپارتمان (اختیاری)
              </label>
              <select
                className="w-full rounded-xl border px-3 py-2 outline-none transition focus:ring-2 border-gray-300 focus:ring-navbar-secondary bg-white"
                value={placement.departmentId ?? ""}
                onChange={(e) => {
                  const v = e.target.value || "";
                  setPlacement((p) => ({
                    ...p,
                    departmentId: v ? v : null,
                  }));
                  setTouched((t) => ({ ...t, department: true }));
                }}
              >
                <option value="">— انتخاب نشده —</option>
                {allDepartments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Roles (single) */}
        <div className="rounded-2xl bg-white p-5 mb-10 shadow-sm shadow-emerald-800 border-r-7 border-r-navbar-secondary mt-6">
          <div className="text-lg font-semibold text-cms-primary mb-4">
            نقش کاربری (دسترسی‌ها)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {allRoles.map((r) => (
              <label
                key={r.id}
                className={`flex items-center justify-between gap-2 border rounded-lg px-3 py-2 cursor-pointer transition ${
                  selectedRoleKey === r.key
                    ? "bg-navbar-secondary text-white border-navbar-secondary"
                    : "hover:bg-cms-secondary hover:text-white"
                }`}
              >
                <span>{r.name}</span>
                <input
                  type="radio"
                  name="role"
                  checked={selectedRoleKey === r.key}
                  onChange={() => {
                    setSelectedRoleKey(r.key);
                    if (r.key !== "doctor") {
                      setField("specialtyId", null);
                    }
                  }}
                />
              </label>
            ))}
          </div>
        </div>

        {isDoctorRoleSelected && (
          <div className="rounded-2xl bg-white p-5 mb-10 shadow-sm shadow-emerald-800 border-r-7 border-r-navbar-secondary mt-6">
            <div className="text-lg font-semibold text-cms-primary mb-4">
              تخصص پزشک
            </div>
            <SelectField
              label="تخصص"
              value={form.specialtyId ?? ""}
              onChange={(v) => setField("specialtyId", v)}
              onBlur={() => setTouched((t) => ({ ...t, specialtyId: true }))}
              options={[{ id: "", name: "— انتخاب تخصص —" }, ...allSpecialties]}
              error={showSpecialtyError ?? undefined}
              required
            />
          </div>
        )}

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

        <div className="flex items-center gap-3 mt-2">
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

          <button
            type="button"
            onClick={async () => {
              setError("");
              setSuccess("");
              const ok = confirm(
                "آیا از حذف این کاربر مطمئن هستید؟ این عملیات قابل بازگشت نیست."
              );
              if (!ok) return;
              try {
                const res = await fetch(`/api/admin/users/${userId}`, {
                  method: "DELETE",
                });
                if (!res.ok) {
                  const j = await res.json().catch(() => ({}));
                  throw new Error(
                    j?.message || j?.error || "حذف کاربر ناموفق بود"
                  );
                }
                router.push("/admin/staff-management");
              } catch (e) {
                setError(
                  e instanceof Error ? e.message : "حذف کاربر ناموفق بود"
                );
              }
            }}
            className="w-full md:w-auto px-6 h-11 rounded-xl bg-red-600 text-white font-medium tracking-wide shadow-sm hover:bg-red-700 transition"
          >
            حذف کاربر
          </button>
        </div>
        {success && <Banner kind="success" text={success} />}
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

function SelectField({
  label,
  value,
  onChange,
  onBlur,
  options,
  error,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  options: { id: string; name: string }[];
  error?: string;
  required?: boolean;
}) {
  return (
    <div className="group">
      <label className="block text-sm font-medium text-gray-700 mb-1 pr-2">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </label>
      <select
        className={`w-full rounded-xl border bg-white px-3 py-2 outline-none transition focus:ring-2 ${
          error
            ? "border-red-500 focus:ring-red-300"
            : "border-gray-300 focus:ring-navbar-secondary"
        }`}
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
