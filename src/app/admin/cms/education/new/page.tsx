// src/app/admin/cms/education/new/page.tsx
import EducationForm from "@/components/admin/cms/education/education-form";
import CmsBreadCrumbs from "@/components/admin/cms/ui/cms-bread-crumbs";

export default function Page() {
  return (
    <div className="space-y-4">
      <CmsBreadCrumbs
        items={[
          { href: "/admin/cms", label: "CMS" },
          { href: "/admin/cms/education", label: "آموزش بیماران" },
          { label: "ایجاد" },
        ]}
      />
      <EducationForm mode="create" />
    </div>
  );
}
