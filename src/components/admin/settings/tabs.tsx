"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin/settings/organization/branches", label: "شعب" },
  { href: "/admin/settings/organization/departments", label: "دپارتمان‌ها" },
  { href: "/admin/settings/organization/roles", label: "عناوین شغلی" },
];

export default function Tabs() {
  const pathname = usePathname();
  return (
    <div className="flex gap-2 border-b">
      {items.map((it) => {
        const active = pathname?.startsWith(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`px-3 py-2 -mb-px border-b-3 rounded-t-md ${
              active
                ? "border-navbar-secondary text-navbar-secondary font-medium"
                : "border-transparent text-gray-600 hover:text-navbar-secondary"
            }`}
          >
            {it.label}
          </Link>
        );
      })}
    </div>
  );
}
