"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import type { ContactItem, ContactItemType, StaticPage } from "@prisma/client";

// --- TYPES ---
type Status = "DRAFT" | "PUBLISHED" | "ARCHIVED";
type LocalContactItem = {
  id: string; // Use a temporary client-side ID for new items
  type: ContactItemType;
  label: string;
  value: string;
  url: string | null;
};

// --- MAIN COMPONENT ---
export default function PageForm({
  mode,
  pageId,
}: {
  mode: "create" | "edit";
  pageId?: string;
}) {
  const router = useRouter();

  // Form State
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [body, setBody] = useState(""); // Assuming plain text for now; can be adapted for a rich text editor
  const [status, setStatus] = useState<Status>("DRAFT");
  const [contactItems, setContactItems] = useState<LocalContactItem[]>([]);

  // UI State
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === "edit" && pageId) {
      setLoading(true);
      fetch(`/api/admin/cms/static-pages/${pageId}`)
        .then((res) => (res.ok ? res.json() : Promise.reject(res)))
        .then((data: StaticPage & { contactItems: ContactItem[] }) => {
          setTitle(data.title);
          setSlug(data.slug);
          setBody(data.body ? JSON.stringify(data.body, null, 2) : "");
          setStatus(
            data.status === "DRAFT" ||
              data.status === "PUBLISHED" ||
              data.status === "ARCHIVED"
              ? data.status
              : "DRAFT"
          );
          setContactItems(
            data.contactItems.map((ci) => ({ ...ci, url: ci.url || "" }))
          );
        })
        .catch(() => setError("خطا در دریافت اطلاعات صفحه"))
        .finally(() => setLoading(false));
    }
  }, [mode, pageId]);

  const handleSlugify = () => {
    if (!slug.trim()) setSlug(title.trim().toLowerCase().replace(/\s+/g, "-"));
  };

  const addContactItem = (type: ContactItemType) => {
    setContactItems([
      ...contactItems,
      { id: `temp-${Date.now()}`, type, label: "", value: "", url: "" },
    ]);
  };

  const updateContactItem = (
    index: number,
    field: keyof LocalContactItem,
    value: string
  ) => {
    const newItems = [...contactItems];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (newItems[index] as any)[field] = value;
    setContactItems(newItems);
  };

  const removeContactItem = (index: number) => {
    setContactItems(contactItems.filter((_, i) => i !== index));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !slug.trim()) {
      setError("عنوان و اسلاگ صفحه اجباری است.");
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      title,
      slug,
      body: body ? JSON.parse(body) : null,
      status,
      contactItems: contactItems.map(({ id, ...rest }) => ({
        ...(id.startsWith("temp-") ? {} : { id }), // Only include ID for existing items
        ...rest,
        url: rest.url || null,
      })),
    };

    const url =
      mode === "create"
        ? "/api/admin/cms/static-pages"
        : `/api/admin/cms/static-pages/${pageId}`;
    const method = mode === "create" ? "POST" : "PATCH";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "خطا در ذخیره سازی");
      router.push("/admin/cms/static-pages");
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطای ناشناخته");
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return <div className="p-6 rounded-2xl bg-white">در حال بارگذاری...</div>;

  return (
    <form
      onSubmit={handleSubmit}
      dir="rtl"
      className="p-6 bg-white rounded-2xl shadow-md space-y-8"
    >
      <div>
        <h1 className="text-2xl font-bold">
          {mode === "create" ? "ایجاد صفحه جدید" : "ویرایش صفحه"}
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field
          label="عنوان صفحه"
          value={title}
          onChange={setTitle}
          onBlur={handleSlugify}
          required
        />
        <Field
          label="اسلاگ (URL)"
          value={slug}
          onChange={setSlug}
          required
          inputProps={{ dir: "ltr" }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          محتوای اصلی صفحه
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={10}
          className="w-full rounded-xl border p-2 font-mono text-sm"
          placeholder="JSON content for the page body..."
        />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">اطلاعات تماس (اختیاری)</h2>
        <div className="space-y-3 p-4 border rounded-2xl">
          {contactItems.map((item, index) => (
            <div
              key={item.id}
              className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-lg"
            >
              <select
                value={item.type}
                onChange={(e) =>
                  updateContactItem(index, "type", e.target.value)
                }
                className="rounded-md border p-2 bg-white"
              >
                <option value="PHONE">تلفن</option>
                <option value="EMAIL">ایمیل</option>
                <option value="ADDRESS">آدرس</option>
              </select>
              <input
                type="text"
                placeholder="برچسب (مثلا: بخش دندانپزشکی)"
                value={item.label}
                onChange={(e) =>
                  updateContactItem(index, "label", e.target.value)
                }
                className="md:col-span-2 rounded-md border p-2"
              />
              <div className="flex items-center">
                <input
                  type={item.type === "EMAIL" ? "email" : "text"}
                  placeholder="محتوا"
                  value={item.value}
                  onChange={(e) =>
                    updateContactItem(index, "value", e.target.value)
                  }
                  className="flex-1 rounded-md border p-2"
                />
                <button
                  type="button"
                  onClick={() => removeContactItem(index)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-full mr-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {item.type === "ADDRESS" && (
                <input
                  type="url"
                  placeholder="لینک نقشه (اختیاری)"
                  value={item.url || ""}
                  onChange={(e) =>
                    updateContactItem(index, "url", e.target.value)
                  }
                  className="md:col-span-4 rounded-md border p-2"
                />
              )}
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => addContactItem("PHONE")}
              className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-100 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> افزودن تلفن
            </button>
            <button
              type="button"
              onClick={() => addContactItem("EMAIL")}
              className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-100 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> افزودن ایمیل
            </button>
            <button
              type="button"
              onClick={() => addContactItem("ADDRESS")}
              className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-100 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> افزودن آدرس
            </button>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">وضعیت انتشار</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as Status)}
          className="w-full max-w-xs rounded-xl border p-2 bg-white"
        >
          <option value="DRAFT">پیش‌نویس</option>
          <option value="PUBLISHED">منتشرشده</option>
          <option value="ARCHIVED">بایگانی</option>
        </select>
      </div>

      {error && (
        <div className="p-3 text-center bg-red-50 text-red-700 rounded-xl">
          {error}
        </div>
      )}

      <div className="flex gap-2 pt-4 border-t">
        <button
          type="submit"
          disabled={saving}
          className="px-6 h-11 rounded-xl bg-navbar-secondary text-white disabled:opacity-60"
        >
          {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
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

function Field({
  label,
  value,
  onChange,
  onBlur,
  inputProps,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1 pr-1">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        required={required}
        {...inputProps}
        className="w-full rounded-xl border px-3 py-2 outline-none transition focus:ring-2 focus:ring-navbar-secondary"
      />
    </div>
  );
}
