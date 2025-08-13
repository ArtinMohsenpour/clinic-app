"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export type Role = { id: string; key: string; name: string };
export type UserRow = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  isActive: boolean;
  roles: { role: Role }[];
};

export default function StaffManagementPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // فیلترها
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    void fetchAll();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      void fetchAll();
    }, 300);
    return () => clearTimeout(t);
  }, [q, roleFilter]);

  async function fetchAll() {
    try {
      setLoading(true);
      setError(null);

      const r = await fetch("/api/admin/roles", { cache: "no-store" });
      if (!r.ok) throw new Error("خطا در دریافت نقش‌ها");
      const rolesJson: Role[] = await r.json();
      setRoles(rolesJson);

      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (roleFilter !== "all") params.set("role", roleFilter);
      const u = await fetch(`/api/admin/users?${params.toString()}`, {
        cache: "no-store",
      });
      if (!u.ok) throw new Error("خطا در دریافت کاربران");
      const usersJson: UserRow[] = await u.json();
      setUsers(usersJson);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setError(e.message ?? "دریافت اطلاعات با خطا مواجه شد");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      dir="rtl"
      className="p-6 pb-12 space-y-5 bg-white rounded-2xl shadow-sm"
    >
      {/* هدر */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between select-none">
        <div>
          <h1 className="text-2xl font-semibold text-navbar-primary">
            مدیریت کارکنان
          </h1>
          <p className="text-sm text-navbar-text">
            ساخت حساب جدید و مدیریت دسترسی اعضای تیم کلینیک
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/staff-management/create-user"
            className="px-4 py-2 rounded-xl text-sm bg-cms-primary text-white hover:bg-emerald-700 shadow-sm"
          >
            ایجاد کاربر
          </Link>
          <button
            className="px-4 py-2 rounded-xl text-sm border border-navbar-active hover:bg-navbar-hover hover:text-white cursor-pointer inline-flex items-center gap-2"
            onClick={fetchAll}
            aria-label="نوسازی"
          >
            نوسازی
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0114.65-3.36L23 10"></path>
              <path d="M20.49 15a9 9 0 01-14.65 3.36L1 14"></path>
            </svg>
          </button>
        </div>
      </div>

      {/* فیلترها */}
      <div className="rounded-2xl border border-navbar-active bg-background p-4 select-none">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="جستجو بر اساس نام، ایمیل یا شماره…"
            className="w-full rounded-xl border border-navbar-active bg-white px-3 py-2 text-navbar-primary placeholder:text-gray-400"
          />

          {/* سلکت با فلش سفارشی و فاصله داخلی کافی */}
          <div className="relative">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="appearance-none w-full rounded-xl border border-navbar-active bg-white px-3 py-2 pl-10 cursor-pointer"
            >
              <option value="all">همه نقش‌ها</option>
              {roles.map((r) => (
                <option key={r.id} value={r.key}>
                  {r.name}
                </option>
              ))}
            </select>
            {/* آیکن فلش در سمت چپ (با RTL هماهنگ) */}
            <svg
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navbar-text"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden
            >
              <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.176l3.71-2.946a.75.75 0 11.94 1.166l-4.2 3.334a.75.75 0 01-.94 0l-4.2-3.334a.75.75 0 01.02-1.166z" />
            </svg>
          </div>

          <div className="flex gap-2">
            <button
              className="px-4 py-2 rounded-xl border border-navbar-active bg-white hover:bg-navbar-hover hover:text-white text-sm cursor-pointer"
              onClick={() => {
                setQ("");
                setRoleFilter("all");
              }}
            >
              بازنشانی فیلترها
            </button>
          </div>
        </div>
      </div>

      {/* جدول کاربران */}
      <div className="rounded-2xl border border-navbar-active overflow-hidden shadow-sm select-none">
        <table className="w-full text-sm">
          <thead className="bg-navbar-primary">
            <tr className="text-right text-white">
              <th className="px-4 py-3 font-medium"></th>
              <th className="pl-4 py-3 font-medium">نام</th>
              <th className="px-4 py-3 font-medium">ایمیل</th>
              <th className="px-4 py-3 font-medium ">شماره تلفن</th>
              <th className="px-4 py-3 font-medium">نقش‌ها</th>
              <th className="px-4 py-3 font-medium">وضعیت</th>
              <th className="px-4 py-3 font-medium text-center">ادیت</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-navbar-text"
                >
                  در حال بارگذاری…
                </td>
              </tr>
            )}
            {!loading && users.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-navbar-text"
                >
                  کاربری یافت نشد.
                </td>
              </tr>
            )}
            {users.map((u, idx) => (
              <tr
                key={u.id}
                className={`border-b border-navbar-active ${
                  idx % 2 ? "bg-white" : "bg-gray-50/40"
                } hover:bg-gray-100 `}
              >
                <td className="px-3 py-3 font-medium text-navbar-primary select-none">
                  {idx + 1}
                </td>
                <td className="pl-4 py-3 font-medium text-navbar-primary select-text">
                  {u.name}
                </td>
                <td className="px-4 py-3">
                  <span
                    dir="ltr"
                    className="inline-block px-2 py-0.5 rounded-md bg-white border border-navbar-active text-navbar-primary  select-text ltr-input"
                  >
                    {u.email}
                  </span>
                </td>
                <td className="px-4 py-3 text-navbar-primary  select-text ltr-input text-right">
                  {u.phone?.trim()?.length ? u.phone : "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {u.roles?.length ? (
                      u.roles.map((ur, i) => (
                        <span
                          key={u.id + i}
                          className="px-2 py-1 rounded-full bg-white border border-navbar-active text-xs text-navbar-secondary"
                        >
                          {ur.role.name}
                        </span>
                      ))
                    ) : (
                      <span className="px-2 py-1 rounded-full bg-white border border-navbar-active text-xs text-navbar-text">
                        بدون نقش
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        u.isActive ? "bg-emerald-500" : "bg-rose-500"
                      }`}
                    ></span>
                    {u.isActive ? (
                      <span className="text-emerald-600">فعال</span>
                    ) : (
                      <span className="text-rose-600">غیرفعال</span>
                    )}
                  </span>
                </td>
                <td className="px-4 py-3 text-left">
                  <Link
                    href={`/admin/staff-management/update-user/${u.id}`}
                    className="inline-block px-3 py-1.5 rounded-lg border border-navbar-active bg-white hover:bg-navbar-hover hover:text-white"
                  >
                    ویرایش
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error && <div className="text-sm text-rose-600">{error}</div>}
    </div>
  );
}

/*
API موردنیاز:
- GET /api/admin/roles → Role[]
- GET /api/admin/users?q=&role= → UserRow[] با roles: [{ role: { id, key, name } }]
مسیردهی:
- ایجاد: /admin/staff-management/create-user
- ویرایش: /admin/staff-management/update-user/[id]
تمامی endpoint ها باید در سرور RBAC داشته باشند.
*/
