// lib/types.ts
import { Session } from "better-auth";

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
  role: string;
}
export interface SignUpFormValues {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  role: string;
}

export interface ValidationResult {
  isValid: boolean;
  error: string | null;
}

export interface LoginFormValues {
  email: string;
  password: string;
}

export type UserRole =
  | "admin"
  | "ceo"
  | "manager"
  | "internal_manager"
  | "doctor"
  | "nurse"
  | "receptionist"
  | "content_creator"
  | "it_manager";

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roleId: string;
  role: {
    id: string;
    name: UserRole;
  };
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AppSession extends Session {
  user: AuthUser;
}