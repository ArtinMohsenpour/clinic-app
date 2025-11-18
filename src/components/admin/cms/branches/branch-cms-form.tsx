/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Upload, X } from "lucide-react";
import {
  MultiImageUploader,
  type GalleryItem,
} from "@/components/admin/cms/ui/multi-image-uploader";

type Status = "DRAFT" | "PUBLISHED" | "SCHEDULED" | "ARCHIVED";

type DTO = {
  id?: string;
  branchId: string;
  title?: string | null;
  subtitle?: string | null;
  body?: { type: "markdown"; content: string } | unknown;
  status: Status;
  publishedAt?: string | null;
  heroId?: string | null;
  publicAddress?: string | null;
  phonePrimary?: string | null;
  phoneSecondary?: string | null;
  emailPublic?: string | null;
  mapUrl?: string | null;
  openingHours?: unknown;
  gallery?: Array<{ mediaId: string; order?: number }>;
};

const BODY_WORD_MAX = 3000;
const HERO_ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const HERO_MAX_SIZE = 6 * 1024 * 1024;

function toLocalDT(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(
    d.getHours()
  )}:${p(d.getMinutes())}`;
}
function fromLocalDT(v: string) {
  if (!v) return null;
  const d = new Date(v);
  return d.toISOString();
}

export default function BranchCmsForm({
  mode,
  id,
}: {
  mode: "edit";
  id: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // form state
  const [branchName, setBranchName] = useState<string>("");
  const [branchId, setBranchId] = useState<string>("");

  const [status, setStatus] = useState<Status>("DRAFT");
  const [publishedAt, setPublishedAt] = useState<string | null>(null);

  const [title, setTitle] = useState<string>("");
  const [subtitle, setSubtitle] = useState<string>("");

  const [publicAddress, setPublicAddress] = useState<string>("");
  const [phonePrimary, setPhonePrimary] = useState<string>("");
  const [phoneSecondary, setPhoneSecondary] = useState<string>("");
  const [emailPublic, setEmailPublic] = useState<string>("");
  const [mapUrl, setMapUrl] = useState<string>("");

  const [heroId, setHeroId] = useState<string>("");
  const [heroUrl, setHeroUrl] = useState<string>("");
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [heroPreview, setHeroPreview] = useState<string | null>(null);
  const [uploadingHero, setUploadingHero] = useState(false);

  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [openingHoursJson, setOpeningHoursJson] = useState<string>("");

  const [bodyMd, setBodyMd] = useState<string>("");
  const HOURS_SAMPLE = `[{"day":"Sat","open":"08:00","close":"16:00"}]`;
  const HOURS_EXAMPLE_OBJ = [{ day: "Sat", open: "08:00", close: "16:00" }];

  useEffect(() => {
    if (mode !== "edit" || !id) return;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/cms/branches/${id}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j?.error || "خطا در دریافت محتوا");
        }
        const data = await res.json();

        setBranchId(data.branch?.id ?? "");
        setBranchName(
          [data.branch?.name, data.branch?.city].filter(Boolean).join(" — ")
        );

        setStatus(data.status ?? "DRAFT");
        setPublishedAt(data.publishedAt ?? null);

        setTitle(data.title ?? "");
        setSubtitle(data.subtitle ?? "");

        setPublicAddress(data.publicAddress ?? "");
        setPhonePrimary(data.phonePrimary ?? "");
        setPhoneSecondary(data.phoneSecondary ?? "");
        setEmailPublic(data.emailPublic ?? "");
        setMapUrl(data.mapUrl ?? "");

        setHeroId(data.hero?.id ?? "");
        setHeroUrl(data.hero?.publicUrl ?? "");

        const g: GalleryItem[] = (data.media ?? []).map((m: any) => ({
          id: m.media.id,
          url: m.media.publicUrl,
          alt: m.media.alt ?? null,
        }));
        setGallery(g);

        setOpeningHoursJson(
          data.openingHours ? JSON.stringify(data.openingHours, null, 2) : ""
        );

        const bodyContent =
          typeof data.body?.content === "string"
            ? data.body.content
            : data.body
            ? JSON.stringify(data.body)
            : "";
        setBodyMd(bodyContent);
      } catch (e) {
        setError(e instanceof Error ? e.message : "خطای نامشخص");
      } finally {
        setLoading(false);
      }
    })();
  }, [mode, id]);

  const bodyWordCount = useMemo(
    () => (bodyMd ? bodyMd.trim().split(/\s+/).filter(Boolean).length : 0),
    [bodyMd]
  );

  const bad =
    (status === "SCHEDULED" && !publishedAt) ||
    bodyWordCount > BODY_WORD_MAX ||
    (!!emailPublic && !/^\S+@\S+\.\S+$/.test(emailPublic)) ||
    (!!mapUrl && !/^https?:\/\//i.test(mapUrl));

  function onPickHero(f: File | null) {
    if (!f) {
      setHeroFile(null);
      if (heroPreview) URL.revokeObjectURL(heroPreview);
      setHeroPreview(null);
      return;
    }
    if (!HERO_ALLOWED.includes(f.type)) {
      setError("کاور فقط JPG/PNG/WEBP باشد.");
      return;
    }
    if (f.size > HERO_MAX_SIZE) {
      setError("حجم تصویر نباید بیش از ۶ مگابایت باشد.");
      return;
    }
    setError(null);
    setSuccess(null);
    setHeroFile(f);
    if (heroPreview) URL.revokeObjectURL(heroPreview);
    setHeroPreview(URL.createObjectURL(f));
  }

  async function uploadHeroNow() {
    if (!heroFile) return;
    setUploadingHero(true);
    setError(null);
    setSuccess(null);
    try {
      const fd = new FormData();
      fd.append("file", heroFile);
      const res = await fetch("/api/admin/cms/media/upload", {
        method: "POST",
        body: fd,
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "آپلود ناموفق بود");
      setHeroId(j.id);
      setHeroUrl(j.url);
      setSuccess("تصویر قهرمان با موفقیت آپلود شد.");
      setHeroFile(null);
      if (heroPreview) URL.revokeObjectURL(heroPreview);
      setHeroPreview(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا در آپلود تصویر");
    } finally {
      setUploadingHero(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (bad) {
      setError("لطفاً خطاهای فرم را برطرف کنید.");
      return;
    }
    setSaving(true);
    try {
      let openingHours: any = null;
      if (openingHoursJson.trim()) {
        try {
          openingHours = JSON.parse(openingHoursJson);
        } catch {
          throw new Error("ساختار ساعات کاری (JSON) معتبر نیست.");
        }
      }

      const payload: Partial<DTO> = {
        status,
        publishedAt: publishedAt || null,
        title: title?.trim() || null,
        subtitle: subtitle?.trim() || null,
        body: { type: "markdown", content: bodyMd ?? "" },
        publicAddress: publicAddress?.trim() || null,
        phonePrimary: phonePrimary?.trim() || null,
        phoneSecondary: phoneSecondary?.trim() || null,
        emailPublic: emailPublic?.trim() || null,
        mapUrl: mapUrl?.trim() || null,
        openingHours,
        heroId: heroId || null,
        gallery: gallery.map((g, idx) => ({ mediaId: g.id, order: idx })),
      };

      const res = await fetch(`/api/admin/cms/branches/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "ذخیره تغییرات ناموفق بود");
      setSuccess("تغییرات ذخیره شد");
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطای نامشخص");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 rounded-2xl bg-white shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-40 bg-gray-200 rounded" />
          <div className="h-10 w-full bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      dir="rtl"
      className="p-6 pb-12 bg-gradient-to-b from-white to-gray-50 rounded-2xl shadow-md ring-1 ring-gray-100 space-y-6 select-none"
    >
      <h1 className="text-2xl md:text-3xl font-extrabold text-navbar-primary">
        ویرایش محتوای شعبه
      </h1>

      <div className="rounded-2xl p-5 shadow-md border-r-7 border-r-navbar-secondary border border-cms-secondary space-y-6">
        {/* Branch & status row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ReadOnlyField label="شعبه" value={branchName || "—"} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 pr-1">
              وضعیت
            </label>
            <select
              className="w-full rounded-xl border px-3 py-2 focus:ring-2 focus:ring-navbar-secondary bg-white"
              value={status}
              onChange={(e) => setStatus(e.target.value as Status)}
            >
              <option value="DRAFT">پیش‌نویس</option>
              <option value="PUBLISHED">منتشرشده</option>
              <option value="SCHEDULED">زمان‌بندی‌شده</option>
              <option value="ARCHIVED">بایگانی</option>
            </select>
          </div>
          <DateTimePicker
            label="تاریخ/زمان انتشار (اختیاری)"
            value={toLocalDT(publishedAt)}
            onChange={(v) => setPublishedAt(fromLocalDT(v))}
            hint="برای زمان‌بندی، مقدار را پر کنید"
            error={
              status === "SCHEDULED" && !publishedAt
                ? "برای زمان‌بندی، تاریخ/زمان لازم است"
                : undefined
            }
          />
        </div>

        {/* Title / Subtitle */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="عنوان صفحه (اختیاری)"
            value={title}
            onChange={setTitle}
            inputProps={{ maxLength: 160 }}
            hint="H1 صفحه شعبه"
          />
          <Field
            label="زیرعنوان (اختیاری)"
            value={subtitle}
            onChange={setSubtitle}
            inputProps={{ maxLength: 240 }}
          />
        </div>

        {/* Hero image */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 pr-1">
              تصویر هِرو (اختیاری)
            </label>
            <div className="aspect-[4/2] w-full overflow-hidden rounded-xl border bg-gray-50">
              {heroPreview || heroUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={heroPreview || heroUrl}
                  alt="hero"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full grid place-items-center text-gray-400 text-sm">
                  بدون تصویر
                </div>
              )}
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2">
              <label className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer hover:bg-gray-50">
                <ImagePlus className="w-4 h-4" /> انتخاب تصویر
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => onPickHero(e.target.files?.[0] || null)}
                />
              </label>
              {heroFile && (
                <>
                  <button
                    type="button"
                    onClick={uploadHeroNow}
                    disabled={uploadingHero}
                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-navbar-secondary text-white text-sm disabled:opacity-60"
                  >
                    <Upload className="w-4 h-4" />
                    {uploadingHero ? "در حال آپلود..." : "آپلود هِرو"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (heroPreview) URL.revokeObjectURL(heroPreview);
                      setHeroFile(null);
                      setHeroPreview(null);
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm hover:bg-gray-50"
                  >
                    <X className="w-4 h-4" /> لغو
                  </button>
                </>
              )}
              {(heroUrl || heroId) && !heroFile && (
                <button
                  type="button"
                  onClick={() => {
                    setHeroId("");
                    setHeroUrl("");
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm hover:bg-gray-50"
                >
                  حذف هِرو
                </button>
              )}
              <div className="text-xs text-gray-500 mt-1">
                فرمت‌های مجاز: JPG, PNG, WEBP — حداکثر ۶ مگابایت
              </div>
              <div className="text-xs text-gray-500 mt-1">
                یا از گالری پایین روی «انتخاب به‌عنوان هِرو» بزنید.
              </div>
            </div>
          </div>

          {/* Contact / public info */}
          <div className="grid grid-cols-1 gap-4">
            <Field
              label="آدرس نمایش عمومی"
              value={publicAddress}
              onChange={setPublicAddress}
            />
            <Field
              label="تلفن ۱"
              value={phonePrimary}
              onChange={setPhonePrimary}
              inputProps={{ dir: "ltr" }}
            />
            <Field
              label="تلفن ۲ (اختیاری)"
              value={phoneSecondary}
              onChange={setPhoneSecondary}
              inputProps={{ dir: "ltr" }}
            />
            <Field
              label="ایمیل عمومی (اختیاری)"
              value={emailPublic}
              onChange={setEmailPublic}
              inputProps={{ dir: "ltr", type: "email" }}
              error={
                emailPublic && !/^\S+@\S+\.\S+$/.test(emailPublic)
                  ? "ایمیل نامعتبر است"
                  : undefined
              }
            />
            <Field
              label="لینک نقشه (اختیاری)"
              value={mapUrl}
              onChange={setMapUrl}
              inputProps={{ dir: "ltr", placeholder: "https://..." }}
              error={
                mapUrl && !/^https?:\/\//i.test(mapUrl)
                  ? "URL نامعتبر است"
                  : undefined
              }
            />
          </div>
        </div>

        {/* Gallery */}
        <MultiImageUploader
          value={gallery}
          onChange={(items) => setGallery(items)}
          coverId={heroId || undefined}
          onMakeCover={(id) => setHeroId(id)}
          title="گالری تصاویر (اختیاری)"
        />

        {/* Opening hours JSON */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 pr-1">
            ساعات کاری (JSON اختیاری)
          </label>
          <textarea
            className="w-full min-h-[120px] rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-navbar-secondary ltr-input"
            value={openingHoursJson}
            onChange={(e) => setOpeningHoursJson(e.target.value)}
            placeholder={HOURS_SAMPLE}
          />
          <div className="text-xs text-gray-500 mt-1">
            مثال:{" "}
            <code dir="ltr" className="px-1 py-0.5 rounded bg-gray-100">
              {JSON.stringify(HOURS_EXAMPLE_OBJ)}
            </code>
          </div>
        </div>

        {/* Body */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 pr-1">
            متن صفحه شعبه (Markdown ساده)
          </label>
          <textarea
            className={`w-full min-h-[260px] rounded-xl border px-3 py-2 outline-none focus:ring-2 ${
              bodyWordCount > BODY_WORD_MAX
                ? "border-rose-500 focus:ring-rose-200"
                : "focus:ring-navbar-secondary"
            }`}
            value={bodyMd}
            onChange={(e) => setBodyMd(e.target.value)}
            placeholder="## خوش آمدید به شعبه ..."
          />
          <div
            className={`text-xs mt-1 ${
              bodyWordCount > BODY_WORD_MAX ? "text-rose-600" : "text-gray-500"
            }`}
          >
            {bodyWordCount}/{BODY_WORD_MAX} کلمه
          </div>
        </div>
      </div>

      {success && <Banner kind="success" text={success} />}
      {error && <Banner kind="error" text={error} />}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving || bad}
          className="px-6 h-11 rounded-xl bg-navbar-secondary text-white font-medium hover:bg-navbar-hover disabled:opacity-60"
        >
          {saving ? "در حال ذخیره…" : "ذخیره"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/cms/branches")}
          className="px-6 h-11 rounded-xl border hover:bg-gray-200"
        >
          بازگشت
        </button>
      </div>
    </form>
  );
}

/* ---------- Tiny inputs ---------- */

function Field({
  label,
  value,
  onChange,
  inputProps,
  hint,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  hint?: string;
  error?: string;
}) {
  const isLtr =
    inputProps?.dir === "ltr" ||
    ["email", "password", "tel", "url", "datetime-local"].includes(
      inputProps?.type || ""
    );
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
        {...(inputProps as any)}
      />
      <div className="flex items-center justify-between">
        {hint && <div className="text-xs text-gray-500 mt-1">{hint}</div>}
      </div>
      {error && <div className="text-xs text-rose-600 mt-1">{error}</div>}
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1 pr-1">
        {label}
      </label>
      <div className="w-full rounded-xl border px-3 py-2 bg-gray-50 text-gray-700">
        {value}
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

function DateTimePicker({
  label,
  value,
  onChange,
  hint,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [dateStr, timeStr] = (value || "").split("T").concat("") as [
    string,
    string
  ];
  const [d, setD] = useState(dateStr || "");
  const [t, setT] = useState(timeStr || "");
  useEffect(() => {
    const [dd, tt] = (value || "").split("T").concat("") as [string, string];
    setD(dd || "");
    setT(tt || "");
  }, [value]);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (!open) return;
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  function apply() {
    if (!d && !t) {
      onChange("");
    } else {
      onChange(`${d}T${t || "00:00"}`);
    }
    setOpen(false);
  }
  return (
    <div className="relative" ref={ref}>
      <label className="block text-sm font-medium text-gray-700 mb-1 pr-1">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full rounded-xl border px-3 py-2 text-right transition focus:ring-2 ${
          error
            ? "border-rose-500 focus:ring-rose-200"
            : "border-gray-300 focus:ring-navbar-secondary"
        }`}
      >
        {value
          ? new Date(value).toLocaleString("fa-IR")
          : "انتخاب تاریخ و زمان"}
      </button>
      {open && (
        <div className="absolute z-50 mt-2 w-[min(360px,95vw)] rounded-xl border bg-white shadow-xl p-3 right-0">
          <div className="flex items-center gap-2">
            <input
              type="date"
              className="w-full rounded-lg border px-2 py-2 focus:ring-2 focus:ring-navbar-secondary"
              value={d}
              onChange={(e) => setD(e.target.value)}
            />
            <input
              type="time"
              className="w-full rounded-lg border px-2 py-2 focus:ring-2 focus:ring-navbar-secondary"
              value={t}
              onChange={(e) => setT(e.target.value)}
            />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg border hover:bg-gray-50"
              onClick={() => {
                setD("");
                setT("");
                onChange("");
                setOpen(false);
              }}
            >
              پاک کردن
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg border hover:bg-gray-50"
                onClick={() => setOpen(false)}
              >
                بستن
              </button>
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg bg-navbar-secondary text-white hover:bg-navbar-hover"
                onClick={apply}
              >
                تایید
              </button>
            </div>
          </div>
          {hint && <div className="text-xs text-gray-500 mt-2">{hint}</div>}
          {error && <div className="text-xs text-rose-600 mt-1">{error}</div>}
        </div>
      )}
    </div>
  );
}
