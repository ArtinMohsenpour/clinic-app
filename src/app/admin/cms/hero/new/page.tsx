import CmsBreadcrumbs from "@/components/admin/cms/ui/cms-bread-crumbs";
import HeroSlideForm from "@/components/admin/cms/hero/hero-slide-form";

export default function Page() {
  return (
    <div className="space-y-4">
      <CmsBreadcrumbs
        items={[
          { label: "CMS", href: "/admin/cms" },
          { label: "اسلایدر", href: "/admin/cms/hero" },
          { label: "اسلاید جدید" },
        ]}
      />
      <HeroSlideForm mode="create" />
    </div>
  );
}
