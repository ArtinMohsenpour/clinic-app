"use client";
import Link from "next/link";
import "./Navbar.css";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation"; // ✅ App Router
import { useEffect, useState } from "react";

export function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) => {
    return pathname === href
      ? "text-navbar-active border-b-[1px] border-navbar-active "
      : "hover:text-navbar-hover border-b-[1px] border-white";
  };

  useEffect(() => {
    const checkSession = async () => {
      const session = await authClient.getSession();
      if (session.data) {
        setIsLoggedIn(true);
      }
    };
    checkSession();
  }, [isLoggedIn]);

  const logoutHandle = async () => {
    await authClient.signOut();
    setIsLoggedIn(false);
    router.refresh();
    router.push("/");
  };

  return (
    <nav className="bg-[#ffffff] text-[#1d1d1f] shadow sticky top-0 z-50 font-yekan">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16 select-none">
        <div className="text-[14px]  min-w-fit font-yekan">
          <Link href="/">
            کلینیک و مرکز دیالیز
            <span className="text-navbar-secondary font-nastaliq text-5xl">
              عصر سلامت
            </span>
          </Link>
        </div>
        <ul className="hidden md:flex space-x-10  w-full mr-22">
          <li>
            <Link href="/services">
              <div className={isActive("/services")}>خدمات</div>
            </Link>
          </li>
          <li>
            <Link href="/about">
              <div className={isActive("/about")}>درباره ما</div>
            </Link>
          </li>
          <li>
            <Link href="/articles">
              <div className={isActive("/articles")}>مقالات</div>
            </Link>
          </li>
          <li>
            <Link href="/branches">
              <div className={isActive("/branches")}>شعبه‌ها</div>
            </Link>
          </li>
          <li>
            <Link href="/staff">
              <div className={isActive("/staff")}>پرسنل</div>
            </Link>
          </li>
          <li>
            <Link href="/contact">
              <div className={isActive("/contact")}>تماس با ما</div>
            </Link>
          </li>
          {!isLoggedIn && (
            <li>
              <Link href="/login">
                <div className={isActive("/login")}>ورود پرسنل</div>
              </Link>
            </li>
          )}

          {/* Show logout button if logged in */}
          {isLoggedIn && (
            <>
              <li>
                <Link href="/admin">
                  <div className={isActive("/admin")}>پنل کاربری</div>
                </Link>
              </li>
              <li>
                <button
                  onClick={logoutHandle}
                  className="border-2 text-white border-navbar-primary rounded-2xl px-2 bg-navbar-active hover:bg-navbar-secondary "
                >
                  <div>خروج از سایت</div>
                </button>
              </li>
            </>
          )}
        </ul>
        <div className="relative h-16 w-auto items-center justify-center flex">
          <Image
            src="/assets/images/logo-asr.png"
            alt="Clinic Logo"
            width={0}
            height={0}
            sizes="auto"
            className="h-14 w-auto object-contain"
          />
        </div>
      </div>
    </nav>
  );
}