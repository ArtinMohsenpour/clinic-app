// lib/types.ts
export interface ValidationResult {
  isValid: boolean;
  error: string | null;
}

export interface LoginFormValues {
  email: string;
  password: string;
  name: string;
}
