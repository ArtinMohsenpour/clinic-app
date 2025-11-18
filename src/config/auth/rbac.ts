// src/config/auth/rbac.ts
import type { RoleId } from "@/config/constants/roles";
import type { Section } from "./sections";

const ALL_SECTIONS: readonly Section[] = [
  "dashboard",
  "appointments",
  "messages",
  "accounting",
  "staff-management",
  "medicine-inventory",
  "profile",
  "cms",
  "settings",
] as const;

export const ACCESS_MATRIX: Record<RoleId, readonly Section[]> = {
  // Leadership & ops
  admin: ALL_SECTIONS,
  ceo: ALL_SECTIONS,
  internal_manager: [
    "dashboard",
    "appointments",
    "messages",
    "medicine-inventory",
    "profile",
    "cms",
    "settings",
  ],
  it_manager: ALL_SECTIONS,

  // Clinical
  doctor: [
    "dashboard",
    "appointments",
    "messages",
    "profile",
    "medicine-inventory",
  ],
  head_nurse: [
    "dashboard",
    "appointments",
    "messages",
    "profile",
    "medicine-inventory",
  ],
  nurse: ["dashboard", "appointments", "messages", "profile"],
  receptionist: ["dashboard", "appointments", "messages", "profile"],
  appointments_coordinator: ["dashboard", "appointments", "profile"],

  // Finance & insurance
  accountant: ["dashboard", "accounting", "profile"],
  finance_manager: ["dashboard", "accounting", "profile"],
  cashier: ["dashboard", "accounting", "profile"],
  insurance_specialist: ["dashboard", "appointments", "messages", "profile"],

  // Content / communications
  content_creator: ["dashboard", "cms", "messages", "profile"],
  content_editor: ["dashboard", "cms", "messages", "profile"],

  // Paraclinical / support
  lab_technician: ["dashboard", "appointments", "messages", "profile"],
  radiology_technician: ["dashboard", "appointments", "messages", "profile"],
  pharmacist: ["dashboard", "messages", "profile", "medicine-inventory"],
  inventory_manager: ["dashboard", "messages", "medicine-inventory", "profile"],
  procurement_officer: ["dashboard", "messages", "profile"],
} as const;

export const canAccess = (role: RoleId | null | undefined, section: Section) =>
  role ? ACCESS_MATRIX[role]?.includes(section) === true : false;
