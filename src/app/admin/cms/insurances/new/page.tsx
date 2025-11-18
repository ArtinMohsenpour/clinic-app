import InsuranceForm from "@/components/admin/cms/insurances/insurances-form";
import CmsBreadcrumbs from "@/components/admin/cms/ui/cms-bread-crumbs";

export default function Page() {
  return (
    <div className="space-y-4">
      <CmsBreadcrumbs
        items={[
          { label: "CMS", href: "/admin/cms" },
          { label: "بیمه", href: "/admin/cms/insurances" },
          { label: "بیمه جدید" },
        ]}
      />
      <InsuranceForm mode="create" />
    </div>
  );
}
