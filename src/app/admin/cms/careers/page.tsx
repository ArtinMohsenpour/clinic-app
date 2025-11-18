import CareersTable from "@/components/admin/cms/careers/careers-table";
import CmsBreadCrumbs from "@/components/admin/cms/ui/cms-bread-crumbs";

export default function Page() {
  return (
    <div className="space-y-4">
      <CmsBreadCrumbs
        items={[
          { href: "/admin/cms", label: "CMS" },
          { label: "فرصت‌های شغلی" },
        ]}
      />
      <CareersTable />
    </div>
  );
}