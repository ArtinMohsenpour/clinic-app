// src/app/admin/cms/layout.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CMS_ALLOWED_ROLES } from "@/config/constants/rbac";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default async function CmsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const raw = await headers();
  const session = await auth.api.getSession({ headers: raw });

  if (!session?.user?.email) {
    redirect("/login");
  }

  // Fetch user roles from DB to be secure
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      isActive: true,
      roles: {
        select: {
          role: {
            select: { key: true },
          },
        },
      },
    },
  });

  if (!user || !user.isActive) {
    redirect("/login");
  }

  // Check if user has ANY allowed role for CMS
  const userRoleKeys = user.roles.map((r) => r.role.key);
  const hasAccess = userRoleKeys.some((key) => CMS_ALLOWED_ROLES.has(key));

  if (!hasAccess) {
    // Redirect to admin dashboard if authorized for admin but not CMS,
    // or show a 403 page. For now, redirecting to dashboard is safer.
    redirect("/admin?error=unauthorized_scope");
  }

  return <>{children}</>;
}
