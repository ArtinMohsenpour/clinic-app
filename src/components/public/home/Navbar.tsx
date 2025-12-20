"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";

// Define the Menu Item structure to support nested children
type MenuItem = {
  title: string;
  href: string;
  children?: { title: string; href: string }[];
};

const MENU_ITEMS: MenuItem[] = [
  {
    title: "خدمات",
    href: "/services",
    children: [
      { title: "خدمات درمانی", href: "/services" }, // 1. Services
      { title: "فرم‌ها و مدارک", href: "/forms" }, // 2. Forms
      { title: "آموزش بیماران", href: "/education" }, // 3. Patient Education
      { title: "فرصت های شغلی", href: "/jobs" }, // 3. Patient Education
      { title: "سوالات متداول", href: "/faq" }, // 3. Patient Education
    ],
  },
  { title: "نحوه پذیرش", href: "/patient-intake" },
  { title: "مقالات", href: "/articles" },
  { title: "شعبه‌ها", href: "/branches" },
  { title: "پرسنل", href: "/staff" },
  { title: "تماس با ما", href: "/contact" },
];

export function Navbar({ user }: { user?: { name: string } }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  // State for Mobile Submenu Toggles
  const [mobileSubmenu, setMobileSubmenu] = useState<string | null>(null);

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
    setMobileSubmenu(null);
  }, [pathname]);

  const checkActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const logoutHandle = async () => {
    await authClient.signOut();
    router.replace("/");
    router.refresh();
  };

  const toggleMobileSubmenu = (title: string) => {
    setMobileSubmenu(mobileSubmenu === title ? null : title);
  };

  // Helper class string for active/inactive links
  const getLinkClasses = (
    href: string,
    isMobile = false,
    isActiveOverride?: boolean
  ) => {
    const isActive = isActiveOverride ?? checkActive(href);
    const baseClasses =
      "transition-all duration-200 font-bold flex items-center gap-1";

    if (isMobile) {
      return `${baseClasses} block px-4 py-3 rounded-xl border w-full text-right ${
        isActive
          ? "bg-navbar-secondary/5 text-navbar-secondary border-navbar-secondary/20 shadow-sm"
          : "border-transparent text-gray-600 hover:bg-gray-50 hover:text-navbar-secondary"
      }`;
    }

    // Desktop classes
    return `${baseClasses} px-3 py-2 rounded-lg ${
      isActive
        ? "text-navbar-secondary bg-navbar-secondary/5"
        : "text-navbar-text hover:text-navbar-secondary hover:bg-navbar-hover hover:text-white"
    }`;
  };

  return (
    <nav className="bg-white text-navbar-text shadow-sm sticky top-0 font-yekan transition-all duration-300 z-[100]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 select-none">
          {/* --- RIGHT SIDE (RTL Start) --- */}
          <div className="flex items-center gap-4">
            {/* Mobile Hamburger Button */}
            <div className="lg:hidden z-50">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="group flex flex-col justify-center items-center w-10 h-10 gap-1.5 focus:outline-none"
                aria-label="Toggle menu"
                aria-expanded={isOpen}
              >
                <span
                  className={`block h-0.5 w-6 bg-navbar-secondary rounded-full transition-all duration-300 ease-in-out origin-center ${
                    isOpen ? "rotate-45 translate-y-2" : ""
                  }`}
                />
                <span
                  className={`block h-0.5 w-6 bg-navbar-secondary rounded-full transition-all duration-300 ease-in-out ${
                    isOpen ? "opacity-0 translate-x-full" : "opacity-100"
                  }`}
                />
                <span
                  className={`block h-0.5 w-6 bg-navbar-secondary rounded-full transition-all duration-300 ease-in-out origin-center ${
                    isOpen ? "-rotate-45 -translate-y-2" : ""
                  }`}
                />
              </button>
            </div>

            {/* Desktop Brand */}
            <Link href="/" className="hidden lg:flex items-center gap-3 group">
              <div className="relative h-16 w-16">
                <Image
                  src="/assets/images/logo-asr.png"
                  alt="Clinic Logo"
                  fill
                  priority
                  className="object-contain group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <div className="flex flex-col items-start justify-center">
                <span className="text-navbar-secondary font-nastaliq text-5xl leading-tight -mt-1">
                  عصر سلامت
                </span>
              </div>
            </Link>
          </div>

          {/* --- CENTER: Desktop Navigation --- */}
          <ul className="hidden lg:flex items-center space-x-6 space-x-reverse relative">
            {MENU_ITEMS.map((item) => (
              <li
                key={item.title}
                className="relative group h-full flex items-center"
              >
                {item.children ? (
                  // Dropdown Parent
                  <div className="relative">
                    <button
                      className={`${getLinkClasses(
                        item.href
                      )} group-hover:text-navbar-secondary cursor-pointer`}
                    >
                      {item.title}
                      <ChevronDown
                        size={16}
                        className="transition-transform duration-200 group-hover:rotate-180"
                      />
                    </button>

                    {/* Dropdown Menu (Hover) */}
                    <div className="absolute top-full right-0 w-56 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-out transform translate-y-2 group-hover:translate-y-0 z-50">
                      <div className="bg-white rounded-xl shadow-xl border border-gray-300 overflow-hidden py-1">
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={`block px-4 py-3 text-sm font-bold transition-colors hover:bg-gray-100 text-right ${
                              checkActive(child.href)
                                ? "text-navbar-secondary bg-navbar-secondary/5"
                                : "text-gray-600 hover:text-navbar-secondary"
                            }`}
                          >
                            {child.title}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Standard Link
                  <Link href={item.href} className={getLinkClasses(item.href)}>
                    {item.title}
                  </Link>
                )}
              </li>
            ))}
          </ul>
          <Link
            href="/"
            className="flex sm:hidden flex-col items-start justify-center"
          >
            <span className="text-navbar-secondary font-nastaliq text-5xl leading-tight -mt-1">
              عصر سلامت
            </span>
          </Link>

          {/* --- LEFT SIDE (RTL End) --- */}
          <div className="flex items-center">
            {/* Mobile Logo */}
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="lg:hidden relative h-12 w-12 block"
            >
              <Image
                src="/assets/images/logo-asr.png"
                alt="Clinic Logo"
                fill
                priority
                className="object-contain"
              />
            </Link>

            {/* Desktop Auth Buttons */}
            <div className="hidden lg:flex items-center gap-3">
              {!user ? (
                <Link href="/login" className={getLinkClasses("/login")}>
                  ورود پرسنل
                </Link>
              ) : (
                <>
                  <Link href="/admin" className={getLinkClasses("/admin")}>
                    پنل کاربری
                  </Link>
                  <button
                    onClick={logoutHandle}
                    className="text-white text-sm rounded-full px-5 py-2 bg-navbar-secondary hover:bg-navbar-secondary/90 shadow-md hover:shadow-lg transition-all duration-300 font-bold"
                  >
                    خروج
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- Mobile Menu --- */}
      <div
        className={`lg:hidden bg-white overflow-hidden transition-[max-height,opacity] duration-500 ease-in-out border-b border-gray-100 ${
          isOpen
            ? "max-h-[800px] opacity-100 shadow-inner"
            : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-6 py-6 space-y-2">
          {MENU_ITEMS.map((item) => (
            <div key={item.title}>
              {item.children ? (
                // Mobile Dropdown Item
                <div className="space-y-1">
                  <button
                    onClick={() => toggleMobileSubmenu(item.title)}
                    className={`${getLinkClasses(
                      item.href,
                      true,
                      mobileSubmenu === item.title
                    )} justify-between`}
                  >
                    <span>{item.title}</span>
                    <ChevronDown
                      size={18}
                      className={`transition-transform duration-300 ${
                        mobileSubmenu === item.title ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Collapsible Submenu */}
                  <div
                    className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                      mobileSubmenu === item.title
                        ? "grid-rows-[1fr]"
                        : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="mr-4 border-r-2 border-gray-100 space-y-1 mt-1 pr-3">
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={`block px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
                              checkActive(child.href)
                                ? "text-navbar-secondary bg-navbar-secondary/5"
                                : "text-gray-500 hover:text-navbar-secondary hover:bg-gray-50"
                            }`}
                          >
                            {child.title}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Standard Mobile Link
                <Link
                  href={item.href}
                  className={getLinkClasses(item.href, true)}
                >
                  {item.title}
                </Link>
              )}
            </div>
          ))}

          {/* Mobile Auth Actions */}
          <div className="border-t border-gray-100 pt-5 mt-4 space-y-3">
            {!user ? (
              <Link
                href="/login"
                className={`flex items-center justify-center w-full px-4 py-3 rounded-xl text-base font-bold transition-all duration-200 ${
                  checkActive("/login")
                    ? "bg-navbar-secondary text-white shadow-lg shadow-navbar-secondary/30"
                    : "border-2 border-navbar-secondary text-navbar-secondary hover:bg-navbar-secondary hover:text-white"
                }`}
              >
                ورود پرسنل
              </Link>
            ) : (
              <>
                <Link
                  href="/admin"
                  className="block w-full px-4 py-3 rounded-xl text-center text-base font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  پنل کاربری
                </Link>
                <button
                  onClick={logoutHandle}
                  className="w-full px-4 py-3 rounded-xl text-center text-base font-bold bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                >
                  خروج از سایت
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}