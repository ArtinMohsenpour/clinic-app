import CmsBreadcrumbs from "@/components/admin/cms/ui/cms-bread-crumbs";
import EditUserForm from "@/components/admin/staff-management/edit-user-form";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // <- await the params
  return (
    <div className="space-y-4">
      <CmsBreadcrumbs
        items={[
          { label: "مدیریت کارکنان", href: "/admin/staff-management" },
          { label: "ایجاد کاربر جدید", href: "/admin/create-user" },
        ]}
      />{" "}
      <EditUserForm userId={id} />
    </div>
  );
}
