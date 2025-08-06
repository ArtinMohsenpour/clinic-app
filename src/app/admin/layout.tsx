import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const raw = await headers();
  const session = await auth.api.getSession({ headers: raw });
  const user = session?.user;

  if (!user) redirect("/auth/login");

  return (
    <div className="admin-layout">
      {/* Add Sidebar / Header */}
      {children}
    </div>
  );
}
