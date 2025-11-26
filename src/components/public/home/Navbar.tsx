"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
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

  const isActive = (href: string) => {
    return pathname.startsWith(href);
  };

  const logoutHandle = async () => {
    await authClient.signOut();
    router.replace("/");
    router.refresh();
  };

  return (
    <nav className="bg-[#ffffff] text-[#1d1d1f] shadow sticky top-0 z-50 font-yekan">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16 select-none">
        {/* Brand / Logo Text */}
        <div className="text-[14px] min-w-fit font-yekan">
          <Link href="/">
            کلینیک و مرکز دیالیز
            <span className="text-navbar-secondary font-nastaliq text-5xl">
              عصر سلامت
            </span>
          </Link>
        </div>

        {/* Navigation Links */}
        <ul className="hidden md:flex space-x-6 w-full mr-22">
          {/* Loop through static menu items */}
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

          {/* Conditional Auth Items */}
          {!user ? (
            <li
              className={
                isActive("/login")
                  ? "isActive nav-link-container"
                  : "nav-link-container"
              }
            >
              <Link href="/login">
                <div>ورود پرسنل</div>
              </Link>
            </li>
          ) : (
            <>
              <li
                className={
                  isActive("/admin")
                    ? "isActive nav-link-container"
                    : "nav-link-container"
                }
              >
                <Link href="/admin">
                  <div>پنل کاربری</div>
                </Link>
              </li>
              <li>
                <button
                  onClick={logoutHandle}
                  className="text-white text-sm rounded-2xl px-3 py-[4px] bg-navbar-primary hover:bg-navbar-secondary cursor-pointer transition duration-300"
                >
                  <div>خروج از سایت</div>
                </button>
              </li>
            </>
          )}
        </ul>

        {/* Logo Image */}
        <div className="relative h-16 w-20 items-center justify-center flex">
          <Image
            src="/assets/images/logo-asr.png"
            alt="Clinic Logo"
            width={0}
            height={0}
            sizes="auto"
            className="h-16 w-fit object-contain"
          />
        </div>
      </div>
    </nav>
  );
}