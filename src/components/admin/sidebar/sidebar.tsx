"use client";
import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Sidebar({
  user,
}: {
  user: { name: string; email: string };
}) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  const logoutHandle = async () => {
    await authClient.signOut();
    setIsLoggedIn(false);
    window.location.href = "/";
    router.push("/");
  };

  return (
    <aside className="w-64 bg-white sticky shadow-md flex flex-col h-full">
      {/* Top section: User info */}
      <div className="p-6 ">
        <h1 className="text-2xl font-bold mb-2">پنل مدیریت</h1>
        <div className="mb-4">
          <p className="text-gray-700">
            <strong>کاربر:</strong> {user.name}
          </p>
        </div>
        <button
          onClick={logoutHandle}
          className="w-fit text-sm bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition"
        >
          خروج از سایت
        </button>
      </div>

      {/* Bottom section: Navigation */}
      <nav className="flex-1 p-6">
        <ul className="space-y-3">
          <li className="hover:text-navbar-primary cursor-pointer">داشبورد</li>
          <li className="hover:text-navbar-primary cursor-pointer">نوبت‌ها</li>
          <li className="hover:text-navbar-primary cursor-pointer">پروفایل</li>
          <li className="hover:text-navbar-primary cursor-pointer">تنظیمات</li>
          <li className="hover:text-navbar-primary cursor-pointer">CMS</li>
        </ul>
      </nav>
    </aside>
  );
}
