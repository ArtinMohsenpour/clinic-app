// app/admin/cms/articles/page.tsx
import ArticleTable from "@/components/admin/cms/articles/articles-table";
import CmsBreadcrumbs from "@/components/admin/cms/ui/cms-bread-crumbs";

export default function Page() {
  return (
    <div className="space-y-4">
      <CmsBreadcrumbs
        items={[{ label: "CMS", href: "/admin/cms" }, { label: "مقالات" }]}
        // on list page, back should go to CMS home
        backHref="/admin/cms"
      />
      <ArticleTable />
    </div>
  );
}
