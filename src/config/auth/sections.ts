// src/config/auth/sections.ts
export const SECTIONS = [
  "dashboard",
  "appointments",
  "messages",
  "accounting",
  "staff-management",
  "medicine-inventory", // ✅ new section
  "profile",
  "cms",
  "settings",
] as const;

export type Section = (typeof SECTIONS)[number];

export const SECTION_BY_HREF: Record<string, Section> = {
  "/admin": "dashboard",
  "/admin/appointments": "appointments",
  "/admin/messages": "messages",
  "/admin/accounting": "accounting",
  "/admin/staff-management": "staff-management",
  "/admin/medicine-inventory": "medicine-inventory", // ✅
  "/admin/profile": "profile",
  "/admin/cms": "cms",
  "/admin/settings": "settings",
} as const;
