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

export interface User  {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  phone?: string | null;
  address?: string | null;
  isActive?: boolean; // if you have this column
  createdAt: string;   // converted to ISO string before sending to client
  updatedAt: string;   // converted to ISO string before sending to client
  role?: {
    id: string;
    name: string;
  } | null;
};