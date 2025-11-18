/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FilePlus2,
  Trash2,
  ArrowUp,
  ArrowDown,
  FileText as FileIcon,
} from "lucide-react";

type Status = "DRAFT" | "PUBLISHED" | "SCHEDULED" | "ARCHIVED";
type Kind = "ADMISSION" | "CONSENT" | "PRE_VISIT" | "INSURANCE" | "OTHER";

type AttachmentItem = {
  id: string;
  url: string | null;
  name?: string | null;
  mime?: string | null;
  role?: "ATTACHMENT" | "IMAGE";
};

type DTO = {
  id?: string;
  title: string;
  slug: string;
  description?: string | null;
  kind?: Kind | null;
  language?: string | null;
  status: Status;
  publishedAt?: string | null;

  primaryFileId?: string | null;

  tagIds?: string[];
  categoryIds?: string[];
  assets?: Array<{
    mediaId: string;
    order?: number;
    role?: "ATTACHMENT" | "IMAGE";
  }>;
};

function slugify(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const TITLE_MAX = 160;
const SLUG_MAX = 200;
const DESC_MAX = 600;

const FILE_ALLOWED = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
];
const FILE_MAX_SIZE = 24 * 1024 * 1024; // 24MB

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

export default function FormFileForm({
  mode,
  formId,
  initial,
}: {
  mode: "create" | "edit";
  formId?: string;
  initial?: Partial<DTO>;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [kind, setKind] = useState<Kind | "">((initial?.kind as Kind) ?? "");
  const [language, setLanguage] = useState(initial?.language ?? "");
  const [status, setStatus] = useState<Status>(initial?.status ?? "DRAFT");
  const [publishedAt, setPublishedAt] = useState<string | null>(
    (initial?.publishedAt as string | null) ?? null
  );

  // Primary file
  const [primaryFileId, setPrimaryFileId] = useState<string>(
    initial?.primaryFileId ?? ""
  );
  const [primaryFileInfo, setPrimaryFileInfo] = useState<{
    url: string | null;
    mime: string | null;
    name?: string | null;
  } | null>(null);
  const [primaryLocal, setPrimaryLocal] = useState<File | null>(null);
  const [uploadingPrimary, setUploadingPrimary] = useState(false);

  // Attachments (auto-upload)
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [attUploading, setAttUploading] = useState(false);

  useEffect(() => {
    if (mode !== "edit" || !formId) return;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/cms/forms/${formId}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("خطا در دریافت مورد");
        const f = await res.json();

        setTitle(f.title ?? "");
        setSlug(f.slug ?? "");
        setDescription(f.description ?? "");
        setKind(f.kind ?? "");
        setLanguage(f.language ?? "");
        setStatus(f.status ?? "DRAFT");
        setPublishedAt(f.publishedAt ?? null);

        // Primary
        setPrimaryFileId(f.primaryFile?.id ?? "");
        setPrimaryFileInfo({
          url: f.primaryFile?.publicUrl ?? null,
          mime: f.primaryFile?.mimeType ?? null,
          name: f.primaryFile?.alt ?? null,
        });

        // Attachments
        setAttachments(
          (f.assets ?? []).map((a: any) => ({
            id: a.media.id,
            url: a.media.publicUrl ?? null,
            name: a.media.alt ?? null,
            mime: a.media.mimeType ?? null,
            role:
              a.role ??
              (a.media.mimeType?.startsWith("image/") ? "IMAGE" : "ATTACHMENT"),
          }))
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "خطای نامشخص");
      } finally {
        setLoading(false);
      }
    })();
  }, [mode, formId]);

  function handleTitleBlur() {
    if (!slug.trim()) setSlug(slugify(title));
  }

  const bad =
    title.trim().length < 2 ||
    title.length > TITLE_MAX ||
    slug.trim().length < 2 ||
    slug.length > SLUG_MAX ||
    !/^[a-z0-9-]+$/.test(slug.trim()) ||
    (description ?? "").length > DESC_MAX ||
    (status === "SCHEDULED" && !publishedAt);

  // Primary file handlers
  function onPickPrimary(f: File | null) {
    if (!f) {
      setPrimaryLocal(null);
      return;
    }
    if (!FILE_ALLOWED.includes(f.type)) {
      setError("فرمت فایل مجاز نیست. (PDF/DOC/DOCX/تصویر)");
      return;
    }
    if (f.size > FILE_MAX_SIZE) {
      setError("حجم فایل نباید بیش از ۲۴ مگابایت باشد.");
      return;
    }
    setError(null);
    setSuccess(null);
    setPrimaryLocal(f);
  }

  async function uploadPrimaryNow() {
    if (!primaryLocal) return;
    setUploadingPrimary(true);
    setError(null);
    setSuccess(null);
    try {
      const fd = new FormData();
      fd.append("file", primaryLocal);
      const res = await fetch("/api/admin/cms/media/upload", {
        method: "POST",
        body: fd,
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "آپلود فایل ناموفق بود");
      setPrimaryFileId(j.id);
      setPrimaryFileInfo({
        url: j.url ?? null,
        mime: primaryLocal.type,
        name: primaryLocal.name,
      });
      setSuccess("فایل اصلی با موفقیت آپلود شد.");
      setPrimaryLocal(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا در آپلود فایل");
    } finally {
      setUploadingPrimary(false);
    }
  }

  // Attachments (auto-upload)
  async function onPickAttachments(files: FileList | null) {
    if (!files || files.length === 0) return;
    setAttUploading(true);
    setError(null);
    setSuccess(null);
    try {
      const picked = Array.from(files);
      for (const f of picked) {
        if (!FILE_ALLOWED.includes(f.type) || f.size > FILE_MAX_SIZE) {
          continue;
        }
        const fd = new FormData();
        fd.append("file", f);
        const res = await fetch("/api/admin/cms/media/upload", {
          method: "POST",
          body: fd,
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) continue;
        setAttachments((prev) => [
          ...prev,
          {
            id: j.id,
            url: j.url ?? null,
            name: f.name,
            mime: f.type,
            role: f.type.startsWith("image/") ? "IMAGE" : "ATTACHMENT",
          },
        ]);
      }
      setSuccess("فایل‌ها اضافه شدند.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا در آپلود فایل‌ها");
    } finally {
      setAttUploading(false);
    }
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => prev.filter((x) => x.id !== id));
  }
  function moveAttachment(id: string, dir: "up" | "down") {
    setAttachments((prev) => {
      const i = prev.findIndex((x) => x.id === id);
      if (i < 0) return prev;
      const j = dir === "up" ? i - 1 : i + 1;
      if (j < 0 || j >= prev.length) return prev;
      const copy = [...prev];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  }
  function toggleAttachmentRole(id: string) {
    setAttachments((prev) =>
      prev.map((x) =>
        x.id === id
          ? { ...x, role: x.role === "IMAGE" ? "ATTACHMENT" : "IMAGE" }
          : x
      )
    );
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
      const payload: Partial<DTO> = {
        title: title.trim(),
        slug: slug.trim(),
        description: description?.trim() || null,
        kind: (kind || null) as Kind | null,
        language: language?.trim() || null,
        status,
        publishedAt: publishedAt || null,
        primaryFileId: primaryFileId?.trim() || null,
        tagIds: [],
        categoryIds: [],
        assets: attachments.map((a, idx) => ({
          mediaId: a.id,
          order: idx,
          role:
            a.role ?? (a.mime?.startsWith("image/") ? "IMAGE" : "ATTACHMENT"),
        })),
      };

      if (mode === "create") {
        const res = await fetch("/api/admin/cms/forms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j?.error || "ثبت مورد ناموفق بود");
        setSuccess("مورد ایجاد شد");
        router.push(`/admin/cms/forms/${j.id}`);
      } else {
        const res = await fetch(`/api/admin/cms/forms/${formId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j?.error || "ویرایش مورد ناموفق بود");
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
        {mode === "create" ? "ایجاد فرم/فایل" : "ویرایش فرم/فایل"}
      </h1>

      <div className="rounded-2xl p-5 shadow-md border-r-7 border-r-navbar-secondary border border-cms-secondary space-y-6">
        {/* fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="عنوان"
            value={title}
            onChange={(v) => setTitle(v.slice(0, TITLE_MAX))}
            onBlur={() => {
              if (!slug.trim()) setSlug(slugify(title));
            }}
            required
            counter={`${title.length}/${TITLE_MAX}`}
            error={title.length > TITLE_MAX ? "طول عنوان زیاد است" : undefined}
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 pr-1">
              نوع فرم/فایل
            </label>
            <select
              className="w-full rounded-xl border px-3 py-2 focus:ring-2 focus:ring-navbar-secondary bg-white"
              value={kind}
              onChange={(e) => setKind(e.target.value as Kind | "")}
            >
              <option value="">(انتخاب نشده)</option>
              <option value="ADMISSION">پذیرش</option>
              <option value="CONSENT">رضایت‌نامه</option>
              <option value="PRE_VISIT">آمادگی مراجعه</option>
              <option value="INSURANCE">بیمه</option>
              <option value="OTHER">سایر</option>
            </select>
          </div>

          <Field
            label="زبان (اختیاری)"
            value={language}
            onChange={setLanguage}
            inputProps={{ dir: "ltr", placeholder: "fa یا en ..." }}
            hint="کد زبان کوتاه"
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

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 pr-1">
            توضیحات (اختیاری)
          </label>
          <textarea
            className="w-full min-h-[120px] rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-navbar-secondary"
            value={description ?? ""}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="این فایل برای تکمیل قبل از مراجعه استفاده می‌شود…"
            maxLength={DESC_MAX}
          />
          <div className="text-xs text-gray-500 mt-1">
            {(description ?? "").length}/{DESC_MAX}
          </div>
        </div>

        {/* Primary file */}
        <div className="rounded-xl border p-4">
          <div className="font-semibold text-gray-800 mb-2">
            فایل اصلی (دانلود)
          </div>
          <div className="grid md:grid-cols-[1fr_auto_auto] gap-2 items-center">
            <div className="text-sm text-gray-600">
              {primaryLocal ? (
                <div className="flex items-center gap-2">
                  <FileIcon className="w-4 h-4" />
                  {primaryLocal.name}{" "}
                  <span className="text-xs text-gray-400">
                    ({primaryLocal.type})
                  </span>
                </div>
              ) : primaryFileInfo ? (
                <a
                  href={primaryFileInfo.url ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-navbar-secondary hover:underline"
                >
                  <FileIcon className="w-4 h-4" />
                  مشاهده/دانلود فایل
                </a>
              ) : (
                <span className="text-gray-400">فایلی انتخاب نشده است</span>
              )}
            </div>
            <label className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer hover:bg-gray-50">
              <FilePlus2 className="w-4 h-4" /> انتخاب فایل
              <input
                type="file"
                accept={FILE_ALLOWED.join(",")}
                className="hidden"
                onChange={(e) => onPickPrimary(e.target.files?.[0] || null)}
              />
            </label>
            {primaryLocal ? (
              <button
                type="button"
                onClick={uploadPrimaryNow}
                disabled={uploadingPrimary}
                className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-navbar-secondary text-white text-sm disabled:opacity-60"
              >
                <Upload className="w-4 h-4" />
                {uploadingPrimary ? "در حال آپلود..." : "آپلود فایل"}
              </button>
            ) : primaryFileId ? (
              <button
                type="button"
                onClick={() => {
                  setPrimaryFileId("");
                  setPrimaryFileInfo(null);
                }}
                className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm hover:bg-gray-50"
              >
                حذف فایل
              </button>
            ) : null}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            فرمت‌های مجاز: PDF, DOC, DOCX, JPG, PNG, WEBP — حداکثر ۲۴ مگابایت
          </div>
        </div>

        {/* Attachments */}
        <div className="rounded-xl border p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-gray-800">
              پیوست‌ها (اختیاری)
            </div>
            <label className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer hover:bg-gray-50">
              افزودن فایل‌ها
              <input
                type="file"
                accept={FILE_ALLOWED.join(",")}
                multiple
                className="hidden"
                onChange={(e) => onPickAttachments(e.target.files)}
              />
            </label>
          </div>

          {attUploading && (
            <div className="text-sm text-gray-500 mb-2">
              در حال آپلود فایل‌ها…
            </div>
          )}

          {attachments.length === 0 ? (
            <div className="text-sm text-gray-500">فایلی اضافه نشده است.</div>
          ) : (
            <ul className="space-y-2">
              {attachments.map((a, idx) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-3 border rounded-lg p-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-9 h-9 grid place-items-center rounded-md bg-gray-100 text-gray-600">
                      {a.mime?.startsWith("image/") ? "IMG" : "FILE"}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-gray-800">
                        {a.name || a.id}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {a.mime || "unknown"}
                      </div>
                      {a.url ? (
                        <a
                          href={a.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-navbar-secondary hover:underline"
                        >
                          مشاهده
                        </a>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleAttachmentRole(a.id)}
                      className="px-2 py-1 rounded-md border text-xs hover:bg-gray-50"
                      title="تغییر نقش پیوست"
                    >
                      {a.role === "IMAGE" ? "به‌عنوان فایل" : "به‌عنوان تصویر"}
                    </button>
                    <button
                      type="button"
                      onClick={() => moveAttachment(a.id, "up")}
                      className="p-1 rounded-md border hover:bg-gray-50"
                      disabled={idx === 0}
                      title="بالا"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveAttachment(a.id, "down")}
                      className="p-1 rounded-md border hover:bg-gray-50"
                      disabled={idx === attachments.length - 1}
                      title="پایین"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeAttachment(a.id)}
                      className="p-1 rounded-md border hover:bg-gray-50 text-red-600"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="text-xs text-gray-500 mt-2">
            می‌توانید تصاویر یا اسناد اضافه کنید. ترتیب با دکمه‌های بالا/پایین
            تنظیم می‌شود.
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
          {saving ? "در حال ذخیره…" : mode === "create" ? "ایجاد" : "ذخیره"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/cms/forms")}
          className="px-6 h-11 rounded-xl border hover:bg-gray-200"
        >
          بازگشت
        </button>
      </div>
    </form>
  );
}

/* ---------- Helpers (same style you use elsewhere) ---------- */
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
    if (!d && !t) onChange("");
    else onChange(`${d}T${t || "00:00"}`);
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
