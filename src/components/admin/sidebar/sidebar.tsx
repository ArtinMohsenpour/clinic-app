import UserInfo from "./userInfo";
import Link from "next/link";
import { User } from "@/config/types/auth/types";

export default function Sidebar({ user }: { user: User }) {
  return (
    <aside className="w-64 bg-white sticky shadow-md flex flex-col h-full">
      {/* Top section: User info */}
      <UserInfo user={user} />
      <hr className="mx-4 border-0 h-[2px] bg-navbar-hover" />

      {/* Bottom section: Navigation */}
      <nav className="flex-1 py-4 px-6">
        <ul className="space-y-3">
          <Link
            href="/admin"
            className="hover:text-navbar-primary cursor-pointer"
          >
            داشبورد
          </Link>

          <li>
            <a
              href="admin/appointments"
              className="hover:text-navbar-primary cursor-pointer"
            >
              نوبت‌ها
            </a>
          </li>
          <li>
            <a
              href="admin/profile"
              className="hover:text-navbar-primary cursor-pointer"
            >
              پروفایل
            </a>
          </li>
          <li>
            <a
              href="admin/settings"
              className="hover:text-navbar-primary cursor-pointer"
            >
              تنظیمات
            </a>
          </li>
          <li>
            <a
              href="admin/cms"
              className="hover:text-navbar-primary cursor-pointer"
            >
              CMS
            </a>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
