import InsuranceTable from "@/components/admin/cms/insurances/insurances-table";
import CmsBreadcrumbs from "@/components/admin/cms/ui/cms-bread-crumbs";

export default function Page() {
  return (
    <div className="space-y-4">
      <CmsBreadcrumbs
        items={[{ label: "CMS", href: "/admin/cms" }, { label: "بیمه" }]}
        backHref="/admin/cms"
      />
      <InsuranceTable />
    </div>
  );
}
