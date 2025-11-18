// src/app/admin/cms/branches/page.tsx
import CmsBreadcrumbs from "@/components/admin/cms/ui/cms-bread-crumbs";
import BranchesListClient from "@/components/admin/cms/branches/branches-list-client";

export default function Page() {
  return (
    <div className="space-y-4">
      <CmsBreadcrumbs
        items={[
          { label: "CMS", href: "/admin/cms" },
          { label: "محتوای شعبه‌ها" },
        ]}
        backHref="/admin/cms"
      />
      <BranchesListClient />
    </div>
  );
}
