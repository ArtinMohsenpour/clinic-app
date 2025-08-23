import NewsForm from "@/components/admin/cms/news/news-form";
import CmsBreadcrumbs from "@/components/admin/cms/ui/cms-bread-crumbs";

export default function Page({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-4">
      <CmsBreadcrumbs
        items={[
          { label: "CMS", href: "/admin/cms" },
          { label: "اخبار", href: "/admin/cms/news" },
          { label: "ویرایش خبر" },
        ]}
      />
      <NewsForm mode="edit" newsId={params.id} />
    </div>
  );
}
