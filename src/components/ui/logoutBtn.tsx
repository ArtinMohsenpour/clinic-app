"use client";
import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await authClient.signOut();
      setIsLoggedIn(false);
      router.refresh();
      router.push("/");

      // Redirect to login page after logout
    } catch (error) {
      console.error("Logout failed:", error);
    }

    return (
      <button
        onClick={handleLogout}
        className="w-fit text-sm bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition"
      >
        خروج از سایت
      </button>
    );
  };
}
