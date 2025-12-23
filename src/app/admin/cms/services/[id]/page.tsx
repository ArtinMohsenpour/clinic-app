/* eslint-disable */
import CmsBreadcrumbs from "@/components/admin/cms/ui/cms-bread-crumbs";
import ServiceForm from "@/components/admin/cms/services/services-form";

// در Next.js 15 تابع باید async باشد و params به صورت Promise تعریف شود
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // استخراج id با استفاده از await
  const { id } = await params;

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
      {/* استفاده از id استخراج شده */}
      <ServiceForm mode="edit" id={id} />
    </div>
  );
}
