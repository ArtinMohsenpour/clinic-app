import FaqTable from "@/components/admin/cms/faq/faq-table";
import CmsBreadcrumbs from "@/components/admin/cms/ui/cms-bread-crumbs";

export default function Page() {
  return (
    <div className="space-y-4">
      <CmsBreadcrumbs
        items={[{ label: "CMS", href: "/admin/cms" }, { label: "سؤالات متداول" }]}
        backHref="/admin/cms"
      />
      <FaqTable />
    </div>
  );
}
