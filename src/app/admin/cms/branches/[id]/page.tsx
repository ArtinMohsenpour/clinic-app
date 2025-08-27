// src/app/admin/cms/branches/[id]/page.tsx
import CmsBreadcrumbs from "@/components/admin/cms/ui/cms-bread-crumbs";
import BranchCmsForm from "@/components/admin/cms/branches/branch-cms-form";

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  return (
    <div className="space-y-4">
      <CmsBreadcrumbs
        items={[
          { href: "/admin/cms", label: "CMS" },
          { href: "/admin/cms/branches", label: "شعب" },
          { label: "ویرایش محتوا" },
        ]}
        backHref="/admin/cms/branches"
      />
      <BranchCmsForm mode="edit" id={id} />
    </div>
  );
}
