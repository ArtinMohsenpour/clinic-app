import EditUserForm from "@/components/admin/staff-management/edit-user-form";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // <- await the params
  return <EditUserForm userId={id} />;
}
