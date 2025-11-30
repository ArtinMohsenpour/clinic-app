"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useState, useEffect } from "react";
import "./Navbar.css";

// Define menu items outside the component to prevent re-creation on every render
const MENU_ITEMS = [
  { title: "خدمات", href: "/services" },
  { title: "درباره ما", href: "/about" },
  { title: "مقالات", href: "/articles" },
  { title: "شعبه‌ها", href: "/branches" },
  { title: "پرسنل", href: "/staff" },
  { title: "تماس با ما", href: "/contact" },
];

export function Navbar({ user }: { user?: { name: string } }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const isActive = (href: string) => {
    return pathname.startsWith(href);
  };

  const logoutHandle = async () => {
    await authClient.signOut();
    router.replace("/");
    router.refresh();
  };

  return (
    <nav className="bg-white text-[#1d1d1f] shadow-sm sticky top-0 z-50 font-yekan transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 select-none">
          {/* --- RIGHT SIDE (RTL Start) --- */}
          <div className="flex items-center gap-4">
            {/* 1. Mobile Hamburger Button (Visible on Mobile/Tablet < lg) - Requested on Right */}
            <div className="lg:hidden z-50">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="group flex flex-col justify-center items-center w-10 h-10 gap-1.5 focus:outline-none"
                aria-label="Toggle menu"
              >
                <span
                  className={`block h-0.5 w-6 bg-navbar-secondary rounded-full transition-all duration-300 ease-in-out transform origin-center ${
                    isOpen ? "rotate-45 translate-y-2" : ""
                  }`}
                />
                <span
                  className={`block h-0.5 w-6 bg-navbar-secondary rounded-full transition-all duration-300 ease-in-out ${
                    isOpen ? "opacity-0 translate-x-full" : "opacity-100"
                  }`}
                />
                <span
                  className={`block h-0.5 w-6 bg-navbar-secondary rounded-full transition-all duration-300 ease-in-out transform origin-center ${
                    isOpen ? "-rotate-45 -translate-y-2" : ""
                  }`}
                />
              </button>
            </div>

            {/* 2. Desktop Brand: Logo + Text (Visible >= lg) */}
            <Link href="/" className="hidden lg:flex items-center gap-3 group">
              <div className="relative h-14 w-14">
                <Image
                  src="/assets/images/logo-asr.png"
                  alt="Clinic Logo"
                  fill
                  className="object-contain group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="flex flex-col items-start justify-center">
                <span className="text-navbar-secondary font-nastaliq text-5xl leading-tight -mt-1">
                  عصر سلامت
                </span>
              </div>
            </Link>
          </div>

          {/* --- CENTER: Desktop Navigation Links (Visible >= lg) --- */}
          <ul className="hidden lg:flex items-center space-x-6 space-x-reverse">
            {MENU_ITEMS.map((item) => (
              <li
                className={
                  isActive(item.href)
                    ? "isActive nav-link-container"
                    : "nav-link-container"
                }
                key={item.href}
              >
                <Link href={item.href}>
                  <div>{item.title}</div>
                </Link>
              </li>
            ))}
          </ul>

          {/* --- LEFT SIDE (RTL End) --- */}
          <div className="flex items-center">
            {/* 1. Mobile Logo (Visible < lg) - Requested on Left */}
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="lg:hidden relative h-12 w-12 block"
            >
              <Image
                src="/assets/images/logo-asr.png"
                alt="Clinic Logo"
                fill
                className="object-contain"
              />
            </Link>

            {/* 2. Desktop Auth Buttons (Visible >= lg) */}
            <div className="hidden lg:flex items-center gap-3">
              {!user ? (
                <Link
                  href="/login"
                  className={
                    isActive("/login")
                      ? "isActive nav-link-container"
                      : "nav-link-container"
                  }
                >
                  <div>ورود پرسنل</div>
                </Link>
              ) : (
                <>
                  <Link
                    href="/admin"
                    className={
                      isActive("/admin")
                        ? "isActive nav-link-container"
                        : "nav-link-container"
                    }
                  >
                    <div>پنل کاربری</div>
                  </Link>
                  <button
                    onClick={logoutHandle}
                    className="text-white text-sm rounded-full px-5 py-2 bg-navbar-secondary hover:bg-navbar-hover shadow-md hover:shadow-lg transition-all duration-300 font-bold"
                  >
                    خروج
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- Mobile Navigation Dropdown (Push Down Animation) --- */}
      {/* This is part of the flow (not fixed/absolute) so it pushes content down.
          It transitions max-height for a smooth "accordion" effect.
      */}
      <div
        className={`lg:hidden bg-white overflow-hidden transition-[max-height, opacity] duration-500 ease-in-out border-b border-gray-100 ${
          isOpen
            ? "max-h-[600px] opacity-100 shadow-inner"
            : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-6 py-6 space-y-3">
          {MENU_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-3 rounded-xl text-base font-bold transition-all duration-200 border border-transparent ${
                isActive(item.href)
                  ? "bg-navbar-secondary/5 text-navbar-secondary border-navbar-secondary/20 shadow-sm"
                  : "text-gray-600 hover:bg-gray-50 hover:text-navbar-secondary"
              }`}
            >
              {item.title}
            </Link>
          ))}

          {/* Mobile Auth Actions */}
          <div className="border-t border-gray-100 pt-5 mt-4 space-y-3">
            {!user ? (
              <Link
                href="/login"
                className={`flex items-center justify-center w-full px-4 py-3 rounded-xl text-base font-bold transition-all duration-200 ${
                  isActive("/login")
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