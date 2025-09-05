"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin/settings/organization/branches", label: "شعب" },
  { href: "/admin/settings/organization/departments", label: "دپارتمان‌ها" },
  { href: "/admin/settings/organization/roles", label: "نقش‌ها" },
  { href: "/admin/settings/organization/specialties", label: "تخصص‌ها" },
];

export default function Tabs() {
  const pathname = usePathname();
  return (
    <div className="border-b">
      <nav className="-mb-px flex gap-6">
        {TABS.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`shrink-0 border-b-2 px-1 pb-4 text-sm font-medium ${
                isActive
                  ? "border-sky-500 text-sky-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

