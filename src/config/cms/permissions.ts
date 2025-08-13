// src/config/permissions.ts
import type { RoleId } from "@/config/constants/roles"; // your file

export type Permission =
  // CMS
  | "cms.article.read"
  | "cms.article.create"
  | "cms.article.update"
  | "cms.article.delete"
  | "cms.branch.manage"
  | "cms.staff.manage"
  | "media.manage"
  // Appointments
  | "appt.read"
  | "appt.create"
  | "appt.update"
  | "appt.cancel"
  // Finance
  | "finance.read"
  | "finance.post" // creating invoices/payments, etc.
  // Admin & ops
  | "user.manage"
  | "audit.read";

export const ROLE_PERMISSIONS: Record<RoleId, ReadonlyArray<Permission>> = {
  // Leadership & ops
  admin: [
    "cms.article.read",
    "cms.article.create",
    "cms.article.update",
    "cms.article.delete",
    "cms.branch.manage",
    "cms.staff.manage",
    "media.manage",
    "appt.read",
    "appt.create",
    "appt.update",
    "appt.cancel",
    "user.manage",
    "audit.read",
    "finance.read",
    "finance.post",
  ],
  ceo: [
    "cms.article.read",
    "cms.branch.manage",
    "cms.staff.manage",
    "appt.read",
    "audit.read",
    "finance.read",
  ],
  internal_manager: [
    "cms.article.read",
    "cms.article.update",
    "cms.branch.manage",
    "cms.staff.manage",
    "media.manage",
    "appt.read",
    "appt.update",
    "audit.read",
  ],
  it_manager: ["audit.read", "user.manage"],

  // Clinical
  doctor: ["appt.read", "appt.update", "audit.read"],
  head_nurse: ["appt.read", "appt.update", "audit.read"],
  nurse: ["appt.read", "appt.update"],

  // Front desk
  receptionist: ["appt.read", "appt.create", "appt.cancel"],

  appointments_coordinator: [
    "appt.read",
    "appt.create",
    "appt.update",
    "appt.cancel",
    "audit.read",
  ],

  // Finance & insurance
  accountant: ["finance.read", "finance.post", "audit.read"],
  finance_manager: [
    "finance.read",
    "finance.post",
    "audit.read",
    "user.manage",
  ],
  cashier: ["finance.read", "finance.post"],
  insurance_specialist: ["appt.read"],

  // Content
  content_creator: [
    "cms.article.read",
    "cms.article.create",
    "cms.article.update",
    "media.manage",
  ],
  content_editor: ["cms.article.read", "cms.article.update", "media.manage"],

  // Paraclinical / support
  lab_technician: ["appt.read"],
  radiology_technician: ["appt.read"],
  pharmacist: ["appt.read"],
  inventory_manager: ["audit.read"],
  procurement_officer: ["audit.read"],
};

export function roleHas(role: RoleId, perm: Permission) {
  return ROLE_PERMISSIONS[role]?.includes(perm) ?? false;
}

export function roleHasAny(role: RoleId, perms: Permission[]) {
  return perms.some((p) => roleHas(role, p));
}

export function roleHasAll(role: RoleId, perms: Permission[]) {
  return perms.every((p) => roleHas(role, p));
}
