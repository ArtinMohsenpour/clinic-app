"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import {
  validateEmail,
  validateLoginPassword,
} from "@/lib/validators/validators";
import { LoginFormValues } from "@/config/types/auth/types";

export function LoginForm() {
  const [form, setForm] = useState<LoginFormValues>({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  // use this only for server/backend messages (auth errors, etc.)
  const [serverError, setServerError] = useState("");

  // UI gating
  const [touched, setTouched] = useState({ email: false, password: false });
  const [submitted, setSubmitted] = useState(false);

  // validations (raw)
  const emailErrRaw = validateEmail(form.email).error ?? null;
  const pwdErrRaw = validateLoginPassword(form.password).error ?? null;

  // show errors only when touched OR after submit attempt
  const emailErr = touched.email || submitted ? emailErrRaw : null;
  const pwdErr = touched.password || submitted ? pwdErrRaw : null;

  const handleEmailChange = (value: string) => {
    setServerError("");
    setForm((prev) => ({ ...prev, email: value.trim() }));
  };
  const handlePasswordChange = (value: string) => {
    setServerError("");
    setForm((prev) => ({ ...prev, password: value }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setServerError("");

    // block if client-side invalid
    if (emailErrRaw || pwdErrRaw) return;

    setIsLoading(true);
    try {
      const email = form.email.trim().toLowerCase();

      // 1) Pre-check by email (NOT session-based)
      const pre = await fetch("/api/auth/check-active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const { active } = await pre.json();
      if (active === false) {
        setServerError("حساب کاربری غیرفعال است. لطفاً با مدیریت تماس بگیرید.");
        return;
      }

      // 2) Proceed with BetterAuth sign-in
      const { error } = await authClient.signIn.email({
        email,
        password: form.password,
        callbackURL: "/admin",
      });

      if (error) {
        setServerError(error.message || "رمز عبور یا ایمیل اشتباه است.");
        return;
      }

      // On success BetterAuth will redirect; no further action required
    } catch (err) {
      setServerError(
        "An unexpected error occurred" +
          (err instanceof Error ? `: ${err.message}` : "")
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Disable submit while loading or if fields are empty (don’t block just because invalid;
  // let the user submit to reveal errors)
  const submitDisabled = isLoading || !form.email || !form.password;

  return (
    <div className="flex items-start justify-center pt-16 select-none">
      <div className="bg-white shadow-lg rounded-lg w-full max-w-md p-8">
        <h1 className="text-3xl font-bold text-center mb-6 text-navbar-primary">
          ورود به پنل مدیریت
        </h1>

        {/* Top banner: only server/back-end errors OR post-submit generic client notice */}
        {(serverError || (submitted && (emailErrRaw || pwdErrRaw))) && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-center">
            {serverError || "لطفاً خطاهای فرم را برطرف کنید."}
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
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              required
              inputMode="email"
              lang="en"
              aria-invalid={Boolean(emailErr)}
              aria-describedby={emailErr ? "email-error" : undefined}
            />
            {emailErr && (
              <p id="email-error" className="text-red-500 text-sm mt-1">
                {emailErr}
              </p>
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
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              required
              aria-invalid={Boolean(pwdErr)}
              aria-describedby={pwdErr ? "pwd-error" : undefined}
            />
            {pwdErr && (
              <p id="pwd-error" className="text-red-500 text-sm mt-1">
                {pwdErr}
              </p>
            )}
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
