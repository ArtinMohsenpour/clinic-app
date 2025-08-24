import FaqForm from "@/components/admin/cms/faq/faq-form";
import CmsBreadcrumbs from "@/components/admin/cms/ui/cms-bread-crumbs";

export default function Page() {
  return (
    <div className="space-y-4">
      <CmsBreadcrumbs
        items={[
          { label: "CMS", href: "/admin/cms" },
          { label: "سؤالات متداول", href: "/admin/cms/faq" },
          { label: "ایجاد" },
        ]}
        backHref="/admin/cms/faq"
      />
      <FaqForm mode="create" />
    </div>
  );
}
