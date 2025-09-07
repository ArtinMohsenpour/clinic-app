import CmsBreadcrumbs from "@/components/admin/cms/ui/cms-bread-crumbs";
import PageForm from "@/components/admin/cms/static-pages/static-pages-form";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="space-y-4" dir="rtl">
      <CmsBreadcrumbs
        items={[
          { label: "CMS", href: "/admin/cms" },
          { label: "صفحات ایستا", href: "/admin/cms/static-pages" },
          { label: "ویرایش صفحه" },
        ]}
      />
      <PageForm mode="edit" pageId={id} />
    </div>
  );
}
