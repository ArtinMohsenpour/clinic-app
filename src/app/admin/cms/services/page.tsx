import ServicesTable from "@/components/admin/cms/services/services-table";
import CmsBreadcrumbs from "@/components/admin/cms/ui/cms-bread-crumbs";

export default function Page() {
  return (
    <div className="space-y-4">
      <CmsBreadcrumbs
        items={[{ label: "CMS", href: "/admin/cms" }, { label: "خدمات" }]}
        backHref="/admin/cms"
      />
      <ServicesTable />
    </div>
  );
}
