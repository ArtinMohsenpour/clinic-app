import ArticleForm from "@/components/admin/cms/articles/articles-form";

import CmsBreadcrumbs from "@/components/admin/cms/ui/cms-bread-crumbs";
import { prisma } from "@/lib/prisma";

export default async function Page({ params }: { params: { id: string } }) {
  const a = await prisma.article.findUnique({
    where: { id: params.id },
    select: { title: true, slug: true },
  });

  return (
    <div className="space-y-4 ">
      <CmsBreadcrumbs
        items={[
          { label: "CMS", href: "/admin/cms" },
          { label: "مقالات", href: "/admin/cms/articles" },
          { label: a?.title || "ویرایش مقاله" },
        ]}
        backHref="/admin/cms/articles"
      />

      <ArticleForm mode="edit" articleId={params.id} />
    </div>
  );
}
