// lib/types.ts
import { Session } from "better-auth";
import type { RoleId } from "@/config/constants/roles";

// ----- Auth / forms -----
export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
}

export interface CreateUserValues {
  firstName: string;
  lastName: string;
  username?: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  role: RoleId; // ✅ use RoleId
}

export interface SignUpFormValues {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  role: RoleId; // ✅ use RoleId
}

export interface ValidationResult {
  isValid: boolean;
  error: string | null;
}

export interface LoginFormValues {
  email: string;
  password: string;
}

// ✅ Remove the ad-hoc UserRole union; rely on RoleId everywhere.

// ----- Domain models carried in session / UI -----
export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;

  // If you keep both, type them consistently:
  roleId: RoleId; // ✅ strongly-typed
  role: {
    id: RoleId; // ✅ strongly-typed
    name: string; // Persian label from ROLE_LABEL[role.id]
  };

  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AppSession extends Session {
  user: AuthUser;
}

// This is the lighter-weight user you pass to client components
export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  phone?: string | null;
  address?: string | null;
  isActive?: boolean;
  createdAt: string; // ISO strings on client are fine
  updatedAt: string;
  role?: {
    id: RoleId; // ✅ strongly-typed
    name: string; // Persian label
  } | null;
}

export interface ProfileState {
  secondaryEmail: string;
  locale: string;
  timezone: string;
  notifyByEmail: boolean;
  emergencyName: string;
  emergencyPhone: string;
};