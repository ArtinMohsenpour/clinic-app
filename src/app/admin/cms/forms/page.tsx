import CmsBreadcrumbs from "@/components/admin/cms/ui/cms-bread-crumbs";
import FormsTable from "@/components/admin/cms/forms/forms-table";

export default function Page() {
  return (
    <div className="space-y-4">
      <CmsBreadcrumbs items={[{ label: "CMS", href: "/admin/cms" }, { label: "فرم‌ها و فایل‌ها" }]} backHref="/admin/cms" />
      <FormsTable />
    </div>
  );
}