/* eslint-disable */
import FaqForm from "@/components/admin/cms/faq/faq-form";
import CmsBreadcrumbs from "@/components/admin/cms/ui/cms-bread-crumbs";

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
          { label: "سؤالات متداول", href: "/admin/cms/faq" },
          { label: "ویرایش" },
        ]}
        backHref="/admin/cms/faq"
      />
      {/* استفاده از id استخراج شده */}
      <FaqForm mode="edit" faqId={id} />
    </div>
  );
}
