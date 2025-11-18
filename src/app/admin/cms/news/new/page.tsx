import NewsForm from "@/components/admin/cms/news/news-form";
import CmsBreadcrumbs from "@/components/admin/cms/ui/cms-bread-crumbs";

export default function Page() {
  return (
    <div className="space-y-4">
      <CmsBreadcrumbs
        items={[
          { label: "CMS", href: "/admin/cms" },
          { label: "اخبار", href: "/admin/cms/news" },
          { label: "خبر جدید" },
        ]}
      />
      <NewsForm mode="create" />
    </div>
  );
}
