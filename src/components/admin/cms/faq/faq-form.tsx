/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Status = "DRAFT" | "PUBLISHED" | "SCHEDULED" | "ARCHIVED";

type DTO = {
  id?: string;
  question: string;
  slug: string;
  answer: { type: "markdown"; content: string } | unknown;
  status: Status;
  publishedAt?: string | null;
  isPinned?: boolean;
  order?: number;
  tagIds?: string[];
  categoryIds?: string[];
};

function slugify(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const QUESTION_MAX = 200;
const SLUG_MAX = 200;
const ANSWER_WORD_MAX = 3000;

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

export default function FaqForm({
  mode,
  faqId,
  initial,
}: {
  mode: "create" | "edit";
  faqId?: string;
  initial?: Partial<DTO>;
}) {
  const router = useRouter();

  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [question, setQuestion] = useState(initial?.question ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [status, setStatus] = useState<Status>(initial?.status ?? "DRAFT");
  const [publishedAt, setPublishedAt] = useState<string | null>(
    (initial?.publishedAt as string | null) ?? null
  );
  const [isPinned, setIsPinned] = useState<boolean>(initial?.isPinned ?? false);
  const [order, setOrder] = useState<number>(initial?.order ?? 0);

  const [answerMd, setAnswerMd] = useState(
    (typeof (initial?.answer as any)?.content === "string"
      ? (initial?.answer as any)?.content
      : "") ?? ""
  );

  // load when editing
  useEffect(() => {
    if (mode !== "edit" || !faqId) return;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/cms/faq/${faqId}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("خطا در دریافت مورد");
        const a = await res.json();
        setQuestion(a.question ?? "");
        setSlug(a.slug ?? "");
        setStatus(a.status ?? "DRAFT");
        setPublishedAt(a.publishedAt ?? null);
        setIsPinned(Boolean(a.isPinned));
        setOrder(typeof a.order === "number" ? a.order : 0);
        setAnswerMd(
          typeof a.answer?.content === "string"
            ? a.answer.content
            : a.answer
            ? JSON.stringify(a.answer)
            : ""
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "خطای نامشخص");
      } finally {
        setLoading(false);
      }
    })();
  }, [mode, faqId]);

  function onQuestionBlur() {
    if (!slug.trim()) setSlug(slugify(question));
  }

  const answerWordCount = useMemo(
    () => (answerMd ? answerMd.trim().split(/\s+/).filter(Boolean).length : 0),
    [answerMd]
  );

  // validation
  const bad =
    question.trim().length < 2 ||
    question.length > QUESTION_MAX ||
    slug.trim().length < 2 ||
    slug.length > SLUG_MAX ||
    !/^[a-z0-9-]+$/.test(slug.trim()) ||
    (status === "SCHEDULED" && !publishedAt) ||
    answerWordCount > ANSWER_WORD_MAX ||
    order < 0;

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
        question: question.trim(),
        slug: slug.trim(),
        answer: { type: "markdown", content: answerMd ?? "" },
        status,
        publishedAt: publishedAt || null,
        isPinned,
        order,
        tagIds: [],
        categoryIds: [],
      };

      if (mode === "create") {
        const res = await fetch("/api/admin/cms/faq", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j?.error || "ثبت مورد ناموفق بود");
        setSuccess("سؤال/پاسخ ایجاد شد");
        router.push(`/admin/cms/faq/${j.id}`);
      } else {
        const res = await fetch(`/api/admin/cms/faq/${faqId}`, {
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
        {mode === "create" ? "ایجاد سؤال جدید" : "ویرایش سؤال"}
      </h1>

      <div className="rounded-2xl p-5 shadow-md border-r-7 border-r-navbar-secondary border border-cms-secondary">
        {/* Fields grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="سؤال"
            value={question}
            onChange={(v) => setQuestion(v.slice(0, QUESTION_MAX))}
            onBlur={onQuestionBlur}
            required
            counter={`${question.length}/${QUESTION_MAX}`}
            error={
              question.length > QUESTION_MAX ? "طول سؤال زیاد است" : undefined
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

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 pr-1">
              سنجاق (نمایش در ابتدای فهرست)
            </label>
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
            />
          </div>

          <Field
            label="ترتیب نمایش"
            value={String(order)}
            onChange={(v) => setOrder(Number(v || 0))}
            inputProps={{ type: "number", min: 0, step: 1 }}
            hint="اعداد کمتر بالاتر نمایش داده می‌شوند"
            error={order < 0 ? "نمی‌تواند منفی باشد" : undefined}
          />
        </div>

        {/* Answer editor */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-1 pr-1">
            پاسخ (Markdown ساده)
          </label>
          <textarea
            className={`w-full min-h-[280px] rounded-xl border px-3 py-2 outline-none focus:ring-2 ${
              answerWordCount > ANSWER_WORD_MAX
                ? "border-rose-500 focus:ring-rose-200"
                : "focus:ring-navbar-secondary"
            }`}
            value={answerMd}
            onChange={(e) => setAnswerMd(e.target.value)}
            placeholder="**پاسخ کوتاه و شفاف…**"
          />
          <div
            className={`text-xs mt-1 ${
              answerWordCount > ANSWER_WORD_MAX
                ? "text-rose-600"
                : "text-gray-500"
            }`}
          >
            {answerWordCount}/{ANSWER_WORD_MAX} کلمه
          </div>
        </div>

        {/* (Optional) Tag/Category pickers could go here */}
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
          onClick={() => router.push("/admin/cms/faq")}
          className="px-6 h-11 rounded-xl border hover:bg-gray-200"
        >
          بازگشت
        </button>
      </div>
    </form>
  );
}

/* DateTime picker */
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
    ["email", "password", "tel", "url", "datetime-local", "number"].includes(
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
