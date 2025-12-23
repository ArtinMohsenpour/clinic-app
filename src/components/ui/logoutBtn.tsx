"use client";
/* eslint-disable */
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await authClient.signOut();
      router.refresh();
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="w-fit text-sm bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition"
    >
      خروج از سایت
    </button>
  );
}