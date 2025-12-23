/* eslint-disable */
import CmsBreadcrumbs from "@/components/admin/cms/ui/cms-bread-crumbs";
import FormFileForm from "@/components/admin/cms/forms/form-file-form";

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
          { href: "/admin/cms", label: "CMS" },
          { href: "/admin/cms/forms", label: "فرم‌ها و فایل‌ها" },
          { label: "ویرایش" },
        ]}
      />
      {/* استفاده از id استخراج شده */}
      <FormFileForm mode="edit" formId={id} />
    </div>
  );
}
