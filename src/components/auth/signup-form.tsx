"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { validateEmail, validatePassword } from "@/lib/validators";
import { SignupFormValues } from "@/config/types/auth/types"; // You might want a SignUpFormValues type
import { useRouter } from "next/navigation";

export function SignUpForm() {
  const [form, setForm] = useState<SignupFormValues>({
    email: "",
    password: "",
    name:""
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));

    if (field === "email") setEmailError(validateEmail(value).error);
    if (field === "password") setPasswordError(validatePassword(value).error);
  };


  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const { data, error } = await authClient.signUp.email({
        email: form.email,
        password: form.password,
        name: form.name,
        callbackURL: "/admin", // redirect after successful sign-up
      });

      if (error) {
        setError(error.message || "ثبت‌نام ناموفق بود");
      } else {
        setSuccess("ثبت‌نام با موفقیت انجام شد!");
        // router.push("/admin"); // optional automatic redirect
      }
    } catch (err) {
      setError("یک خطای غیرمنتظره رخ داد");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-start justify-center pt-16">
      <div className="bg-white shadow-lg rounded-lg w-full max-w-md p-8">
        <h1 className="text-3xl font-bold text-center mb-6 text-navbar-primary">
          ثبت‌نام کاربر جدید
        </h1>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-md font-medium text-gray-700 mb-1">
              نام
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navbar-secondary"
              placeholder="نام کامل شما"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
            />
          </div>

          {/* Email */}
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
              }`}
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              required
            />
            {emailError && (
              <p className="text-red-500 text-sm mt-1">{emailError}</p>
            )}
          </div>

          {/* Password */}
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
              }`}
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => handleChange("password", e.target.value)}
              required
            />
            {passwordError && (
              <p className="text-red-500 text-sm mt-1">{passwordError}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-navbar-secondary text-white py-2 rounded hover:bg-navbar-hover transition"
            disabled={isLoading}
          >
            {isLoading ? "در حال ثبت‌نام..." : "ثبت‌نام"}
          </button>
        </form>

        <div className="flex justify-between items-center mt-6 text-sm text-gray-500">
          قبلاً حساب دارید؟ وارد شوید.
        </div>
      </div>
    </div>
  );
}