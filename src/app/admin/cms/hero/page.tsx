import CmsBreadcrumbs from "@/components/admin/cms/ui/cms-bread-crumbs";
import HeroSlidesTable from "@/components/admin/cms/hero/hero-slides-table";

export default function Page() {
  return (
    <div className="space-y-4" dir="rtl">
      <CmsBreadcrumbs
        items={[
          { label: "CMS", href: "/admin/cms" },
          { label: "اسلایدر صفحه اصلی" },
        ]}
        backHref="/admin/cms"
      />
      <HeroSlidesTable />
    </div>
  );
}
