// src/app/admin/cms/education/page.tsx
import EducationTable from "@/components/admin/cms/education/education-table";
import CmsBreadCrumbs from "@/components/admin/cms/ui/cms-bread-crumbs";

export default function Page() {
  return (
    <div className="space-y-4">
      <CmsBreadCrumbs
        items={[
          { href: "/admin/cms", label: "CMS" },
          { label: "آموزش بیماران" },
        ]}
      />
      <EducationTable />
    </div>
  );
}
