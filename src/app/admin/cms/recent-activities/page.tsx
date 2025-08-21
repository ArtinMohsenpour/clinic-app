// app/admin/cms/recent-activities/page.tsx
import CmsBreadcrumbs from "@/components/admin/cms/ui/cms-bread-crumbs";
import ActivityTable from "@/components/admin/cms/recent-activities/activities-table";

export default function Page() {
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
