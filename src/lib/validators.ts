// lib/validators.ts
import { ValidationResult } from "@/config/types/auth/types";

export function validateEmail(email: string): ValidationResult {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return { isValid: false, error: "ایمیل الزامی است." };
  if (!regex.test(email)) return { isValid: false, error: "ایمیل معتبر نیست." };
  return { isValid: true, error: null };
}

// For login (basic: length only)
export function validateLoginPassword(password: string): ValidationResult {
  if (!password) return { isValid: false, error: "رمز عبور الزامی است." };
  if (password.length < 8)
    return { isValid: false, error: "رمز عبور باید حداقل ۸ کاراکتر باشد." };
  return { isValid: true, error: null };
}

// For registration / CMS user creation (strict)
export function validateNewPassword(password: string): ValidationResult {
  if (!password) return { isValid: false, error: "رمز عبور الزامی است." };
  if (password.length < 8)
    return { isValid: false, error: "رمز عبور باید حداقل ۸ کاراکتر باشد." };
  if (password.length > 24)
    return { isValid: false, error: "رمز عبور نمی‌تواند بیشتر از ۲۴ کاراکتر باشد." };
  if (!/[0-9]/.test(password))
    return { isValid: false, error: "رمز عبور باید شامل حداقل یک عدد باشد." };
  if (!/[!@#$%^&*(),.?\":{}|<>]/.test(password))
    return {
      isValid: false,
      error: "رمز عبور باید شامل حداقل یک کاراکتر ویژه باشد.",
    };
  return { isValid: true, error: null };
}

