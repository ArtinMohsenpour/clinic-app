import NewsTable from "@/components/admin/cms/news/news-table";
import CmsBreadcrumbs from "@/components/admin/cms/ui/cms-bread-crumbs";

export default function Page() {
  return (
    <div className="space-y-4">
      <CmsBreadcrumbs
        items={[{ label: "CMS", href: "/admin/cms" }, { label: "اخبار" }]}
        // on list page, back should go to CMS home
        backHref="/admin/cms"
      />
      <NewsTable />
    </div>
  );
}
