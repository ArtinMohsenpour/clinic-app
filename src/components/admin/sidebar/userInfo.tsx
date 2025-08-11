"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import type { User } from "@/config/types/auth/types";
import {
  LayoutDashboard,
  User as UserIcon,
  ShieldCheck as Badge,
} from "lucide-react";

export default function UserInfo({ user }: { user: User }) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logoutHandle = useCallback(async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setError(null);
    try {
      await authClient.signOut();
      router.replace("/"); // single, reliable navigation
      router.refresh(); // optional: clear client cache
    } catch (e) {
      setError(
        "خروج ناموفق بود. لطفاً دوباره تلاش کنید." +
          (e instanceof Error ? `: ${e.message}` : "")
      );
    } finally {
      setIsLoggingOut(false);
    }
  }, [isLoggingOut, router]);

  return (
    <section className="w-64 flex flex-col h-fit select-none">
      <div className="py-4 px-6">
        <header className="text-2xl flex items-center gap-2 font-semibold mb-3">
          <LayoutDashboard className="w-5 h-5" />
          <span>پنل مدیریت</span>
        </header>

        <div className="mb-2 flex items-center gap-2 text-gray-700">
          <UserIcon className="w-5 h-5" />
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-md font-bold">کاربر:</span>
            <span className="text-sm truncate" title={user?.name ?? "—"}>
              {user?.name ?? "—"}
            </span>
          </div>
        </div>

        <div className="mb-3 flex items-center gap-2 text-gray-700">
          <Badge className="w-5 h-5" />
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-md font-bold">نقش:</span>
            <span className="text-sm truncate" title={user?.role?.name ?? "—"}>
              {user?.role?.name ?? "—"}
            </span>
          </div>
        </div>

        {error && (
          <p className="text-red-600 text-xs mb-2" role="alert">
            {error}
          </p>
        )}

        <button
          onClick={logoutHandle}
          disabled={isLoggingOut}
          aria-label="خروج از حساب"
          className="w-fit text-[12px] bg-red-500 hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed text-white cursor-pointer px-3 py-[6px] rounded-lg transition focus:outline-none focus:ring-2 focus:ring-red-300"
        >
          {isLoggingOut ? "خروج..." : "خروج"}
        </button>
      </div>
    </section>
  );
}
