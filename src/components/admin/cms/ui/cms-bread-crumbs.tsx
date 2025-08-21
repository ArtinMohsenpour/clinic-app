"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

type Crumb = {
  label: string;
  href?: string; // if omitted => current page (no link)
};

export default function CmsBreadcrumbs({
  items,
  backHref,
  rightSlot,
  className = "",
}: {
  items: Crumb[];
  backHref?: string; // optional explicit back link
  rightSlot?: React.ReactNode; // e.g., a button area on the left
  className?: string;
}) {
  const router = useRouter();

  return (
    <nav
      dir="rtl"
      aria-label="breadcrumb"
      className={`rounded-2xl bg-white py-2 md:px-4 shadow-sm border-r-7 border-r-navbar-secondary select-none ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Breadcrumbs trail */}
        <ol className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pr-1">
          {items.map((c, i) => {
            const isLast = i === items.length - 1;
            return (
              <li key={i} className="flex items-center gap-2">
                {c.href && !isLast ? (
                  <Link
                    href={c.href}
                    className="text-sm text-navbar-secondary hover:underline"
                  >
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-sm font-semibold text-gray-800">
                    {c.label}
                  </span>
                )}
                {!isLast && (
                  <ChevronLeft
                    className="w-4 h-4 text-gray-400 shrink-0"
                    aria-hidden
                  />
                )}
              </li>
            );
          })}
        </ol>

        {/* Left side: Back / custom actions */}
        <div className="flex items-center gap-2">
          {rightSlot}
          <button
            type="button"
            onClick={() =>
              backHref ? (window.location.href = backHref) : router.back()
            }
            className="px-3 py-1.5 rounded-lg border hover:bg-gray-200 text-sm  cursor-pointer"
          >
            بازگشت
          </button>
        </div>
      </div>
    </nav>
  );
}
