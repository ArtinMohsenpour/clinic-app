// src/components/admin/cms/ui/multi-image-uploader.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
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
    const j: any = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j?.error || "آپلود تصویر ناموفق بود");

    const id: string | undefined =
      j?.id ?? j?.mediaId ?? j?.asset?.id ?? j?.data?.id;
    const url: string | undefined =
      j?.url ?? j?.publicUrl ?? j?.asset?.publicUrl ?? j?.data?.publicUrl;

    if (!id || !url) throw new Error("پاسخ آپلود نامعتبر است.");
    return { id, url, alt: null };
  }

  // limit concurrency so the server isn't overwhelmed
  async function uploadMany(files: File[], limit = 3) {
    const results: GalleryItem[] = [];
    const failed: string[] = [];
    let idx = 0;

    const workers = Array.from({ length: Math.min(limit, files.length) }).map(
      async () => {
        while (idx < files.length) {
          const i = idx++;
          const f = files[i];
          try {
            const gi = await uploadOne(f);
            results.push(gi);
          } catch {
            failed.push(f.name);
          }
        }
      }
    );
    await Promise.all(workers);
    return { results, failed };
  }

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // allow picking the same files again
    if (!files.length) return;

    // validate but don't abort entire batch; keep valids
    const invalid: string[] = [];
    const valids: File[] = [];
    for (const f of files) {
      if (!ALLOWED.includes(f.type) || f.size > MAX_SIZE) invalid.push(f.name);
      else valids.push(f);
    }
    if (!valids.length) {
      setError(
        invalid.length
          ? `این فایل‌ها مجاز نبودند یا بزرگ بودند: ${invalid.join(", ")}`
          : "فایلی انتخاب نشد."
      );
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const { results, failed } = await uploadMany(valids, 3);
      if (results.length) onChange([...value, ...results]);
      if (invalid.length || failed.length) {
        setError(
          [
            invalid.length ? `نامعتبر/بزرگ: ${invalid.join(", ")}` : undefined,
            failed.length ? `ناموفق در آپلود: ${failed.join(", ")}` : undefined,
          ]
            .filter(Boolean)
            .join(" | ")
        );
      }
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

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {value.map((it, i) => (
          <div
            key={it.id + ":" + i}
            className="rounded-xl border overflow-hidden bg-white"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={it.url}
              alt={it.alt ?? ""}
              className="w-full aspect-[4/3] object-cover"
            />
            <div className="p-1.5 flex items-center justify-between gap-1">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="h-7 px-1.5 rounded-md border text-[10px] hover:bg-gray-50"
                  onClick={() => moveUp(i)}
                  title="انتقال به بالا"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  className="h-7 px-1.5 rounded-md border text-[10px] hover:bg-gray-50"
                  onClick={() => moveDown(i)}
                  title="انتقال به پایین"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
              </div>
              <div className="flex items-center gap-1">
                {onMakeCover && (
                  <button
                    type="button"
                    className={`h-7 px-1.5 rounded-md border text-[10px] hover:bg-gray-50 ${
                      coverId === it.id
                        ? "bg-amber-50 border-amber-200 text-amber-700"
                        : ""
                    }`}
                    onClick={() => onMakeCover(it.id)}
                    title="انتخاب به‌عنوان کاور"
                  >
                    <Star className="w-3 h-3" />
                  </button>
                )}
                <button
                  type="button"
                  className="h-7 px-1.5 rounded-md border text-[10px] hover:bg-gray-50"
                  onClick={() => removeAt(i)}
                  title="حذف"
                >
                  <X className="w-3 h-3" />
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
