"use client";

import UserInfo from "./userInfo";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User } from "@/config/types/auth/types";
import { sidebarNavItems } from "@/config/constants/navItems";
import { canAccess } from "@/config/auth/rbac";
import { SECTION_BY_HREF, type Section } from "@/config/auth/sections";
import { Lock } from "lucide-react";

const isActivePath = (pathname: string, href: string) => {
  if (href === "/admin") return pathname === "/admin"; // exact match only
  return pathname === href || pathname.startsWith(href + "/");
};

export default function Sidebar({ user }: { user: User }) {
  const pathname = usePathname();

  return (
    <aside
      className="w-64 bg-white sticky top-0 shadow-md flex flex-col h-fit select-none pb-12"
      dir="rtl"
    >
      <UserInfo user={user} />
      <hr className="mx-4 border-0 h-[2px] bg-navbar-hover" />

      <nav
        className="flex-1 py-4 px-4 overflow-y-auto"
        aria-label="ناوبری پنل مدیریت"
      >
        <ul className="space-y-2">
          {sidebarNavItems.map(({ href, label, icon: Icon }) => {
            const section = SECTION_BY_HREF[href] as Section | undefined;
            const allowed = section
              ? canAccess(user?.role?.id, section)
              : false;
            const active = isActivePath(pathname, href);

            const base =
              "group flex items-center gap-3 px-3 py-2 rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-navbar-primary";
            const enabled = active
              ? "bg-navbar-primary text-white shadow-sm"
              : "text-gray-700 hover:bg-gray-100 hover:text-navbar-primary";
            const disabled = "text-gray-400 bg-gray-50 cursor-not-allowed";

            return (
              <li key={href}>
                {allowed ? (
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`${base} ${enabled}`}
                  >
                    <Icon
                      className={`w-5 h-5 shrink-0 transition-colors ${
                        active
                          ? "text-white"
                          : "text-gray-500 group-hover:text-navbar-primary"
                      }`}
                    />
                    <span className="text-sm font-medium truncate">
                      {label}
                    </span>
                  </Link>
                ) : (
                  <span
                    aria-disabled="true"
                    title="دسترسی ندارید"
                    className={`${base} ${disabled}`}
                    onClick={(e) => e.preventDefault()}
                  >
                    <Lock className="w-5 h-5 shrink-0" />
                    <span className="text-sm font-medium truncate">
                      {label}
                    </span>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
