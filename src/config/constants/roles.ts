export const ROLES = [
  // Core leadership & ops
  { id: "admin", name: "مدیر سیستم" },
  { id: "ceo", name: "مدیر عامل" },
  { id: "internal_manager", name: "مدیر داخلی" }, // keep if you have ops lead
  { id: "it_manager", name: "مدیر فناوری اطلاعات" },

  // Clinical
  { id: "doctor", name: "پزشک" },
  { id: "head_nurse", name: "سرپرستار" },
  { id: "nurse", name: "پرستار" },
  { id: "receptionist", name: "مسئول پذیرش" },
  { id: "appointments_coordinator", name: "هماهنگ‌کننده نوبت‌ها" },

  // Finance & insurance
  { id: "accountant", name: "حسابدار" }, // ✅ (your request)
  { id: "finance_manager", name: "مدیر مالی" },
  { id: "cashier", name: "صندوقدار" },
  { id: "insurance_specialist", name: "کارشناس بیمه" },

  // Content/communications
  { id: "content_creator", name: "تولیدکننده محتوا" },
  { id: "content_editor", name: "ویراستار محتوا" },

  // Paraclinical / support (optional—keep only if relevant)
  { id: "lab_technician", name: "کارشناس آزمایشگاه" },
  { id: "radiology_technician", name: "کارشناس تصویربرداری" },
  { id: "pharmacist", name: "داروساز" },
  { id: "inventory_manager", name: "مدیر انبار" },
  { id: "procurement_officer", name: "کارشناس تدارکات" },
] as const;

export type RoleId = (typeof ROLES)[number]["id"];

export const ROLE_LABEL: Record<RoleId, string> = Object.fromEntries(
  ROLES.map((r) => [r.id, r.name])
) as Record<RoleId, string>;
