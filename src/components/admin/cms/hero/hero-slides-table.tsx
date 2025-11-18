"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { GripVertical, Trash2 } from "lucide-react";

type Status = "DRAFT" | "PUBLISHED" | "SCHEDULED" | "ARCHIVED";

type ListItem = {
  id: string;
  title: string;
  status: Status;
  order: number;
  image: { publicUrl: string | null; alt: string | null } | null;
};

type ListResponse = {
  items: ListItem[];
};

export default function HeroSlidesTable() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [slides, setSlides] = useState<ListItem[]>([]);

  // Refs to store drag-and-drop state without causing re-renders
  const draggedItem = useRef<ListItem | null>(null);
  const draggedOverItem = useRef<ListItem | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/cms/hero`, { cache: "no-store" });
      if (!res.ok) throw new Error("خطا در دریافت لیست اسلایدها");
      const j: ListResponse = await res.json();
      setSlides(j.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطای نامشخص");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // This function is called when a user drops a dragged row
  async function handleDrop() {
    // Ensure we have a valid drag operation
    if (
      !draggedItem.current ||
      !draggedOverItem.current ||
      draggedItem.current.id === draggedOverItem.current.id
    ) {
      return;
    }

    // 1. Perform an optimistic UI update for a snappy user experience
    const currentSlides = [...slides];
    const draggedIndex = currentSlides.findIndex(
      (s) => s.id === draggedItem.current!.id
    );
    const targetIndex = currentSlides.findIndex(
      (s) => s.id === draggedOverItem.current!.id
    );

    // Remove the dragged item from its original position
    const [reorderedItem] = currentSlides.splice(draggedIndex, 1);
    // Insert it into the new position
    currentSlides.splice(targetIndex, 0, reorderedItem);

    setSlides(currentSlides);

    // 2. Send the new order to the backend API
    const orderedIds = currentSlides.map((s) => s.id);
    try {
      const res = await fetch("/api/admin/cms/hero/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      });

      if (!res.ok) {
        throw new Error("Server failed to update order.");
      }
    } catch (err) {
      alert("تغییر ترتیب ناموفق بود. بازگردانی به حالت اولیه.");
      load(); // Revert to the server's state on failure
    } finally {
      // 3. Clean up refs
      draggedItem.current = null;
      draggedOverItem.current = null;
    }
  }

  async function onDelete(id: string) {
    if (!confirm("آیا از حذف این اسلاید مطمئن هستید؟")) return;
    const res = await fetch(`/api/admin/cms/hero/${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("حذف ناموفق بود");
      return;
    }
    load();
  }

  return (
    <div
      dir="rtl"
      className="p-6 pb-12 bg-gradient-to-b from-white to-gray-50 rounded-2xl shadow-md ring-1 ring-gray-100 space-y-5"
    >
      <div className="flex justify-between items-center mb-7 ">
        <div>
          <h1 className="text-3xl font-extrabold text-navbar-primary">
            مدیریت اسلایدر
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            برای تغییر ترتیب، ردیف‌ها را بکشید و رها کنید.
          </p>
        </div>
        <Link
          href="/admin/cms/hero/new"
          className="px-4 py-2 rounded-xl bg-navbar-secondary text-white hover:bg-navbar-hover"
        >
          اسلاید جدید
        </Link>
      </div>

      <div className="rounded-2xl border overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-navbar-primary text-white text-right">
            <tr>
              <th className="p-3 w-12" aria-label="Drag Handle"></th>
              <th className="p-3 w-40">تصویر</th>
              <th className="p-3">عنوان</th>
              <th className="p-3">وضعیت</th>
              <th className="p-3 w-40">اقدامات</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="p-4 text-center">
                  در حال بارگذاری...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-red-600">
                  {error}
                </td>
              </tr>
            ) : slides.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-500">
                  موردی یافت نشد.
                </td>
              </tr>
            ) : (
              slides.map((item) => (
                <tr
                  key={item.id}
                  className="border-t cursor-grab active:cursor-grabbing hover:bg-gray-50 transition-colors"
                  draggable
                  onDragStart={() => (draggedItem.current = item)}
                  onDragEnter={() => (draggedOverItem.current = item)}
                  onDragEnd={handleDrop}
                  onDragOver={(e) => e.preventDefault()} // This is necessary to allow dropping
                >
                  <td className="p-3 text-center text-gray-400">
                    <GripVertical className="inline-block" />
                  </td>
                  <td className="p-2">
                    {item.image?.publicUrl ? (
                      <img
                        src={item.image.publicUrl}
                        alt={item.image.alt ?? item.title}
                        className="w-32 h-20 object-cover rounded-lg border p-1 bg-gray-50 pointer-events-none"
                      />
                    ) : (
                      <div className="w-32 h-20 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-500 pointer-events-none">
                        بدون تصویر
                      </div>
                    )}
                  </td>
                  <td className="p-3 font-semibold">{item.title}</td>
                  <td className="p-3">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/cms/hero/${item.id}`}
                        className="px-3 py-1.5 rounded-lg border hover:bg-gray-100"
                      >
                        ویرایش
                      </Link>
                      <button
                        onClick={() => onDelete(item.id)}
                        className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const map = {
    DRAFT: "bg-amber-50 text-amber-700",
    PUBLISHED: "bg-emerald-50 text-emerald-700",
    SCHEDULED: "bg-blue-50 text-blue-700",
    ARCHIVED: "bg-gray-100 text-gray-700",
  } as const;
  const label = {
    DRAFT: "پیش‌نویس",
    PUBLISHED: "منتشرشده",
    SCHEDULED: "زمان‌بندی‌شده",
    ARCHIVED: "بایگانی",
  }[status];
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs border ${map[status]}`}>
      {label}
    </span>
  );
}
