"use client";

import { useState } from "react";
import { Upload, X, ArrowUp, ArrowDown, Star } from "lucide-react";

export type GalleryItem = { id: string; url: string; alt?: string | null };

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 4 * 1024 * 1024;

export function MultiImageUploader({
  value,
  onChange,
  onMakeCover,
  coverId,
  title = "گالری تصاویر (اختیاری)",
}: {
  value: GalleryItem[];
  onChange: (items: GalleryItem[]) => void;
  onMakeCover?: (id: string) => void;
  coverId?: string | null;
  title?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadOne(file: File): Promise<GalleryItem> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/cms/media/upload", {
      method: "POST",
      body: fd,
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok || !j?.id)
      throw new Error(j?.error || "آپلود تصویر ناموفق بود");
    return { id: j.id, url: j.url, alt: null };
  }

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // allow picking the same files next time
    if (!files.length) return;

    // basic validation first
    for (const f of files) {
      if (!ALLOWED.includes(f.type)) {
        setError("فقط فرمت‌های JPG/PNG/WEBP مجاز است.");
        return;
      }
      if (f.size > MAX_SIZE) {
        setError("حجم هر فایل نباید بیش از ۴ مگابایت باشد.");
        return;
      }
    }

    setError(null);
    setBusy(true);
    try {
      const uploaded: GalleryItem[] = [];
      // Upload sequentially (simpler). If you prefer, do Promise.all for parallel.
      for (const f of files) {
        // optimistic preview could be added if you want (URL.createObjectURL)
        const gi = await uploadOne(f);
        uploaded.push(gi);
      }
      onChange([...value, ...uploaded]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطای نامشخص در آپلود");
    } finally {
      setBusy(false);
    }
  }

  function removeAt(idx: number) {
    const next = value.slice();
    next.splice(idx, 1);
    onChange(next);
  }
  function moveUp(idx: number) {
    if (idx <= 0) return;
    const next = value.slice();
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    onChange(next);
  }
  function moveDown(idx: number) {
    if (idx >= value.length - 1) return;
    const next = value.slice();
    [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
    onChange(next);
  }

  return (
    <div className="rounded-2xl p-4 border border-cms-secondary shadow-sm mt-6">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-gray-800">{title}</div>
        <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer hover:bg-gray-50">
          <Upload className="w-4 h-4" />
          انتخاب چند تصویر
          <input
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={onPick}
          />
        </label>
      </div>
      <div className="text-xs text-gray-500 mt-1">
        فرمت‌های مجاز: JPG, PNG, WEBP — حداکثر ۴ مگابایت برای هر تصویر
      </div>
      {error && <div className="mt-2 text-xs text-rose-600">{error}</div>}

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {value.map((it, i) => (
          <div
            key={it.id}
            className="rounded-xl border overflow-hidden bg-white"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={it.url}
              alt={it.alt ?? ""}
              className="w-full aspect-[4/3] object-cover"
            />
            <div className="p-2 flex items-center justify-between gap-1">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="px-2 py-1 rounded-lg border text-xs hover:bg-gray-50"
                  onClick={() => moveUp(i)}
                  title="انتقال به بالا"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  className="px-2 py-1 rounded-lg border text-xs hover:bg-gray-50"
                  onClick={() => moveDown(i)}
                  title="انتقال به پایین"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-1">
                {onMakeCover && (
                  <button
                    type="button"
                    className={`px-2 py-1 rounded-lg border text-xs hover:bg-gray-50 ${
                      coverId === it.id
                        ? "bg-amber-50 border-amber-200 text-amber-700"
                        : ""
                    }`}
                    onClick={() => onMakeCover(it.id)}
                    title="انتخاب به‌عنوان کاور"
                  >
                    <Star className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  className="px-2 py-1 rounded-lg border text-xs hover:bg-gray-50"
                  onClick={() => removeAt(i)}
                  title="حذف"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {busy && (
          <div className="rounded-xl border border-dashed grid place-items-center text-sm text-gray-400">
            در حال آپلود…
          </div>
        )}
      </div>
    </div>
  );
}
