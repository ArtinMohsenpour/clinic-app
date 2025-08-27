import CmsBreadcrumbs from "@/components/admin/cms/ui/cms-bread-crumbs";
import ServiceForm from "@/components/admin/cms/services/services-form";

export default function Page({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-4">
      <CmsBreadcrumbs
        items={[
          { label: "CMS", href: "/admin/cms" },
          { label: "خدمات", href: "/admin/cms/services" },
          { label: "ویرایش" },
        ]}
        backHref="/admin/cms/services"
      />
      <ServiceForm mode="edit" id={params.id} />
    </div>
  );
}
