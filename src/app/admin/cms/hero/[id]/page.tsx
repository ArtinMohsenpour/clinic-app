import CmsBreadcrumbs from "@/components/admin/cms/ui/cms-bread-crumbs";
import HeroSlideForm from "@/components/admin/cms/hero/hero-slide-form";

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
          { label: "اسلایدر", href: "/admin/cms/hero" },
          { label: "ویرایش اسلاید" },
        ]}
      />
      <HeroSlideForm mode="edit" slideId={id} />
    </div>
  );
}
