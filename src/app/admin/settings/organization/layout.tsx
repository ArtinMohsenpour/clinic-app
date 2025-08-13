import Tabs from "@/components/admin/settings/tabs";

// app/admin/settings/organization/layout.tsx

export default function OrganizationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4 p-6 bg-white shadow-sm rounded-2xl" dir="rtl">
      <h1 className="text-2xl font-semibold text-cms-primary">سازمان</h1>
      <Tabs />
      <div>{children}</div>
    </div>
  );
}
