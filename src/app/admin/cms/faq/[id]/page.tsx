import FaqForm from "@/components/admin/cms/faq/faq-form";
import CmsBreadcrumbs from "@/components/admin/cms/ui/cms-bread-crumbs";

export default function Page({ params }: { params: { id: string } }) {
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
      <FaqForm mode="edit" faqId={params.id} />
    </div>
  );
}
