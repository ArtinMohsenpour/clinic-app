import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Sidebar from "@/components/admin/sidebar/sidebar";
// import AdminHeader from "@/components/admin/header/header";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const raw = await headers();
  const session = await auth.api.getSession({ headers: raw });
  const user = session?.user;

  if (!user) redirect("/login");

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar (fixed on the left) */}
      <Sidebar user={user} />

      {/* Main content area */}
      <div className="flex flex-col flex-1">
        <main className="flex-1 p-2 ">{children}</main>
      </div>
    </div>
  );
}
