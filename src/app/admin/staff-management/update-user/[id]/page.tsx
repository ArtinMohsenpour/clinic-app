import EditUserForm from "@/components/admin/staff-management/edit-user-form";

export default function Page({ params }: { params: { id: string } }) {
  return <EditUserForm userId={params.id} />;
}
