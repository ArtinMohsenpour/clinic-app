import ArticleForm from "@/components/admin/cms/articles/articles-form";

import CmsBreadcrumbs from "@/components/admin/cms/ui/cms-bread-crumbs";

export default function Page() {
  return (
    <div className="space-y-4">
      <CmsBreadcrumbs
        items={[
          { label: "CMS", href: "/admin/cms" },
          { label: "مقالات", href: "/admin/cms/articles" },
          { label: "ایجاد مقاله" },
        ]}
        backHref="/admin/cms/articles"
      />

      <ArticleForm mode="create" />
    </div>
  );
}
