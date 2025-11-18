/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Upload, X } from "lucide-react";

// --- Main Component & Types ---

type Status = "DRAFT" | "PUBLISHED" | "SCHEDULED" | "ARCHIVED";
type SlideType = "CUSTOM" | "NEWS";

type NewsOption = { id: string; title: string };
type FullNews = {
  id: string;
  title: string;
  excerpt: string | null;
  slug: string;
  coverId: string | null;
  cover: { publicUrl: string | null } | null;
};

export default function HeroSlideForm({
  mode,
  slideId,
}: {
  mode: "create" | "edit";
  slideId?: string;
}) {
  const router = useRouter();

  // Data state
  const [newsOptions, setNewsOptions] = useState<NewsOption[]>([]);

  // Form state
  const [slideType, setSlideType] = useState<SlideType>("CUSTOM");
  const [sourceNewsId, setSourceNewsId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [callToActionText, setCallToActionText] = useState("بیشتر بخوانید");
  const [callToActionUrl, setCallToActionUrl] = useState("");
  const [status, setStatus] = useState<Status>("DRAFT");
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [order, setOrder] = useState(0);

  // Image state
  const [imageId, setImageId] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // UI state
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial data for edit mode and news options
  useEffect(() => {
    async function loadNewsOptions() {
      try {
        const res = await fetch("/api/admin/cms/news/options");
        if (res.ok) {
          const data = await res.json();
          setNewsOptions(data);
        }
      } catch {
        // Silently fail, user can still create custom slides
      }
    }
    loadNewsOptions();

    if (mode === "edit" && slideId) {
      setLoading(true);
      fetch(`/api/admin/cms/hero/${slideId}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch slide data");
          return res.json();
        })
        .then((data) => {
          setTitle(data.title);
          setDescription(data.description ?? "");
          setCallToActionText(data.callToActionText ?? "بیشتر بخوانید");
          setCallToActionUrl(data.callToActionUrl ?? "");
          setStatus(data.status);
          setPublishedAt(data.publishedAt);
          setOrder(data.order);
          setImageId(data.imageId);
          setImageUrl(data.image?.publicUrl ?? "");
          setSourceNewsId(data.sourceNewsId);
          if (data.sourceNewsId) {
            setSlideType("NEWS");
          }
        })
        .catch(() => setError("خطا در دریافت اطلاعات اسلاید"))
        .finally(() => setLoading(false));
    }
  }, [mode, slideId]);

  // Effect to auto-fill form when a news article is selected
  useEffect(() => {
    if (slideType === "NEWS" && sourceNewsId) {
      // Fetch full news details to get image and slug
      fetch(`/api/admin/cms/news/${sourceNewsId}`)
        .then((res) => res.json())
        .then((data: FullNews) => {
          setTitle(data.title);
          setDescription(data.excerpt ?? "");
          setCallToActionUrl(`/news/${data.slug}`); // Assuming this is the public URL structure
          setImageId(data.coverId);
          setImageUrl(data.cover?.publicUrl ?? "");
        });
    }
  }, [slideType, sourceNewsId]);

  async function onPickImage(f: File | null) {
    if (!f) return;
    setImageFile(f);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(URL.createObjectURL(f));
  }

  async function uploadImage() {
    if (!imageFile) return;
    setUploadingImage(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", imageFile);
    try {
      const res = await fetch("/api/admin/cms/media/upload", {
        method: "POST",
        body: fd,
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      setImageId(j.id);
      setImageUrl(j.url);
      setImageFile(null);
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "آپلود ناموفق بود");
    } finally {
      setUploadingImage(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("عنوان اسلاید اجباری است.");
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      title,
      description,
      callToActionText,
      callToActionUrl,
      status,
      publishedAt,
      order,
      imageId,
      sourceNewsId: slideType === "NEWS" ? sourceNewsId : null,
    };

    const url =
      mode === "create"
        ? "/api/admin/cms/hero"
        : `/api/admin/cms/hero/${slideId}`;
    const method = mode === "create" ? "POST" : "PATCH";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "خطا در ذخیره‌سازی");

      router.push("/admin/cms/hero");
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا در ذخیره‌سازی");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 rounded-2xl bg-white shadow-sm">
        در حال بارگذاری...
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      dir="rtl"
      className="p-6 bg-white rounded-2xl shadow-md space-y-6"
    >
      <h1 className="text-2xl font-bold">
        {mode === "create" ? "ایجاد اسلاید جدید" : "ویرایش اسلاید"}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">نوع اسلاید</label>
            <select
              value={slideType}
              onChange={(e) => setSlideType(e.target.value as SlideType)}
              className="w-full rounded-xl border p-2 bg-white"
            >
              <option value="CUSTOM">سفارشی / رویداد</option>
              <option value="NEWS">برگرفته از اخبار</option>
            </select>
          </div>

          {slideType === "NEWS" && (
            <div>
              <label className="block text-sm font-medium mb-1">
                انتخاب خبر
              </label>
              <select
                value={sourceNewsId ?? ""}
                onChange={(e) => setSourceNewsId(e.target.value)}
                className="w-full rounded-xl border p-2 bg-white"
              >
                <option value="" disabled>
                  یک خبر را انتخاب کنید...
                </option>
                {newsOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Field
            label="عنوان اسلاید"
            value={title}
            onChange={setTitle}
            required
            disabled={slideType === "NEWS"}
          />
          <Field
            label="توضیحات"
            value={description}
            onChange={setDescription}
            isTextArea
            disabled={slideType === "NEWS"}
          />
          <Field
            label="متن دکمه"
            value={callToActionText}
            onChange={setCallToActionText}
          />
          <Field
            label="URL دکمه"
            value={callToActionUrl}
            onChange={setCallToActionUrl}
            inputProps={{ dir: "ltr" }}
            disabled={slideType === "NEWS"}
          />
        </div>

        <div className="space-y-4">
          <div className="w-full">
            <div className="aspect-video w-full overflow-hidden rounded-xl border bg-gray-50">
              {imagePreview || imageUrl ? (
                <img
                  src={imagePreview || imageUrl}
                  alt="cover"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="grid place-items-center h-full text-gray-400">
                  بدون تصویر
                </div>
              )}
            </div>
            <div className="mt-2 grid grid-cols-1 gap-2">
              <label className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border cursor-pointer hover:bg-gray-50">
                <ImagePlus className="w-4 h-4" /> انتخاب تصویر
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onPickImage(e.target.files?.[0] || null)}
                  disabled={slideType === "NEWS"}
                />
              </label>
              {imageFile && (
                <button
                  type="button"
                  onClick={uploadImage}
                  disabled={uploadingImage}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-navbar-secondary text-white"
                >
                  <Upload className="w-4 h-4" />{" "}
                  {uploadingImage ? "در حال آپلود..." : "آپلود"}
                </button>
              )}
            </div>
          </div>
          <hr />
          <div>
            <label className="block text-sm font-medium mb-1">وضعیت</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Status)}
              className="w-full rounded-xl border p-2 bg-white"
            >
              <option value="DRAFT">پیش‌نویس</option>
              <option value="PUBLISHED">منتشرشده</option>
              <option value="SCHEDULED">زمان‌بندی‌شده</option>
              <option value="ARCHIVED">بایگانی</option>
            </select>
          </div>
          <DateTimePicker
            label="تاریخ انتشار"
            value={publishedAt}
            onChange={setPublishedAt}
          />
        </div>
      </div>

      {error && <Banner kind="error" text={error} />}

      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          disabled={saving}
          className="px-6 h-11 rounded-xl bg-navbar-secondary text-white disabled:opacity-60"
        >
          {saving ? "در حال ذخیره..." : "ذخیره"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 h-11 rounded-xl border hover:bg-gray-50"
        >
          بازگشت
        </button>
      </div>
    </form>
  );
}

// --- Helper Components & Functions ---

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
  return new Date(v).toISOString();
}

function DateTimePicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const localValue = toLocalDTInputValue(value);
  const [datePart, timePart] = localValue ? localValue.split("T") : ["", ""];

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (open && ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <label className="block text-sm font-medium text-gray-700 mb-1 pr-1">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full rounded-xl border px-3 py-2 text-right transition focus:ring-2 border-gray-300 focus:ring-navbar-secondary"
      >
        {value
          ? new Date(value).toLocaleString("fa-IR")
          : "انتخاب تاریخ و زمان"}
      </button>
      {open && (
        <div className="absolute z-10 mt-2 w-full rounded-xl border bg-white shadow-xl p-3 right-0">
          <input
            type="datetime-local"
            defaultValue={localValue}
            onChange={(e) => onChange(fromLocalDTInputValue(e.target.value))}
            className="w-full rounded-lg border px-2 py-2 focus:ring-2 focus:ring-navbar-secondary"
          />
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  inputProps,
  isTextArea,
  required,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement> &
    React.TextareaHTMLAttributes<HTMLTextAreaElement>;
  isTextArea?: boolean;
  required?: boolean;
  disabled?: boolean;
}) {
  const commonProps = {
    className: `w-full rounded-xl border px-3 py-2 outline-none transition focus:ring-2 focus:ring-navbar-secondary disabled:bg-gray-100`,
    value,
    onChange: (e: any) => onChange(e.target.value),
    required,
    disabled,
    ...inputProps,
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1 pr-1">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </label>
      {isTextArea ? (
        <textarea {...commonProps} rows={4} />
      ) : (
        <input {...commonProps} />
      )}
    </div>
  );
}

function Banner({ kind, text }: { kind: "error" | "success"; text: string }) {
  const cls =
    kind === "error"
      ? "bg-red-50 text-red-700 ring-1 ring-red-100"
      : "bg-green-50 text-green-700 ring-1 ring-green-100";
  return <div className={`${cls} p-3 rounded-xl text-center`}>{text}</div>;
}
