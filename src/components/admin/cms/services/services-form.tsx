/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Upload, X } from "lucide-react";
import {
  MultiImageUploader,
  type GalleryItem,
} from "@/components/admin/cms/ui/multi-image-uploader";

// ---- Types ----
type Status = "DRAFT" | "PUBLISHED" | "SCHEDULED" | "ARCHIVED";

export type ServiceDTO = {
  id?: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  body?: { type: "markdown"; content: string } | unknown;
  status: Status;
  publishedAt?: string | null;
  coverId?: string | null;
  tagIds?: string[];
  categoryIds?: string[];
  formFileIds?: string[];
  gallery?: Array<{ mediaId: string; order?: number }>;
};

const BODY_WORD_MAX = 3000;
const COVER_ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const COVER_MAX_SIZE = 6 * 1024 * 1024;

// ---- tiny helpers ----
const p2 = (n: number) => String(n).padStart(2, "0");
const toLocalDT = (iso?: string | null) =>
  iso
    ? (() => {
        const d = new Date(iso);
        return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(
          d.getDate()
        )}T${p2(d.getHours())}:${p2(d.getMinutes())}`;
      })()
    : "";
const fromLocalDT = (v: string) => (v ? new Date(v).toISOString() : null);

// ====== LocalStorage autosave (debounced) ======
function useDraftAutosave<T extends object>(
  key: string,
  state: T,
  setState: (next: T) => void,
  delay = 600
) {
  const [hydrated, setHydrated] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setState(JSON.parse(raw) as T);
    } catch {}
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useEffect(() => {
    if (!hydrated) return;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(state));
      } catch {}
    }, delay) as unknown as number;
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [state, hydrated, key, delay]);
  const clear = useCallback(() => {
    try {
      localStorage.removeItem(key);
    } catch {}
  }, [key]);
  return { hydrated, clear };
}

// ============ FORM ===============
export default function ServiceForm({
  mode,
  id,
}: {
  mode: "new" | "edit";
  id?: string;
}) {
  const router = useRouter();

  // ------ form state ------
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [status, setStatus] = useState<Status>("DRAFT");
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [bodyMd, setBodyMd] = useState("");

  const [coverId, setCoverId] = useState<string>("");
  const [coverUrl, setCoverUrl] = useState<string>("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);

  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [formFileIds, setFormFileIds] = useState<string[]>([]);

  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  // ------ autosave (draft) ------
  const draftKey =
    mode === "edit" && id ? `cms:service:edit:${id}` : `cms:service:new`;

  const currentDraft: ServiceDTO = useMemo(
    () => ({
      title,
      slug,
      excerpt,
      status,
      publishedAt,
      body: { type: "markdown", content: bodyMd },
      coverId: coverId || null,
      tagIds,
      categoryIds,
      formFileIds,
      gallery: gallery.map((g, idx) => ({ mediaId: g.id, order: idx })),
    }),
    [
      title,
      slug,
      excerpt,
      status,
      publishedAt,
      bodyMd,
      coverId,
      tagIds,
      categoryIds,
      formFileIds,
      gallery,
    ]
  );

  const setFromDraft = (d: ServiceDTO) => {
    setTitle(d.title ?? "");
    setSlug(d.slug ?? "");
    setExcerpt((d.excerpt as string) ?? "");
    setStatus((d.status as Status) ?? "DRAFT");
    setPublishedAt(d.publishedAt ?? null);
    const bodyContent =
      typeof (d.body as any)?.content === "string"
        ? (d.body as any).content
        : "";
    setBodyMd(bodyContent);
    setCoverId((d.coverId as string) || "");
    setGallery(
      (d.gallery ?? []).map((x: any) => ({
        id: x.mediaId,
        url: (x.url as string) || "",
        alt: null,
      }))
    );
    setTagIds(d.tagIds ?? []);
    setCategoryIds(d.categoryIds ?? []);
    setFormFileIds(d.formFileIds ?? []);
  };

  const { hydrated, clear: clearDraft } = useDraftAutosave<ServiceDTO>(
    draftKey,
    currentDraft,
    setFromDraft
  );

  // warn on unload when dirty
  const dirty =
    title ||
    slug ||
    excerpt ||
    bodyMd ||
    coverId ||
    gallery.length ||
    tagIds.length ||
    categoryIds.length ||
    formFileIds.length;

  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (!dirty || saving) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty, saving]);

  // ------ load for edit ------
  useEffect(() => {
    if (mode !== "edit" || !id) return;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/cms/services/${id}`, {
          cache: "no-store",
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j?.error || "بارگذاری ناموفق");
        setTitle(j.title ?? "");
        setSlug(j.slug ?? "");
        setExcerpt(j.excerpt ?? "");
        setStatus(j.status ?? "DRAFT");
        setPublishedAt(j.publishedAt ?? null);

        const bodyContent =
          typeof j.body?.content === "string"
            ? j.body.content
            : j.body
            ? JSON.stringify(j.body)
            : "";
        setBodyMd(bodyContent);

        setCoverId(j.cover?.id ?? "");
        setCoverUrl(j.cover?.publicUrl ?? "");

        const g: GalleryItem[] = (j.media ?? []).map((m: any) => ({
          id: m.media.id,
          url: m.media.publicUrl,
          alt: m.media.alt ?? null,
        }));
        setGallery(g);

        setTagIds((j.tags ?? []).map((t: any) => t.tagId));
        setCategoryIds((j.categories ?? []).map((c: any) => c.categoryId));
        setFormFileIds((j.forms ?? []).map((f: any) => f.formFileId));
      } catch (e) {
        setErr(e instanceof Error ? e.message : "خطای نامشخص");
      } finally {
        setLoading(false);
      }
    })();
  }, [mode, id]);

  // ------ cover upload controls ------
  function onPickCover(f: File | null) {
    if (!f) {
      setCoverFile(null);
      if (coverPreview) URL.revokeObjectURL(coverPreview);
      setCoverPreview(null);
      return;
    }
    if (!COVER_ALLOWED.includes(f.type)) {
      setErr("کاور فقط JPG/PNG/WEBP باشد.");
      return;
    }
    if (f.size > COVER_MAX_SIZE) {
      setErr("حجم تصویر نباید بیش از ۶ مگابایت باشد.");
      return;
    }
    setErr(null);
    setOk(null);
    setCoverFile(f);
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverPreview(URL.createObjectURL(f));
  }

  async function uploadCoverNow() {
    if (!coverFile) return;
    setUploadingCover(true);
    setErr(null);
    setOk(null);
    try {
      const fd = new FormData();
      fd.append("file", coverFile);
      const res = await fetch("/api/admin/cms/media/upload", {
        method: "POST",
        body: fd,
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "آپلود ناموفق بود");
      setCoverId(j.id);
      setCoverUrl(j.publicUrl ?? j.url ?? j.asset?.publicUrl ?? "");
      setOk("کاور با موفقیت آپلود شد.");
      setCoverFile(null);
      if (coverPreview) URL.revokeObjectURL(coverPreview);
      setCoverPreview(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "خطا در آپلود تصویر");
    } finally {
      setUploadingCover(false);
    }
  }

  // ------ validations ------
  const bodyWordCount = useMemo(
    () => (bodyMd ? bodyMd.trim().split(/\s+/).filter(Boolean).length : 0),
    [bodyMd]
  );

  const invalid =
    !hydrated ||
    title.trim().length < 2 ||
    slug.trim().length < 2 ||
    !/^[a-z0-9-]+$/.test(slug) ||
    bodyWordCount > BODY_WORD_MAX ||
    (status === "SCHEDULED" && !publishedAt);

  // ------ submit ------
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(null);
    if (invalid) {
      setErr("لطفاً خطاهای فرم را برطرف کنید.");
      return;
    }
    setSaving(true);
    try {
      const payload: Partial<ServiceDTO> = {
        title: title.trim(),
        slug: slug.trim(),
        excerpt: excerpt?.trim() || null,
        status,
        publishedAt: publishedAt || null,
        body: { type: "markdown", content: bodyMd ?? "" },
        coverId: coverId || null,
        tagIds,
        categoryIds,
        formFileIds,
        gallery: gallery.map((g, idx) => ({ mediaId: g.id, order: idx })),
      };

      if (mode === "new") {
        const res = await fetch(`/api/admin/cms/services`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j?.error || "ایجاد خدمت ناموفق بود");
        setOk("خدمت با موفقیت ایجاد شد.");
        clearDraft();
        setTimeout(() => router.push(`/admin/cms/services`), 800);
      } else {
        const res = await fetch(`/api/admin/cms/services/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j?.error || "ذخیره تغییرات ناموفق بود");
        setOk("تغییرات ذخیره شد.");
        setTimeout(() => router.push(`/admin/cms/services`), 800);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "خطای نامشخص");
    } finally {
      setSaving(false);
    }
  }

  // ======= UI =======
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
        {mode === "new" ? "ایجاد خدمت جدید" : "ویرایش خدمت"}
      </h1>

      {/* Top row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="عنوان" value={title} onChange={setTitle} />
        <Field
          label="اسلاگ"
          value={slug}
          onChange={setSlug}
          inputProps={{ dir: "ltr", placeholder: "dialysis" }}
          error={
            slug && !/^[a-z0-9-]+$/.test(slug)
              ? "فقط حروف کوچک، عدد و -"
              : undefined
          }
        />
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field
          label="خلاصه (اختیاری)"
          value={excerpt}
          onChange={setExcerpt}
          inputProps={{ maxLength: 300 }}
        />
        <DateTimePicker
          label="تاریخ/زمان انتشار (اختیاری)"
          value={toLocalDT(publishedAt)}
          onChange={(v) => setPublishedAt(fromLocalDT(v))}
          error={
            status === "SCHEDULED" && !publishedAt
              ? "برای زمان‌بندی، تاریخ/زمان لازم است"
              : undefined
          }
        />
      </div>

      {/* Cover */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 pr-1">
            تصویر کاور (اختیاری)
          </label>
          <div className="aspect-[4/2] w-full overflow-hidden rounded-xl border bg-gray-50">
            {coverPreview || coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverPreview || coverUrl}
                alt="cover"
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
                onChange={(e) => onPickCover(e.target.files?.[0] || null)}
              />
            </label>
            {coverFile && (
              <>
                <button
                  type="button"
                  onClick={uploadCoverNow}
                  disabled={uploadingCover}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-navbar-secondary text-white text-sm disabled:opacity-60"
                >
                  <Upload className="w-4 h-4" />
                  {uploadingCover ? "در حال آپلود..." : "آپلود کاور"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (coverPreview) URL.revokeObjectURL(coverPreview);
                    setCoverFile(null);
                    setCoverPreview(null);
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm hover:bg-gray-50"
                >
                  <X className="w-4 h-4" /> لغو
                </button>
              </>
            )}
            {(coverUrl || coverId) && !coverFile && (
              <button
                type="button"
                onClick={() => {
                  setCoverId("");
                  setCoverUrl("");
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm hover:bg-gray-50"
              >
                حذف کاور
              </button>
            )}
            <div className="text-xs text-gray-500 mt-1">
              فرمت‌های مجاز: JPG, PNG, WEBP — حداکثر ۶ مگابایت
            </div>
          </div>
        </div>

        {/* Gallery */}
        <div>
          <MultiImageUploader
            value={gallery}
            onChange={(items) => setGallery(items)}
            coverId={coverId || undefined}
            onMakeCover={(id) => setCoverId(id)}
            title="گالری تصاویر"
          />
          <div className="text-xs text-gray-500 mt-2">
            نکته: دکمه‌های آپلود داخل این بخش از نوع <code>button</code> هستند و
            فرم را ارسال نمی‌کنند؛ بنابراین صفحه ریفرش نخواهد شد.
          </div>
        </div>
      </div>

      {/* Body */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 pr-1">
          توضیحات خدمت (Markdown)
        </label>
        <textarea
          className={`w-full min-h-[240px] rounded-xl border px-3 py-2 outline-none focus:ring-2 ${
            bodyWordCount > BODY_WORD_MAX
              ? "border-rose-500 focus:ring-rose-200"
              : "focus:ring-navbar-secondary"
          }`}
          value={bodyMd}
          onChange={(e) => setBodyMd(e.target.value)}
          placeholder="## معرفی خدمت..."
        />
        <div
          className={`text-xs mt-1 ${
            bodyWordCount > BODY_WORD_MAX ? "text-rose-600" : "text-gray-500"
          }`}
        >
          {bodyWordCount}/{BODY_WORD_MAX} کلمه
        </div>
      </div>

      {ok && <Banner kind="success" text={ok} />}
      {err && <Banner kind="error" text={err} />}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving || invalid}
          className="px-6 h-11 rounded-xl bg-navbar-secondary text-white font-medium hover:bg-navbar-hover disabled:opacity-60"
        >
          {saving ? "در حال ذخیره…" : mode === "new" ? "ایجاد" : "ذخیره"}
        </button>
        <button
          type="button"
          onClick={() => {
            clearDraft();
            router.push("/admin/cms/services");
          }}
          className="px-6 h-11 rounded-xl border hover:bg-gray-200"
        >
          بازگشت
        </button>
      </div>
    </form>
  );
}

/* ---------- tiny UI bits ---------- */
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
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
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
  function apply() {
    if (!d && !t) onChange("");
    else onChange(`${d}T${t || "00:00"}`);
    setOpen(false);
  }
  return (
    <div className="relative">
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
        {value ? new Date(value).toLocaleString("fa-IR") : "انتخاب تاریخ/زمان"}
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
          {error && <div className="text-xs text-rose-600 mt-1">{error}</div>}
        </div>
      )}
    </div>
  );
}
