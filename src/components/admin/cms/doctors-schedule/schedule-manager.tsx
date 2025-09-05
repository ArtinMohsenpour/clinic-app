"use client";

import { useEffect, useState, useCallback } from "react";
import type {
  Branch,
  Schedule,
  ScheduleEntry,
  Weekday,
} from "@prisma/client";
import { Plus, Trash2 } from "lucide-react";
import ScheduleEntryForm from "./schedule-entry-form";

// --- Types ---

type DoctorOption = {
  id: string;
  name: string | null;
  specialty: { name: string | null } | null;
};

type ScheduleEntryWithDoctor = ScheduleEntry & {
  doctor: DoctorOption;
};

type FullSchedule = Schedule & {
  entries: ScheduleEntryWithDoctor[];
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

export default function ScheduleManager() {
  // Data state
  const [branches, setBranches] = useState<Branch[]>([]);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [schedule, setSchedule] = useState<FullSchedule | null>(null);

  // UI state
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] =
    useState<ScheduleEntryWithDoctor | null>(null);

  // Fetch initial options for branches and doctors
  useEffect(() => {
    async function loadOptions() {
      try {
        const doctorsRes = await fetch("/api/admin/users?role=doctor");
        const branchesRes = await fetch("/api/admin/branches");

        if (!doctorsRes.ok || !branchesRes.ok) {
          throw new Error("خطا در دریافت اطلاعات اولیه");
        }

        const doctorsData: DoctorOption[] = await doctorsRes.json();
        const branchesData: Branch[] = await branchesRes.json();

        setDoctors(doctorsData || []);
        setBranches(branchesData || []);

        if (branchesData?.length > 0) {
          setSelectedBranchId(branchesData[0].id);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "خطای ناشناخته");
      }
    }
    loadOptions();
  }, []);

  // Create a memoized function to load the schedule
  const loadSchedule = useCallback(async () => {
    if (!selectedBranchId) {
      setSchedule(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/cms/doctors-schedule?branchId=${selectedBranchId}`
      );
      if (!res.ok) throw new Error("خطا در دریافت برنامه هفتگی");
      const data: FullSchedule = await res.json();
      setSchedule(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطای ناشناخته");
    } finally {
      setLoading(false);
    }
  }, [selectedBranchId]);

  // Effect to load schedule whenever the memoized function changes (i.e., when branchId changes)
  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  function handleAddNew() {
    setEditingEntry(null);
    setIsFormOpen(true);
  }

  function handleEdit(entry: ScheduleEntryWithDoctor) {
    setEditingEntry(entry);
    setIsFormOpen(true);
  }

  async function handleDelete(entryId: string) {
    if (!confirm("آیا از حذف این نوبت مطمئن هستید؟")) return;

    try {
      const res = await fetch(`/api/admin/cms/doctors-schedule/${entryId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("حذف نوبت ناموفق بود");

      // Use the cleaner refresh method here as well
      loadSchedule();
    } catch (e) {
      alert(e instanceof Error ? e.message : "خطای ناشناخته");
    }
  }

  const groupedEntries = schedule?.entries.reduce((acc, entry) => {
    (acc[entry.dayOfWeek] = acc[entry.dayOfWeek] || []).push(entry);
    return acc;
  }, {} as Record<Weekday, ScheduleEntryWithDoctor[]>);

  return (
    <>
      <div
        dir="rtl"
        className="p-6 pb-12 bg-gradient-to-b from-white to-gray-50 rounded-2xl shadow-md ring-1 ring-gray-100 space-y-5 select-none"
      >
        <div className="mb-7">
          <h1 className="text-3xl font-extrabold text-navbar-primary">
            برنامه حضور پزشکان
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            مدیریت برنامه هفتگی پزشکان در هر شعبه.
          </p>
        </div>

        {/* Branch Selector */}
        <div className="flex items-center gap-4">
          <label htmlFor="branch-select" className="font-semibold">
            شعبه:
          </label>
          <select
            id="branch-select"
            className="w-72 rounded-xl border px-3 py-2 focus:ring-2 focus:ring-navbar-secondary bg-white"
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            disabled={branches.length === 0}
          >
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleAddNew}
            disabled={!selectedBranchId}
            className="px-4 py-2 flex items-center gap-2 rounded-xl bg-navbar-secondary text-white hover:bg-navbar-hover disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            افزودن نوبت جدید
          </button>
        </div>

        {/* Schedule Display */}
        <div className="mt-6">
          {loading ? (
            <p>در حال بارگذاری برنامه...</p>
          ) : error ? (
            <p className="text-red-600">{error}</p>
          ) : !schedule || !selectedBranchId ? (
            <p>لطفاً یک شعبه را انتخاب کنید.</p>
          ) : (
            <div className="space-y-6">
              {(Object.keys(WEEKDAYS_FA) as Weekday[]).map((day) => {
                const dayEntries = groupedEntries?.[day] || [];
                return (
                  <div key={day}>
                    <h3 className="font-bold text-lg mb-2 text-navbar-primary">
                      {WEEKDAYS_FA[day]}
                    </h3>
                    <div className="rounded-2xl border border-navbar-active overflow-hidden shadow-sm">
                      <table className="w-full text-sm text-right">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="p-3">پزشک</th>
                            <th className="p-3">تخصص</th>
                            <th className="p-3">ساعت شروع</th>
                            <th className="p-3">ساعت پایان</th>
                            <th className="p-3">یادداشت</th>
                            <th className="p-3 w-32">اقدامات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dayEntries.length > 0 ? (
                            dayEntries.map((entry) => (
                              <tr key={entry.id} className="border-t">
                                <td className="p-3 font-semibold">
                                  {entry.doctor?.name}
                                </td>
                                <td className="p-3">
                                  {entry.doctor?.specialty?.name || "—"}
                                </td>
                                <td className="p-3 font-mono">
                                  {entry.startTime}
                                </td>
                                <td className="p-3 font-mono">
                                  {entry.endTime}
                                </td>
                                <td className="p-3">{entry.notes || "—"}</td>
                                <td className="p-3">
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleEdit(entry)}
                                      className="px-2.5 py-1.5 rounded-lg border hover:bg-gray-100"
                                    >
                                      ویرایش
                                    </button>
                                    <button
                                      onClick={() => handleDelete(entry.id)}
                                      className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan={6}
                                className="p-4 text-center text-gray-500"
                              >
                                برنامه‌ای برای این روز ثبت نشده است.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {isFormOpen && schedule && (
        <ScheduleEntryForm
          scheduleId={schedule.id}
          doctors={doctors}
          initialData={editingEntry}
          onClose={() => setIsFormOpen(false)}
          onSuccess={() => {
            setIsFormOpen(false);
            loadSchedule(); // Directly call the refresh function
          }}
        />
      )}
    </>
  );
}
