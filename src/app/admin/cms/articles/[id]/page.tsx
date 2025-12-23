/* eslint-disable */
import ArticleForm from "@/components/admin/cms/articles/articles-form";
import CmsBreadcrumbs from "@/components/admin/cms/ui/cms-bread-crumbs";
import { prisma } from "@/lib/prisma";

// نوع params را به Promise تغییر می‌دهیم
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // مقدار id را با await استخراج می‌کنیم
  const { id } = await params;

  const a = await prisma.article.findUnique({
    where: { id: id },
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

      {/* از id استخراج شده استفاده می‌کنیم */}
      <ArticleForm mode="edit" articleId={id} />
    </div>
  );
}
