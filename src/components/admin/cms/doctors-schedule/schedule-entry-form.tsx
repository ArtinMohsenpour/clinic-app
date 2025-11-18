"use client";

import { useState } from "react";
import type { ScheduleEntry, Weekday } from "@prisma/client";
import { X } from "lucide-react";

// --- Types ---

type DoctorOption = {
  id: string;
  name: string | null;
};

type ScheduleEntryWithDoctor = ScheduleEntry & {
  doctor: DoctorOption;
};

type Props = {
  scheduleId: string;
  doctors: DoctorOption[];
  initialData?: ScheduleEntryWithDoctor | null;
  onClose: () => void;
  onSuccess: () => void;
};

const WEEKDAYS_FA: Record<Weekday, string> = {
  SATURDAY: "شنبه",
  SUNDAY: "یکشنبه",
  MONDAY: "دوشنبه",
  TUESDAY: "سه‌شنبه",
  WEDNESDAY: "چهارشنبه",
  THURSDAY: "پنجشنبه",
  FRIDAY: "جمعه",
};

// --- Component ---

export default function ScheduleEntryForm({
  scheduleId,
  doctors,
  initialData,
  onClose,
  onSuccess,
}: Props) {
  const mode = initialData ? "edit" : "create";

  // Form State
  const [doctorId, setDoctorId] = useState(initialData?.doctorId ?? "");
  const [dayOfWeek, setDayOfWeek] = useState<Weekday>(
    initialData?.dayOfWeek ?? "SATURDAY"
  );
  const [startTime, setStartTime] = useState(initialData?.startTime ?? "");
  const [endTime, setEndTime] = useState(initialData?.endTime ?? "");
  const [notes, setNotes] = useState(initialData?.notes ?? "");

  // UI State
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFormValid =
    doctorId &&
    startTime.match(/^\d{2}:\d{2}$/) &&
    endTime.match(/^\d{2}:\d{2}$/);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isFormValid) {
      setError("لطفاً فیلدهای اجباری را به درستی پر کنید.");
      return;
    }
    setError(null);
    setSaving(true);

    const payload = {
      scheduleId,
      doctorId,
      dayOfWeek,
      startTime,
      endTime,
      notes: notes.trim() || null,
    };

    try {
      const url =
        mode === "create"
          ? "/api/admin/cms/doctors-schedule"
          : `/api/admin/cms/doctors-schedule/${initialData?.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "عملیات ناموفق بود");
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطای ناشناخته");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-[500px] p-6"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">
            {mode === "create" ? "افزودن نوبت جدید" : "ویرایش نوبت"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">پزشک</label>
            <select
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              className="w-full rounded-xl border p-2 bg-white"
            >
              <option value="" disabled>
                انتخاب کنید
              </option>
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">روز هفته</label>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(e.target.value as Weekday)}
              className="w-full rounded-xl border p-2 bg-white"
            >
              {Object.entries(WEEKDAYS_FA).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">
                ساعت شروع
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-xl border p-2 font-mono"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">
                ساعت پایان
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-xl border p-2 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              یادداشت (اختیاری)
            </label>
            <textarea
              value={notes || ""}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-xl border p-2"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={saving || !isFormValid}
              className="px-6 h-11 rounded-xl bg-navbar-secondary text-white font-medium hover:bg-navbar-hover disabled:opacity-60"
            >
              {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 h-11 rounded-xl border hover:bg-gray-50"
            >
              انصراف
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
