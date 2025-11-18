// app/admin/cms/recent-activities/page.tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ACTIVITY_ALLOWED_ROLES } from "@/config/constants/rbac";
import CmsBreadcrumbs from "@/components/admin/cms/ui/cms-bread-crumbs";
import ActivityTable from "@/components/admin/cms/recent-activities/activities-table";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  // get session server-side
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login"); // or "/auth/login"

  // role check against the allow-list
  const canView = await prisma.user.findFirst({
    where: {
      id: session.user.id,
      roles: {
        some: { role: { key: { in: Array.from(ACTIVITY_ALLOWED_ROLES) } } },
      },
    },
    select: { id: true },
  });

  if (!canView) {
    // choose your UX: redirect to CMS home or 404
    redirect("/admin/cms");
    // or: notFound();
  }

  return (
    <div className="space-y-4">
      <CmsBreadcrumbs
        items={[{ label: "CMS", href: "/admin/cms" }, { label: "فعالیت‌ها" }]}
        backHref="/admin/cms"
      />
      <ActivityTable />
    </div>
  );
}
