import CareersForm from "@/components/admin/cms/careers/careers-form";
import CmsBreadCrumbs from "@/components/admin/cms/ui/cms-bread-crumbs";

export default function Page() {
  return (
    <div className="space-y-4">
      <CmsBreadCrumbs
        items={[
          { href: "/admin/cms", label: "CMS" },
          { href: "/admin/cms/careers", label: "فرصت‌های شغلی" },
          { label: "ایجاد آگهی جدید" },
        ]}
      />
      <CareersForm mode="create" />
    </div>
  );
}