// admin/page.tsx
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const raw = await headers();
  const plain = new Headers(raw as HeadersInit); // convert to a real Headers
  const session = await auth.api.getSession({ headers: plain });
  const user = session?.user;
  if (!user) redirect("/login");

  return (
    <div className="p-8 w-full bg-[#ffffff] rounded-lg shadow-md h-full">
      <h1 className="text-2xl font-bold">داشبورد مدیریت</h1>
      <p>
        <strong>نام:</strong> {user.name}
      </p>
      <p>
        <strong>ایمیل:</strong> {user.email}
      </p>
      <form action="/api/auth/sign-out" method="POST" className="mt-4">
        <button className="bg-red-500 text-white px-4 py-2 rounded">
          خروج
        </button>
      </form>
    </div>
  );
}
