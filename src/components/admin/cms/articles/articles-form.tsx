/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Home,
  ImagePlus,
  Upload,
  X,
  ArrowRight,
} from "lucide-react";

type Status = "DRAFT" | "PUBLISHED" | "SCHEDULED" | "ARCHIVED";

export type ArticleDTO = {
  id?: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  body: { type: "markdown"; content: string } | unknown;
  status: Status;
  publishedAt?: string | null; // ISO
  coverId?: string | null;
  tagIds?: string[];
  categoryIds?: string[];
  gallery?: Array<{ mediaId: string; order?: number }>;
};

function slugify(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// ---- datetime helpers ----
function toLocalDTInputValue(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}
function fromLocalDTInputValue(v: string) {
  if (!v) return null;
  const d = new Date(v);
  return d.toISOString();
}

// ---- limits (adjust as you like) ----
const TITLE_MAX = 120;
const EXCERPT_MAX = 300;
const SLUG_MAX = 200;
const BODY_WORD_MAX = 3000;

const COVER_ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const COVER_MAX_SIZE = 4 * 1024 * 1024;

export default function ArticleForm({
  mode,
  articleId,
  initial,
}: {
  mode: "create" | "edit";
  articleId?: string;
  initial?: Partial<ArticleDTO>;
}) {
  const router = useRouter();

  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [status, setStatus] = useState<Status>(initial?.status ?? "DRAFT");
  const [publishedAt, setPublishedAt] = useState<string | null>(
    (initial?.publishedAt as string | null) ?? null
  );

  // Markdown-as-JSON
  const [bodyMd, setBodyMd] = useState(
    (typeof (initial?.body as any)?.content === "string"
      ? (initial?.body as any)?.content
      : "") ?? ""
  );

  // ---- cover state ----
  const [coverId, setCoverId] = useState<string>(initial?.coverId ?? "");
  const [coverUrl, setCoverUrl] = useState<string>("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);

  // load when editing
  useEffect(() => {
    if (mode !== "edit" || !articleId) return;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/cms/articles/${articleId}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("خطا در دریافت مقاله");
        const a = await res.json();
        setTitle(a.title ?? "");
        setSlug(a.slug ?? "");
        setExcerpt(a.excerpt ?? "");
        setStatus(a.status ?? "DRAFT");
        setPublishedAt(a.publishedAt ?? null);
        setCoverId(a.coverId ?? "");
        setCoverUrl(a.cover?.publicUrl ?? "");
        setBodyMd(
          typeof a.body?.content === "string"
            ? a.body.content
            : a.body
            ? JSON.stringify(a.body)
            : ""
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "خطای نامشخص");
      } finally {
        setLoading(false);
      }
    })();
  }, [mode, articleId]);

  // auto slug
  function handleTitleBlur() {
    if (!slug.trim()) setSlug(slugify(title));
  }

  // word count
  const bodyWordCount = useMemo(
    () => (bodyMd ? bodyMd.trim().split(/\s+/).filter(Boolean).length : 0),
    [bodyMd]
  );

  // validation
  const bad =
    title.trim().length < 2 ||
    title.length > TITLE_MAX ||
    slug.trim().length < 2 ||
    slug.length > SLUG_MAX ||
    !/^[a-z0-9-]+$/.test(slug.trim()) ||
    (excerpt ?? "").length > EXCERPT_MAX ||
    (status === "SCHEDULED" && !publishedAt) ||
    bodyWordCount > BODY_WORD_MAX;

  // ---- cover upload ----
  function onPickCover(f: File | null) {
    if (!f) {
      setCoverFile(null);
      if (coverPreview) URL.revokeObjectURL(coverPreview);
      setCoverPreview(null);
      return;
    }
    if (!COVER_ALLOWED.includes(f.type)) {
      setError("فقط JPG/PNG/WEBP مجاز است.");
      return;
    }
    if (f.size > COVER_MAX_SIZE) {
      setError("حجم فایل نباید بیش از ۴ مگابایت باشد.");
      return;
    }
    setError(null);
    setSuccess(null);
    setCoverFile(f);
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverPreview(URL.createObjectURL(f));
  }

  async function uploadCoverNow() {
    if (!coverFile) return;
    setUploadingCover(true);
    setError(null);
    setSuccess(null);
    try {
      const fd = new FormData();
      fd.append("file", coverFile);
      const res = await fetch("/api/admin/cms/media/upload", {
        method: "POST",
        body: fd,
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "آپلود تصویر ناموفق بود");
      setCoverId(j.id);
      setCoverUrl(j.url);
      setSuccess("کاور با موفقیت آپلود شد.");
      setCoverFile(null);
      if (coverPreview) URL.revokeObjectURL(coverPreview);
      setCoverPreview(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا در آپلود تصویر");
    } finally {
      setUploadingCover(false);
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
      const payload: Partial<ArticleDTO> = {
        title: title.trim(),
        slug: slug.trim(),
        excerpt: excerpt?.trim() || null,
        body: { type: "markdown", content: bodyMd ?? "" },
        status,
        publishedAt: publishedAt || null,
        coverId: coverId?.trim() || null,
        tagIds: [],
        categoryIds: [],
        gallery: [],
      };

      if (mode === "create") {
        const res = await fetch("/api/admin/cms/articles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j?.error || "ثبت مقاله ناموفق بود");
        setSuccess("مقاله ایجاد شد");
        router.push(`/admin/cms/articles/${j.id}`);
      } else {
        const res = await fetch(`/api/admin/cms/articles/${articleId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j?.error || "ویرایش مقاله ناموفق بود");
        setSuccess("تغییرات ذخیره شد");
      }
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
        {mode === "create" ? "ایجاد مقاله" : "ویرایش مقاله"}
      </h1>

      <div className="rounded-2xl p-5 shadow-md border-r-7 border-r-navbar-secondary border border-cms-secondary">
        {/* header with cover + fields */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* cover panel — bigger + stacked buttons */}
          <div className="w-full max-w-xs">
            <div className="aspect-[4/3] w-full overflow-hidden rounded-xl border bg-gray-50">
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
                <ImagePlus className="w-4 h-4" />
                انتخاب تصویر
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
                    {uploadingCover ? "در حال آپلود..." : "آپلود"}
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
                    <X className="w-4 h-4" />
                    لغو
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
                فرمت‌های مجاز: JPG, PNG, WEBP — حداکثر ۴ مگابایت
              </div>
            </div>
          </div>

          {/* fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
            <Field
              label="عنوان"
              value={title}
              onChange={(v) => setTitle(v.slice(0, TITLE_MAX))}
              onBlur={handleTitleBlur}
              required
              counter={`${title.length}/${TITLE_MAX}`}
              error={
                title.length > TITLE_MAX ? "طول عنوان زیاد است" : undefined
              }
            />
            <Field
              label="اسلاگ (slug)"
              value={slug}
              onChange={(v) => setSlug(slugify(v).slice(0, SLUG_MAX))}
              required
              hint="فقط حروف کوچک انگلیسی، عدد و خط تیره"
              inputProps={{ dir: "ltr", maxLength: SLUG_MAX }}
              error={
                slug && !/^[a-z0-9-]+$/.test(slug)
                  ? "اسلاگ نامعتبر است"
                  : undefined
              }
              counter={`${slug.length}/${SLUG_MAX}`}
            />

            <Field
              label="چکیده (اختیاری)"
              value={excerpt ?? ""}
              onChange={(v) => setExcerpt(v.slice(0, EXCERPT_MAX))}
              inputProps={{ maxLength: EXCERPT_MAX }}
              counter={`${(excerpt ?? "").length}/${EXCERPT_MAX}`}
              error={
                (excerpt ?? "").length > EXCERPT_MAX
                  ? "متن چکیده طولانی است"
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

            <DateTimePicker
              label="تاریخ/زمان انتشار (اختیاری)"
              value={toLocalDTInputValue(publishedAt)}
              onChange={(v) => setPublishedAt(fromLocalDTInputValue(v))}
              hint="برای زمان‌بندی، مقدار را پر کنید"
              error={
                status === "SCHEDULED" && !publishedAt
                  ? "برای زمان‌بندی، تاریخ/زمان لازم است"
                  : undefined
              }
            />

            {/* coverId debug/hidden if you want — I keep visible but subtle */}
            <Field
              label="شناسه کاور (coverId)"
              value={coverId}
              onChange={setCoverId}
              inputProps={{ dir: "ltr", placeholder: "UUID" }}
              hint="پس از آپلود به‌طور خودکار پر می‌شود"
            />
          </div>
        </div>

        {/* body editor */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-1 pr-1">
            متن مقاله (Markdown ساده)
          </label>
          <textarea
            className={`w-full min-h-[280px] rounded-xl border px-3 py-2 outline-none focus:ring-2 ${
              bodyWordCount > BODY_WORD_MAX
                ? "border-rose-500 focus:ring-rose-200"
                : "focus:ring-navbar-secondary"
            }`}
            value={bodyMd}
            onChange={(e) => setBodyMd(e.target.value)}
            placeholder="## عنوان بخش..."
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
          className="px-6 h-11 rounded-xl bg-navbar-secondary text-white font-medium hover:bg-navbar-hover disabled:opacity-60 cursor-pointer"
        >
          {saving ? "در حال ذخیره…" : mode === "create" ? "ایجاد" : "ذخیره"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/cms/articles")}
          className="px-6 h-11 rounded-xl border hover:bg-gray-200  cursor-pointer"
        >
          بازگشت
        </button>
      </div>
    </form>
  );
}

/* ——— DateTime picker (dropdown) ——— */
function DateTimePicker({
  label,
  value,
  onChange,
  hint,
  error,
}: {
  label: string;
  value: string; // "YYYY-MM-DDTHH:MM" or ""
  onChange: (v: string) => void;
  hint?: string;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = value || "";
  const [datePart, timePart] = current ? current.split("T") : ["", ""];
  const [dateStr, setDateStr] = useState(datePart || "");
  const [timeStr, setTimeStr] = useState(timePart || "");

  useEffect(() => {
    setDateStr(datePart || "");
    setTimeStr(timePart || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!open) return;
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  function apply() {
    if (!dateStr && !timeStr) {
      onChange("");
    } else {
      const t = timeStr || "00:00";
      onChange(`${dateStr}T${t}`);
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
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
            />
            <input
              type="time"
              className="w-full rounded-lg border px-2 py-2 focus:ring-2 focus:ring-navbar-secondary"
              value={timeStr}
              onChange={(e) => setTimeStr(e.target.value)}
            />
          </div>

          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg border hover:bg-gray-50"
              onClick={() => {
                setDateStr("");
                setTimeStr("");
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

/* — UI bits — */
function Field({
  label,
  value,
  onChange,
  inputProps,
  hint,
  error,
  required,
  onBlur,
  counter,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  hint?: string;
  error?: string;
  required?: boolean;
  onBlur?: () => void;
  counter?: string;
}) {
  const isLtr =
    inputProps?.dir === "ltr" ||
    ["email", "password", "tel", "url", "datetime-local"].includes(
      inputProps?.type || ""
    );
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1 pr-1">
        {label} {required ? <span className="text-red-500">*</span> : null}
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
        onBlur={onBlur}
        {...(inputProps as any)}
      />
      <div className="flex items-center justify-between">
        {hint && <div className="text-xs text-gray-500 mt-1">{hint}</div>}
        {counter && <div className="text-xs text-gray-400 mt-1">{counter}</div>}
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
