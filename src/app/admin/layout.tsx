import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Sidebar from "@/components/admin/sidebar/sidebar";
import { prisma } from "@/lib/prisma";
import { User } from "@/config/types/auth/types";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const raw = await headers();
  const session = await auth.api.getSession({ headers: raw });
  if (!session?.user?.email) redirect("/login");
  const email = session.user.email;

  // Fetch user data from the database
  const dbUser = await prisma.user.findUnique({
    where: { email },
    include: { role: true }, // scalars come by default
  });

  if (!dbUser) redirect("/login");

  const userForClient: User = {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    emailVerified: dbUser.emailVerified,
    image: dbUser.image,
    phone: dbUser.phone ?? null,
    address: dbUser.address ?? null,
    createdAt: dbUser.createdAt.toISOString(),
    updatedAt: dbUser.updatedAt.toISOString(),
    role: dbUser.role ? { id: dbUser.role.id, name: dbUser.role.name } : null,
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar (fixed on the left) */}
      <Sidebar user={userForClient} />

      {/* Main content area */}
      <div className="flex flex-col flex-1">
        <main className="flex-1 p-2 ">{children}</main>
      </div>
    </div>
  );
}
