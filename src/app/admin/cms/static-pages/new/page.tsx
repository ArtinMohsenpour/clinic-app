import CmsBreadcrumbs from "@/components/admin/cms/ui/cms-bread-crumbs";
import PageForm from "@/components/admin/cms/static-pages/static-pages-form";

export default function Page() {
  return (
    <div className="space-y-4" dir="rtl">
      <CmsBreadcrumbs
        items={[
          { label: "CMS", href: "/admin/cms" },
          { label: "صفحات ایستا", href: "/admin/cms/static-pages" },
          { label: "صفحه جدید" },
        ]}
      />
      <PageForm mode="create" />
    </div>
  );
}
