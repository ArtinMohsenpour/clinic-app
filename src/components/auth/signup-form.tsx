"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { validateEmail, validateNewPassword } from "@/lib/validators";
import { useRouter } from "next/navigation";
import { SignUpFormValues } from "@/config/types/auth/types";
import type { RoleId } from "@/config/constants/roles";

interface Props {
  roles: { id: string; name: string }[]; // (was RoleId)
}

export function SignUpForm({ roles = [] }: Props) {
  const defaultRole = roles[0]?.id as RoleId | undefined;
  const [form, setForm] = useState<SignUpFormValues>({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    role: defaultRole ?? "receptionist",
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
    if (field === "password")
      setPasswordError(validateNewPassword(value).error);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    console.log("Submitting form:", form);

    if (emailError || passwordError) {
      setError("لطفاً خطاهای فرم را برطرف کنید.");
      return;
    }
    if (!form.role) {
      setError("نقش را انتخاب کنید.");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await authClient.signUp.email({
        email: form.email,
        password: form.password,
        name: `${form.firstName} ${form.lastName}`,
        callbackURL: "/admin",
      });
      router.replace("/admin");
      router.refresh();

      if (error) {
        setError("ثبت‌نام ناموفق بود، کاربر ممکن است وجود داشته باشد.");
        return;
      }

      const res = await fetch("/api/users/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email, // or userId if you have it
          name: `${form.firstName} ${form.lastName}`,
          phone: form.phone ?? "",
          address: form.address ?? "",
          role: form.role, // e.g., "finance_manager"
        }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "خطا در ذخیرهٔ اطلاعات پروفایل");
      }

      setSuccess("ثبت‌نام با موفقیت انجام شد!");
      setForm({
        firstName: "",
        lastName: "",
        username: "",
        email: "",
        password: "",
        phone: "",
        address: "",
        role: (roles[0]?.id as RoleId) ?? "receptionist",
      });

      router.push("/admin");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "یک خطای غیرمنتظره رخ داد");
      } else {
        setError("یک خطای غیرمنتظره رخ داد");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-start justify-center pt-16">
      <div className="bg-white shadow-lg rounded-lg w-full max-w-2xl p-8">
        <h1 className="text-3xl font-bold text-center mb-6 text-navbar-primary">
          ثبت‌نام کاربر جدید
        </h1>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 text-green-700 p-3 rounded mb-4 text-center">
            {success}
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-4">
          {/* First Name */}
          <div>
            <label className="block text-md font-medium text-gray-700 mb-1">
              نام
            </label>
            <input
              type="text"
              value={form.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 border-gray-300 focus:ring-navbar-secondary"
              placeholder="مثلاً: علی"
              required
            />
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-md font-medium text-gray-700 mb-1">
              نام خانوادگی
            </label>
            <input
              type="text"
              value={form.lastName}
              onChange={(e) => handleChange("lastName", e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 border-gray-300 focus:ring-navbar-secondary"
              placeholder="مثلاً: رضایی"
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

          {/* Phone */}
          <div>
            <label className="block text-md font-medium text-gray-700 mb-1">
              تلفن (اختیاری)
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 border-gray-300 focus:ring-navbar-secondary"
              placeholder="۰۹۱۲۱۲۳۴۵۶۷"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-md font-medium text-gray-700 mb-1">
              آدرس (اختیاری)
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => handleChange("address", e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 border-gray-300 focus:ring-navbar-secondary"
              placeholder="خیابان ولیعصر، تهران"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-md font-medium text-gray-700 mb-1">
              نقش
            </label>
            <select
              value={form.role}
              onChange={(e) => handleChange("role", e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 border-gray-300 focus:ring-navbar-secondary"
              required
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
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
