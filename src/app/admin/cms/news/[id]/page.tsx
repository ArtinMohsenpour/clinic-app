import NewsForm from "@/components/admin/cms/news/news-form";
import CmsBreadcrumbs from "@/components/admin/cms/ui/cms-bread-crumbs";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="space-y-4">
      <CmsBreadcrumbs
        items={[
          { label: "CMS", href: "/admin/cms" },
          { label: "اخبار", href: "/admin/cms/news" },
          { label: "ویرایش خبر" },
        ]}
      />
      <NewsForm mode="edit" newsId={id} />
    </div>
  );
}
