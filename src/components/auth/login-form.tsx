"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { validateEmail, validateLoginPassword } from "@/lib/validators";
import { LoginFormValues } from "@/config/types/auth/types";

export function LoginForm() {
  const [form, setForm] = useState<LoginFormValues>({
    email: "",
    password: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const emailErr = validateEmail(form.email).error ?? null;
  const pwdErr = validateLoginPassword(form.password).error ?? null;

  const handleEmailChange = (value: string) => {
    const v = value.trim(); // normalize early
    setForm((prev) => ({ ...prev, email: v }));
  };
  const handlePasswordChange = (value: string) => {
    setForm((prev) => ({ ...prev, password: value }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // validate BEFORE loading
    if (emailErr || pwdErr) {
      setError("لطفاً خطاهای فرم را برطرف کنید.");
      return;
    }

    setIsLoading(true);
    try {
      const email = form.email.trim().toLowerCase();

      const { error } = await authClient.signIn.email({
        email,
        password: form.password,
        callbackURL: "/admin",
      });

      if (error) {
        // console.error("signIn.email error:", error); // uncomment while debugging
        setError(error.message || "رمز عبور یا ایمیل اشتباه است.");
        return; // <- important: stop here
      }

      // BetterAuth will redirect via callbackURL; nothing else needed
    } catch (err) {
      setError(
        "An unexpected error occurred" +
          (err instanceof Error ? `: ${err.message}` : "")
      );
    } finally {
      setIsLoading(false);
    }
  };

  const submitDisabled = isLoading || !!emailErr || !!pwdErr;

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
              autoComplete="username"
              className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 ${
                emailErr
                  ? "border-red-500 focus:ring-red-300"
                  : "border-gray-300 focus:ring-navbar-secondary"
              } ltr-input`}
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => handleEmailChange(e.target.value)}
              required
              inputMode="email"
              lang="en"
            />
            {emailErr && (
              <p className="text-red-500 text-sm mt-1">{emailErr}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              رمز عبور
            </label>
            <input
              type="password"
              autoComplete="current-password"
              className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 ${
                pwdErr
                  ? "border-red-500 focus:ring-red-300"
                  : "border-gray-300 focus:ring-navbar-secondary"
              } ltr-input`}
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              required
            />
            {pwdErr && <p className="text-red-500 text-sm mt-1">{pwdErr}</p>}
          </div>

          <button
            type="submit"
            className="w-full bg-navbar-secondary text-white py-2 rounded hover:bg-navbar-hover transition disabled:opacity-60"
            disabled={submitDisabled}
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