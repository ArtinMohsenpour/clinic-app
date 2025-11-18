import CmsBreadcrumbs from "@/components/admin/cms/ui/cms-bread-crumbs";
import PagesTable from "@/components/admin/cms/static-pages/static-pages-table";

export default function Page() {
  return (
    <div className="space-y-4" dir="rtl">
      <CmsBreadcrumbs
        items={[{ label: "CMS", href: "/admin/cms" }, { label: "صفحات ایستا" }]}
        backHref="/admin/cms"
      />
      <PagesTable />
    </div>
  );
}