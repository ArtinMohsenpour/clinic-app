import CmsBreadcrumbs from "@/components/admin/cms/ui/cms-bread-crumbs";
import ServiceForm from "@/components/admin/cms/services/services-form";

export default function Page() {
  return (
    <div className="space-y-4">
      <CmsBreadcrumbs
        items={[
          { label: "CMS", href: "/admin/cms" },
          { label: "خدمات", href: "/admin/cms/services" },
          { label: "ایجاد" },
        ]}
        backHref="/admin/cms/services"
      />
      <ServiceForm mode="new" />
    </div>
  );
}
