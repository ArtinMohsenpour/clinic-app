"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { validateEmail, validateLoginPassword } from "@/lib/validators";
import { LoginFormValues } from "@/config/types/auth/types";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const [form, setForm] = useState<LoginFormValues>({
    email: "",
    password: "",
  });
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("");

  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleEmailChange = (value: string) => {
    setForm((prev) => ({ ...prev, email: value }));
    setEmailError(validateEmail(value).error);
  };

  const handlePasswordChange = (value: string) => {
    setForm((prev) => ({ ...prev, password: value }));
    setPasswordError(validateLoginPassword(value).error);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const { data, error } = await authClient.signIn.email({
        email: form.email,
        password: form.password,
        callbackURL: "/admin",
      });

      if (error) {
        setError("رمز عبور یا ایمیل اشتباه است.");
      }
    } catch (err) {
      setError(
        "An unexpected error occurred" +
          (err instanceof Error ? `: ${err.message}` : "")
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-start justify-center pt-16 select-none">
      <div className="bg-white shadow-lg rounded-lg w-full max-w-md p-8">
        <h1 className="text-3xl font-bold text-center mb-6 text-navbar-primary">
          ورود به پنل مدیریت
        </h1>
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-center">
            {error}
          </div>
        )}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-md font-medium text-gray-700 mb-1">
              ایمیل
            </label>
            <input
              type="email"
              className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 ${
                emailError
                  ? "border-red-500 focus:ring-red-300"
                  : "border-gray-300 focus:ring-navbar-secondary"
              } ltr-input`}
              placeholder="username@asr-salamat.ir"
              value={form.email}
              onChange={(e) => handleEmailChange(e.target.value)}
              required
            />
            {emailError && (
              <p className="text-red-500 text-sm mt-1">{emailError}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              رمز عبور
            </label>
            <input
              type="password"
              className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 ${
                passwordError
                  ? "border-red-500 focus:ring-red-300"
                  : "border-gray-300 focus:ring-navbar-secondary"
              } ltr-input`}
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              required
            />
            {passwordError && (
              <p className="text-red-500 text-sm mt-1">{passwordError}</p>
            )}
          </div>
          <button
            type="submit"
            className="w-full bg-navbar-secondary text-white py-2 rounded hover:bg-navbar-hover transition"
          >
            {isLoading ? "در حال ورود ..." : "ورود"}
          </button>
        </form>
        <div className="flex justify-between items-center mt-6 text-sm">
          <div className="text-sm text-gray-500">
            در صورت فراموشی رمز عبور با پشتیبانی یا مدیریت تماس بگیرید.
          </div>
        </div>
      </div>
    </div>
  );
}