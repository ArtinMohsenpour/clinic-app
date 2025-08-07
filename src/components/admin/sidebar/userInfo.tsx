"use client";
import { authClient } from "@/lib/auth-client";
import {
  LayoutDashboard,
  User as UserLogo,
  ShieldCheck as Badge,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { User } from "@/config/types/auth/types";

export default function UserInfo({ user }: { user: User }) {
  const router = useRouter();

  const logoutHandle = async () => {
    await authClient.signOut();
    window.location.href = "/";
    router.push("/");
  };

  return (
    <div className="w-64 flex flex-col h-fit select-none">
      {/* Top section: User info */}
      <div className="py-4 px-6 ">
        <div className="text-2xl flex items-center gap-1 font-semibold mb-2">
          <LayoutDashboard className="w-4 h-4" /> پنل مدیریت
        </div>

        <div className="mb-2 flex items-center gap-2 text-gray-700">
          <UserLogo className="w-5 h-5" />
          <div className="flex flex-row gap-2 w-full items-center">
            <span className="text-md font-bold items-center">کاربر:</span>
            <span className="text-sm">{user.name}</span>
          </div>
        </div>

        <div className="mb-2 flex items-center gap-2 text-gray-700">
          <Badge className="w-5 h-5" />
          <div className="flex flex-row gap-2  w-full items-center">
            <span className="text-md font-bold items-center">نقش:</span>
            <span className="text-sm">{user.role?.name}</span>
          </div>
        </div>

        <button
          onClick={logoutHandle}
          className="w-fit text-[12px] bg-red-500 hover:bg-red-700 text-white  px-3 py-[3px] rounded-lg cursor-pointer transition"
        >
          خروج
        </button>
      </div>
    </div>
  );
}
